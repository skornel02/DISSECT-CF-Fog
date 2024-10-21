package u_szeged.inf.fog.structure_optimizer.services;

import hu.mta.sztaki.lpds.cloud.simulator.Timed;
import hu.mta.sztaki.lpds.cloud.simulator.iaas.constraints.AlterableResourceConstraints;
import hu.mta.sztaki.lpds.cloud.simulator.io.VirtualAppliance;
import hu.u_szeged.inf.fog.simulator.demo.ScenarioBase;
import hu.u_szeged.inf.fog.simulator.iot.mobility.GeoLocation;
import hu.u_szeged.inf.fog.simulator.node.WorkflowComputingAppliance;
import hu.u_szeged.inf.fog.simulator.provider.Instance;
import hu.u_szeged.inf.fog.simulator.util.SimLogger;
import hu.u_szeged.inf.fog.simulator.util.TimelineVisualiser;
import hu.u_szeged.inf.fog.simulator.util.WorkflowGraphVisualiser;
import hu.u_szeged.inf.fog.simulator.util.xml.ScientificWorkflowParser;
import hu.u_szeged.inf.fog.simulator.util.xml.WorkflowJobModel;
import hu.u_szeged.inf.fog.simulator.workflow.WorkflowExecutor;
import hu.u_szeged.inf.fog.simulator.workflow.WorkflowJob;
import hu.u_szeged.inf.fog.simulator.workflow.scheduler.MaxMinScheduler;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import u_szeged.inf.fog.structure_optimizer.enums.SimulationStatus;
import u_szeged.inf.fog.structure_optimizer.models.SimulationModel;
import u_szeged.inf.fog.structure_optimizer.models.SimulationResult;
import u_szeged.inf.fog.structure_optimizer.utils.SimpleLogHandler;

import java.nio.file.Files;
import java.util.HashMap;
import java.util.Objects;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.regex.Pattern;

@Slf4j
@Service
public class SimulationService {

    private static final Logger logger = Logger.getLogger(SimulationService.class.getName());
    private static final Object lock = new Object();
    private static final Pattern TotalCostPattern = Pattern.compile("Total cost: (\\d+\\.\\d+)");
    private static final Pattern TotalEnergyConsumptionPattern = Pattern.compile("Total energy consumption: (\\d+\\.\\d+)");
    private static final Pattern ExecutionTime = Pattern.compile("Real execution time (\\d+)ms");

    public SimulationService() {
    }

    public SimulationResult RunSimulation(SimulationModel model) {
        var result = SimulationResult.builder()
                .id(model.getId());

        HashMap<WorkflowComputingAppliance, Instance> workflowArchitecture = null;

        synchronized (lock) {
            model.setStatus(SimulationStatus.Processing);

            var logs = new StringBuffer();
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
                var nextTempDirectory = Files.createTempDirectory("structure_optimizer-" + model.getId()).toFile();
                ScenarioBase.resultDirectory = nextTempDirectory.getAbsolutePath();

                workflowArchitecture = getWorkflowArchitecture(model);

                String workflowFile = ScenarioBase.resourcePath + "/WORKFLOW_examples/CyberShake_100.xml";
                workflowFile = ScientificWorkflowParser.parseToIotWorkflow(workflowFile);

                WorkflowJobModel.loadWorkflowXml(workflowFile);

                new WorkflowExecutor(new MaxMinScheduler(workflowArchitecture));

                Timed.simulateUntilLastEvent();
                ScenarioBase.logStreamProcessing();
                WorkflowGraphVisualiser.generateDag(ScenarioBase.scriptPath, ScenarioBase.resultDirectory, workflowFile);
                TimelineVisualiser.generateTimeline(ScenarioBase.resultDirectory);
            } catch (Exception e) {
                SimLogger.simLogger.log(Level.SEVERE, e.getMessage(), e);

                result = result.exception(e);
            } finally {
                for (var entry : workflowArchitecture.keySet()) {
                    try {
                        entry.close();
                    } catch (Exception ex) {
                        logger.log(Level.SEVERE, ex.getMessage(), ex);
                    }
                }

                WorkflowJob.workflowJobs.clear();
                WorkflowJob.numberOfStartedWorkflowJobs = 0;
                WorkflowExecutor.vmTaskLogger.clear();
                WorkflowExecutor.actuatorReassigns.clear();
                WorkflowExecutor.jobReassigns.clear();

                SimLogger.simLogger.removeHandler(logHandler);
            }

            var totalCost = -1.0;
            var totalEnergyConsumption = -1.0;
            var executionTime = -1L;

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
            }

