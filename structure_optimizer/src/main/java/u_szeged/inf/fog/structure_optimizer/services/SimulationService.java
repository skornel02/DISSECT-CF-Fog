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
import hu.u_szeged.inf.fog.simulator.util.SimLogger;
import hu.u_szeged.inf.fog.simulator.util.xml.ScientificWorkflowParser;
import hu.u_szeged.inf.fog.simulator.util.xml.WorkflowJobModel;
import hu.u_szeged.inf.fog.simulator.workflow.WorkflowExecutor;
import hu.u_szeged.inf.fog.simulator.workflow.WorkflowJob;
import hu.u_szeged.inf.fog.simulator.workflow.scheduler.MaxMinScheduler;
import hu.u_szeged.inf.fog.simulator.workflow.scheduler.WorkflowScheduler;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import u_szeged.inf.fog.structure_optimizer.enums.SimulationStatus;
import u_szeged.inf.fog.structure_optimizer.models.SimulationComputerInstance;
import u_szeged.inf.fog.structure_optimizer.models.SimulationModel;
import u_szeged.inf.fog.structure_optimizer.models.SimulationResult;
import u_szeged.inf.fog.structure_optimizer.utils.SimpleLogHandler;

import java.nio.file.Files;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;
import java.util.logging.Level;
import java.util.regex.Pattern;

@Slf4j
@Service
public class SimulationService {

    private static final Pattern TotalCostPattern = Pattern.compile("Total cost: (\\d+\\.\\d+)");
    private static final Pattern TotalEnergyConsumptionPattern = Pattern.compile("Total energy consumption: (\\d+\\.\\d+)");
    private static final Pattern ExecutionTime = Pattern.compile("Real execution time (\\d+)ms");
    private static final Pattern TaskCompleted = Pattern.compile("Completed: (\\d+)/(\\d+)");

    private static final Lock lock = new ReentrantLock();

    private static final ExecutorService executorService = Executors.newFixedThreadPool(1);

    private static final LoadingCache<List<SimulationComputerInstance>, SimulationResult> simulationCache = Caffeine.newBuilder()
            .maximumSize(10_000)
            .expireAfterWrite(Duration.ofHours(1))
            .build(a -> null);

    public SimulationService() {
    }


    public SimulationResult runSimulation(SimulationModel model) {
        var cachedResult = simulationCache.getIfPresent(model.getInstances());
        if (cachedResult != null) {
            log.info("Simulation result found in cache!");
            return cachedResult;
        }

        var resultBuiilder = SimulationResult.builder()
                .id(model.getId());

        HashMap<WorkflowComputingAppliance, Instance> workflowArchitecture;
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

        try {
            // create a new temp directory
            //var nextTempDirectory = Files.createTempDirectory("structure_optimizer-" + model.getId()).toFile();
            //ScenarioBase.resultDirectory = nextTempDirectory.getAbsolutePath();

            workflowArchitecture = getWorkflowArchitecture(model);
            var workflowArchitectureComputerCount = workflowArchitecture.size();

            if (workflowArchitectureComputerCount == 0) {
                throw new Exception("No computers found in the simulation model");
            }

            String workflowFile = ScenarioBase.resourcePath + "/WORKFLOW_examples/CyberShake_100.xml";
            workflowFile = ScientificWorkflowParser.parseToIotWorkflow(workflowFile);

            WorkflowJobModel.loadWorkflowXml(workflowFile);

            new WorkflowExecutor(new MaxMinScheduler(workflowArchitecture));

            var task = new CompletableFuture<Boolean>();

            executorService.submit(() -> {
                Timed.simulateUntilLastEvent();
                task.complete(true);
            });

            task.get(1, TimeUnit.SECONDS);

            ScenarioBase.logStreamProcessing();
        } catch (TimeoutException e) {
            SimLogger.simLogger.log(Level.SEVERE, "Event simulation timed out!", e);

            resultBuiilder = resultBuiilder.exception(new Exception("Event simulation timed out!"));
        } catch (Exception e) {
            SimLogger.simLogger.log(Level.SEVERE, e.getMessage(), e);

            resultBuiilder = resultBuiilder.exception(e);
        } finally {
            Timed.resetTimed();

            WorkflowExecutor.vmTaskLogger.clear();
            WorkflowExecutor.actuatorReassigns.clear();
            WorkflowExecutor.jobReassigns.clear();

            WorkflowJob.workflowJobs.clear();
            WorkflowJob.numberOfStartedWorkflowJobs = 0;

            ComputingAppliance.allComputingAppliances.clear();

            if (WorkflowScheduler.actuatorArchitecture != null) {
                WorkflowScheduler.actuatorArchitecture.clear();
            }

            if (WorkflowScheduler.workflowArchitecture != null) {
                WorkflowScheduler.workflowArchitecture.clear();
            }

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
        }

        var totalCost = -1.0;
        var totalEnergyConsumption = -1.0;
        var executionTime = -1L;
        var totalTasks = -1;
        var completedTasks = -1;

        if (!logs.isEmpty()) {
            var totalCostMatcher = TotalCostPattern.matcher(logs);
            if (totalCostMatcher.find()) {
                try {
                    totalCost = Double.parseDouble(totalCostMatcher.group(1));
                } catch (Exception ignored) {
                }
            }

            var totalEnergyConsumptionMatcher = TotalEnergyConsumptionPattern.matcher(logs);
            if (totalEnergyConsumptionMatcher.find()) {
                try {
                    totalEnergyConsumption = Double.parseDouble(totalEnergyConsumptionMatcher.group(1));
                } catch (Exception ignored) {
                }
            }

            var executionTimeMatcher = ExecutionTime.matcher(logs);
            if (executionTimeMatcher.find()) {
                try {
                    executionTime = Long.parseLong(executionTimeMatcher.group(1));
                } catch (Exception ignored) {
                }
            }

            var taskCompletedMatcher = TaskCompleted.matcher(logs);
            if (taskCompletedMatcher.find()) {
                try {
                    completedTasks = Integer.parseInt(taskCompletedMatcher.group(1));
                    totalTasks = Integer.parseInt(taskCompletedMatcher.group(2));
                } catch (Exception ignored) {
                }
            }
        }

        if (totalTasks > completedTasks) {
            resultBuiilder = resultBuiilder.exception(new Exception("Not all tasks were completed"));
        }

        var finishedResult = resultBuiilder
                .resultDirectory(ScenarioBase.resultDirectory)
                .logs(logs.toString())
                .totalCost(totalCost)
                .totalEnergyConsumption(totalEnergyConsumption)
                .totalTasks(totalTasks)
                .completedTasks(completedTasks)
                .executionTime(executionTime)
                .build();

        lock.unlock();

        simulationCache.put(model.getInstances(), finishedResult);

        return finishedResult;
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
//                AlterableResourceConstraints arc = new AlterableResourceConstraints(2, 0.001, 4294967296L);

                WorkflowComputingAppliance cloud = new WorkflowComputingAppliance(
                        cloudfile,
                        id + "-cloud",
                        new GeoLocation(computerInstance.latitude(), computerInstance.longitude()),
                        1000);

                Instance instance = new Instance(id + "-instance", va, arc, computerInstance.pricePerTick(), 1);

                appliances.add(cloud);
                workflowArchitecture.put(cloud, instance);

                // add all previous as neighbor
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

                        appliance.addNeighbor(targetAppliance, latency);
                    }
                }
            }
        }


        return workflowArchitecture;
    }

}
