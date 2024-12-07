package hu.u_szeged.inf.fog.simulator.demo;

import hu.mta.sztaki.lpds.cloud.simulator.Timed;
import hu.mta.sztaki.lpds.cloud.simulator.iaas.constraints.AlterableResourceConstraints;
import hu.mta.sztaki.lpds.cloud.simulator.io.VirtualAppliance;
import hu.u_szeged.inf.fog.simulator.iot.Actuator;
import hu.u_szeged.inf.fog.simulator.iot.mobility.GeoLocation;
import hu.u_szeged.inf.fog.simulator.node.WorkflowComputingAppliance;
import hu.u_szeged.inf.fog.simulator.provider.Instance;
import hu.u_szeged.inf.fog.simulator.util.SimLogger;
import hu.u_szeged.inf.fog.simulator.util.TimelineVisualiser;
import hu.u_szeged.inf.fog.simulator.util.WorkflowGraphVisualiser;
import hu.u_szeged.inf.fog.simulator.util.xml.ScientificWorkflowParser;
import hu.u_szeged.inf.fog.simulator.util.xml.WorkflowJobModel;
import hu.u_szeged.inf.fog.simulator.workflow.WorkflowExecutor;
import hu.u_szeged.inf.fog.simulator.workflow.scheduler.MaxMinScheduler;

import java.util.ArrayList;
import java.util.HashMap;

@SuppressWarnings("unused")
public class IoTCostErrorWorkflowSimulation {

    public static void main(String[] args) throws Exception {
    	SimLogger.setLogging(1, true);
    	
        HashMap<WorkflowComputingAppliance, Instance> workflowArchitecture = getWorkflowArchitecutre();
        //ArrayList<Actuator> actuatorArchitecture = getActuatorArchitecture();

        String workflowFile = ScenarioBase.resourcePath + "/WORKFLOW_examples/CyberShake_100.xml";
        workflowFile = ScientificWorkflowParser.parseToIotWorkflow(workflowFile);

        //String workflowFile = ScenarioBase.resourcePath + "/WORKFLOW_examples/IoT_workflow.xml";

        WorkflowJobModel.loadWorkflowXml(workflowFile);

        new WorkflowExecutor(new MaxMinScheduler(workflowArchitecture));
        //new WorkflowExecutor(new IotWorkflowScheduler(workflowArchitecture, actuatorArchitecture, 1000));

        Timed.simulateUntilLastEvent();
        ScenarioBase.logStreamProcessing();
        WorkflowGraphVisualiser.generateDag(ScenarioBase.scriptPath, ScenarioBase.resultDirectory, workflowFile);
        TimelineVisualiser.generateTimeline(ScenarioBase.resultDirectory);
    }

	private static ArrayList<Actuator> getActuatorArchitecture() {
        ArrayList<Actuator> actuatorArchitecture = new ArrayList<Actuator>();
        actuatorArchitecture.add(new Actuator("actuator1", "coffee", 25 * 1000));
        actuatorArchitecture.add(new Actuator("actuator2", "newspaper", 20 * 1000));
        return actuatorArchitecture;
    }

    private static HashMap<WorkflowComputingAppliance, Instance> getWorkflowArchitecutre() throws Exception {

        String cloudfile = ScenarioBase.resourcePath + "LPDS_original.xml";

        WorkflowComputingAppliance fog1 = new WorkflowComputingAppliance(cloudfile, "fog1", new GeoLocation(0, 10), 1000);
        WorkflowComputingAppliance fog2 = new WorkflowComputingAppliance(cloudfile, "fog2", new GeoLocation(10, 10), 1000);

        fog1.addNeighbor(fog2, 100);

        VirtualAppliance va = new VirtualAppliance("va", 100, 0, false, 1073741824L);

        AlterableResourceConstraints arc = new AlterableResourceConstraints(2, 0.001, 4294967296L);

        Instance instance = new Instance("instance1", va, arc, 0.051 / 60 / 60 / 1000, 1);

        HashMap<WorkflowComputingAppliance, Instance> workflowArchitecture = new HashMap<WorkflowComputingAppliance, Instance>();
        workflowArchitecture.put(fog1, instance);
        workflowArchitecture.put(fog2, instance);

        return workflowArchitecture;
    }
}