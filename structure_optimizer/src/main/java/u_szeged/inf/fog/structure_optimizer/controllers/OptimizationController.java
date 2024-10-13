package u_szeged.inf.fog.structure_optimizer.controllers;

import hu.mta.sztaki.lpds.cloud.simulator.Timed;
import hu.u_szeged.inf.fog.simulator.demo.ScenarioBase;
import hu.u_szeged.inf.fog.simulator.node.WorkflowComputingAppliance;
import hu.u_szeged.inf.fog.simulator.provider.Instance;
import hu.u_szeged.inf.fog.simulator.util.SimLogger;
import hu.u_szeged.inf.fog.simulator.util.TimelineVisualiser;
import hu.u_szeged.inf.fog.simulator.util.WorkflowGraphVisualiser;
import hu.u_szeged.inf.fog.simulator.util.xml.ScientificWorkflowParser;
import hu.u_szeged.inf.fog.simulator.util.xml.WorkflowJobModel;
import hu.u_szeged.inf.fog.simulator.workflow.WorkflowExecutor;
import hu.u_szeged.inf.fog.simulator.workflow.scheduler.MaxMinScheduler;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;

import java.io.File;
import java.nio.file.Files;
import java.util.HashMap;

import static u_szeged.inf.fog.structure_optimizer.StructureOptimizerApplication.getWorkflowArchitecutre;

@Controller
public class OptimizationController {

    @PostMapping("/optimize")
    public String optimize(Model model, @ModelAttribute String uuid) {
        model.addAttribute("uuid", uuid);

        try {
            // create a new temp directory
            var nextTempDirectory = Files.createTempDirectory("structure_optimizer-" + uuid).toFile();
            ScenarioBase.resultDirectory = nextTempDirectory.getAbsolutePath();

            SimLogger.setLogging(2, true);

            HashMap<WorkflowComputingAppliance, Instance> workflowArchitecture = getWorkflowArchitecutre();

            String workflowFile = ScenarioBase.resourcePath + "/WORKFLOW_examples/CyberShake_100.xml";
            workflowFile = ScientificWorkflowParser.parseToIotWorkflow(workflowFile);


            WorkflowJobModel.loadWorkflowXml(workflowFile);

            new WorkflowExecutor(new MaxMinScheduler(workflowArchitecture));

            Timed.simulateUntilLastEvent();
            ScenarioBase.logStreamProcessing();
            WorkflowGraphVisualiser.generateDag(ScenarioBase.scriptPath, ScenarioBase.resultDirectory, workflowFile);
            TimelineVisualiser.generateTimeline(ScenarioBase.resultDirectory);

            // load log.txt
            var logFile = ScenarioBase.resultDirectory + "/log.txt";
            var logContent = Files.readString(new File(logFile).toPath());

            model.addAttribute("logs", logContent);
        } catch (Exception ex) {
            model.addAttribute("error", ex.getMessage());
            ex.printStackTrace();
        }

        model.addAttribute("resultDirectory", ScenarioBase.resultDirectory);

        return "optimize";
    }

}
