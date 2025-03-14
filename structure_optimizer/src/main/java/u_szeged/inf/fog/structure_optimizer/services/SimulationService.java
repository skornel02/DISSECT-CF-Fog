package u_szeged.inf.fog.structure_optimizer.services;

import com.github.benmanes.caffeine.cache.Caffeine;
import com.github.benmanes.caffeine.cache.LoadingCache;
import hu.mta.sztaki.lpds.cloud.simulator.Timed;
import hu.mta.sztaki.lpds.cloud.simulator.iaas.constraints.AlterableResourceConstraints;
import hu.mta.sztaki.lpds.cloud.simulator.io.VirtualAppliance;
import hu.u_szeged.inf.fog.simulator.agent.ResourceAgent;
import hu.u_szeged.inf.fog.simulator.application.Application;
import hu.u_szeged.inf.fog.simulator.demo.ScenarioBase;
import hu.u_szeged.inf.fog.simulator.iot.Device;
import hu.u_szeged.inf.fog.simulator.iot.Sensor;
import hu.u_szeged.inf.fog.simulator.iot.SmartDevice;
import hu.u_szeged.inf.fog.simulator.iot.mobility.GeoLocation;
import hu.u_szeged.inf.fog.simulator.iot.mobility.MobilityEvent;
import hu.u_szeged.inf.fog.simulator.node.ComputingAppliance;
import hu.u_szeged.inf.fog.simulator.node.WorkflowComputingAppliance;
import hu.u_szeged.inf.fog.simulator.provider.Instance;
import hu.u_szeged.inf.fog.simulator.provider.Provider;
import hu.u_szeged.inf.fog.simulator.util.EnergyDataCollector;
import hu.u_szeged.inf.fog.simulator.util.SimLogger;
import hu.u_szeged.inf.fog.simulator.util.xml.WorkflowJobModel;
import hu.u_szeged.inf.fog.simulator.workflow.WorkflowExecutor;
import hu.u_szeged.inf.fog.simulator.workflow.WorkflowJob;
import hu.u_szeged.inf.fog.simulator.workflow.aco.CentralisedAntOptimiser;
import hu.u_szeged.inf.fog.simulator.workflow.scheduler.MaxMinScheduler;
import hu.u_szeged.inf.fog.simulator.workflow.scheduler.WorkflowScheduler;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.tuple.Pair;
import org.springframework.stereotype.Service;
import u_szeged.inf.fog.structure_optimizer.enums.SimulationStatus;
import u_szeged.inf.fog.structure_optimizer.models.SimulationCacheKey;
import u_szeged.inf.fog.structure_optimizer.models.SimulationComputerInstance;
import u_szeged.inf.fog.structure_optimizer.models.SimulationModel;
import u_szeged.inf.fog.structure_optimizer.models.SimulationResult;
import u_szeged.inf.fog.structure_optimizer.utils.SimpleLogHandler;

import javax.xml.bind.JAXBException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;
import java.util.logging.Level;
import java.util.regex.Pattern;

@Slf4j
@Service
public class SimulationService implements ISimulationService {

    private static final Lock lock = new ReentrantLock();

    private static final ExecutorService executorService = Executors.newFixedThreadPool(1);

    private static final LoadingCache<SimulationCacheKey, SimulationResult> simulationCache = Caffeine.newBuilder()
            .expireAfterWrite(Duration.ofHours(1))
            .weigher((SimulationCacheKey key, SimulationResult value) -> key.structure().size())
            .maximumWeight(10_000)
            .build(a -> null);


    public SimulationService() {
    }