            var finishedResult = result
                    .resultDirectory(ScenarioBase.resultDirectory)
                    .logs(logs.toString())
                    .totalCost(totalCost)
                    .totalEnergyConsumption(totalEnergyConsumption)
                    .executionTime(executionTime)
                    .build();

            model.setResult(finishedResult);
            model.setStatus(SimulationStatus.Finished);

            return finishedResult;
        }
    }


    private HashMap<WorkflowComputingAppliance, Instance> getWorkflowArchitecture(SimulationModel model) throws Exception {

        HashMap<WorkflowComputingAppliance, Instance> workflowArchitecture = new HashMap<>();

        String cloudfile = ScenarioBase.resourcePath + "LPDS_original.xml";

        VirtualAppliance va = new VirtualAppliance("va", 100, 0, false, 1073741824L);

        AlterableResourceConstraints arc1 = new AlterableResourceConstraints(2, 0.001, 4294967296L);
        //AlterableResourceConstraints arc2 = new AlterableResourceConstraints(4, 0.001, 4294967296L);

        for (int i = 0 ; i < model.getCloudCount() ; i++) {
            WorkflowComputingAppliance cloud1 = new WorkflowComputingAppliance(cloudfile, "cloud" + i, new GeoLocation(0, 0), 1000);

            Instance instance1 = new Instance("instance1", va, arc1, 0.051 / 60 / 60 / 1000, 1);
            //Instance instance2 = new Instance("instance2", va, arc2, 0.102 / 60 / 60 / 1000, 1);

            workflowArchitecture.put(cloud1, instance1);

            if (i != 0) {
                var base = workflowArchitecture.keySet()
                        .stream()
                        .filter(cloud -> Objects.equals(cloud.name, "cloud1"))
                        .findFirst();

                base.get().addNeighbor(cloud1, 100);
            }
        }

//        WorkflowComputingAppliance fog1 = new WorkflowComputingAppliance(cloudfile, "fog1", new GeoLocation(0, 10), 1000);
//        WorkflowComputingAppliance fog2 = new WorkflowComputingAppliance(cloudfile, "fog2", new GeoLocation(10, 10), 1000);
//        WorkflowComputingAppliance fog3 = new WorkflowComputingAppliance(cloudfile, "fog3", new GeoLocation(20, 0), 1000);
//        WorkflowComputingAppliance fog4 = new WorkflowComputingAppliance(cloudfile, "fog4", new GeoLocation(10, -10), 1000);

//        fog1.addNeighbor(fog2, 100);
//        fog1.addNeighbor(fog3, 110);
//        fog1.addNeighbor(fog4, 120);
//        fog2.addNeighbor(fog3, 130);
//        fog2.addNeighbor(fog4, 140);
//        fog3.addNeighbor(fog4, 150);

//        fog1.setParent(cloud1, 60);
//        fog2.setParent(cloud1, 70);
//        fog3.setParent(cloud1, 80);
//        fog4.setParent(cloud1, 90);

//        workflowArchitecture.put(fog1, instance1);
//        workflowArchitecture.put(fog2, instance1);
//        workflowArchitecture.put(fog3, instance1);
//        workflowArchitecture.put(fog4, instance1);

        return workflowArchitecture;
    }

}