    public SimulationResult runSimulation(SimulationModel model, int tasksMultiplier) {
        var cacheKey = new SimulationCacheKey(model.getInstances(), tasksMultiplier);
        var cachedResult = simulationCache.getIfPresent(cacheKey);
        if (cachedResult != null) {
            log.info("Simulation result found in cache!");
            return cachedResult;
        }

        var resultBuiilder = SimulationResult.builder()
                .id(model.getId());

        var logs = new StringBuffer();

        lock.lock();
        model.setStatus(SimulationStatus.Processing);

        var logHandler = new SimpleLogHandler(log -> {
            logs.append(log.getLevel().toString())
                    .append(" | ")
                    .append(log.getMessage())
                    .append("\n");
        });
        SimLogger.simLogger.addHandler(logHandler);
        SimLogger.setLogging(2, false);

        var invalidStructure = false;

        try {

            var workflowArchitecture = getWorkflowArchitecture(model);

            log.info("Workflow architecture created");

            if (workflowArchitecture.isEmpty()) {
                invalidStructure = true;
            } else {
//                WorkflowComputingAppliance.setDistanceBasedLatency();

                for (var appliance : workflowArchitecture.keySet()) {
                    new EnergyDataCollector(appliance.name, appliance.iaas, true);
                }

                log.info("Energy data collectors created");

                WorkflowExecutor executor = WorkflowExecutor.getIstance();

                var workflowFile = ScenarioBase.resourcePath + "/WORKFLOW_examples/IoT_CyberShake_100.xml";
                var jobs = WorkflowJobModel.loadWorkflowXml(workflowFile, "Simulation");

                var nextTasks = new ArrayList<WorkflowJob>();

                for (var i = 0; i < tasksMultiplier; i++) {
                    nextTasks.addAll(jobs.getValue());
                }

                jobs = Pair.ofNonNull("Simulation", nextTasks);

                log.info("Workflow jobs created");

                executor.submitJobs(new MaxMinScheduler(new ArrayList<>(workflowArchitecture.keySet()), workflowArchitecture, null, jobs));

                var task = new CompletableFuture<Boolean>();

                log.info("Starting simulation...");

                executorService.submit(() -> {
                    Timed.simulateUntilLastEvent();
                    task.complete(true);
                });

                task.get(1, TimeUnit.MINUTES);
            }
        } catch (TimeoutException e) {
            SimLogger.simLogger.log(Level.SEVERE, "Event simulation timed out!", e);

            resultBuiilder = resultBuiilder.exception(new Exception("Event simulation timed out!"));
        } catch (Exception e) {
            SimLogger.simLogger.log(Level.SEVERE, e.getMessage(), e);

            resultBuiilder = resultBuiilder.exception(e);
        } finally {
            if (!invalidStructure) {

                var scheduler = WorkflowScheduler.schedulers.getFirst();
                SimLogger.logRes("App: " + scheduler.appName);

                var totalTasks = scheduler.jobs.size();
                var completedTasks = (int) scheduler.jobs.stream()
                        .filter(wj -> wj.state == WorkflowJob.State.COMPLETED)
                        .count();
                SimLogger.logRes("Completed: " + completedTasks + "/" + totalTasks);

                var executionTime = (scheduler.stopTime - scheduler.startTime);
                SimLogger.logRes("Execution time (min.): " + executionTime);

                SimLogger.logRes("Task distribution: ");
                for (Map.Entry<String, Integer> entry : scheduler.vmTaskLogger.entrySet()) {
                    SimLogger.logRes("\t" + entry.getKey() + " - " + entry.getValue() + " taks");
                }

                double price = 0.0;
                double energyConsumption = 0.0;

                SimLogger.logRes("Computers: ");
                for (WorkflowComputingAppliance ca : scheduler.computeArchitecture) {
                    var caPrice = scheduler.instanceMap.get(ca).calculateCloudCost(executionTime);
                    var collector = EnergyDataCollector.getEnergyCollector(ca.iaas);
                    var caEnergyConsumption = collector != null
                            ? collector.energyConsumption
                            : 0.0;

                    price += caPrice;
                    energyConsumption += caEnergyConsumption;

                    SimLogger.logRes("\t" + ca.name + ":");
                    SimLogger.logRes("\t\t Price per tick (EUR): " + scheduler.instanceMap.get(ca).pricePerTick);
                    SimLogger.logRes("\t\t Total price (EUR): " + caPrice);
                    SimLogger.logRes("\t\t Energy consumption (J): " + caEnergyConsumption);
                }

                energyConsumption /= 1000d * 3_000_000d;

                SimLogger.logRes("");
                SimLogger.logRes("Cost (EUR): " + price);
                SimLogger.logRes("Total energy (kWh): " + energyConsumption);
                SimLogger.logRes("Total time on network (seconds): "
                        + TimeUnit.SECONDS.convert(scheduler.timeOnNetwork, TimeUnit.MILLISECONDS));
                SimLogger.logRes("Total bytes on network (MB): " + scheduler.bytesOnNetwork / 1024 / 1024);


                resultBuiilder = resultBuiilder
                        .totalCost(price)
                        .totalEnergyConsumption(energyConsumption)
                        .totalTasks(totalTasks)
                        .completedTasks(completedTasks)
                        .executionTime(executionTime);

                if (totalTasks > completedTasks) {
                    resultBuiilder = resultBuiilder.exception(new Exception("Not all tasks were completed"));
                }

            } else {
                resultBuiilder = resultBuiilder.exception(new Exception("Invalid structure"));
            }

            Timed.resetTimed();

            WorkflowScheduler.schedulers.clear();
            WorkflowJob.workflowJobs.clear();

            if (WorkflowExecutor.workflowSchedulers != null) {
                WorkflowExecutor.workflowSchedulers.clear();
            }

            ComputingAppliance.allComputingAppliances.clear();

            ResourceAgent.resourceAgents.clear();

            Application.allApplications.clear();
            Application.totalTimeOnNetwork = 0;
            Application.totalBytesOnNetwork = 0;
            Application.lastAction = 0;
            Application.totalProcessedSize = 0;

            Device.allDevices.clear();
            Device.lastAction = 0;
            Device.totalGeneratedSize = 0;

            Sensor.sensorEventList.clear();

            SmartDevice.stuckData = 0;

            MobilityEvent.changeNodeEventCounter = 0;
            MobilityEvent.connectToNodeEventCounter = 0;
            MobilityEvent.disconnectFromNodeEventCounter = 0;
            MobilityEvent.changePositionEventCounter = 0;

            Instance.allInstances.clear();

            Provider.allProviders.clear();

            SimLogger.simLogger.removeHandler(logHandler);

            // garbage collect
            System.gc();

            lock.unlock();
        }

        var compiledLogs = logs.toString();

        var result =resultBuiilder
                .resultDirectory(ScenarioBase.resultDirectory)
                .logs(compiledLogs)
                .build();

//        simulationCache.put(cacheKey, result);

        return result;
    }


    private HashMap<WorkflowComputingAppliance, Instance> getWorkflowArchitecture(SimulationModel model) throws Exception {
        var simulationMapping = new HashMap<SimulationComputerInstance, List<WorkflowComputingAppliance>>();

        var workflowArchitecture = new HashMap<WorkflowComputingAppliance, Instance>();
        String cloudfile = ScenarioBase.resourcePath + "LPDS_magic.xml";

        for (var computerInstance : model.getInstances()) {
            var counter = 0;
            var appliances = new ArrayList<WorkflowComputingAppliance>();

            for (var i = 0; i < computerInstance.count(); i++) {
                var id = computerInstance.region() + "-" + computerInstance.computerType() + "-" + ++counter;

                VirtualAppliance va = new VirtualAppliance(id + "-va", 100, 0, false, 1073741824L);
                AlterableResourceConstraints arc = new AlterableResourceConstraints(
                        computerInstance.cores(),
                        computerInstance.processingPerTick(),
                        computerInstance.memory());

                WorkflowComputingAppliance cloud = new WorkflowComputingAppliance(
                        cloudfile,
                        id + "-cloud",
                        new GeoLocation(computerInstance.latitude(), computerInstance.longitude()),
                        1000);

                cloud.setFixedVmCount(1);

                Instance instance = new Instance(id + "-instance", va, arc, computerInstance.pricePerTick(), 1);

                appliances.add(cloud);
                workflowArchitecture.put(cloud, instance);
            }

            simulationMapping.put(computerInstance, appliances);
        }

        for (var computerInstance : model.getInstances()) {
            for (var targetRegionEntry : computerInstance.latencyMap().entrySet()) {
                var targetRegion = targetRegionEntry.getKey();
                var latency = targetRegionEntry.getValue();

                var targetRegionAppliances = simulationMapping.entrySet()
                        .stream()
                        .filter(entry -> entry.getKey().region().equals(targetRegion))
                        .flatMap(entry -> entry.getValue().stream())
                        .toList();

                for (var appliance : simulationMapping.get(computerInstance)) {
                    for (var targetAppliance : targetRegionAppliances) {
                        if (appliance == targetAppliance) {
                            continue;
                        }

                        appliance.iaas.repositories.get(0).addLatencies(targetAppliance.iaas.repositories.get(0).getName(), latency);
                    }
                }
            }
        }


        return workflowArchitecture;
    }

}
