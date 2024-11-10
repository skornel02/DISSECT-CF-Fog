package u_szeged.inf.fog.structure_optimizer;

import com.stormbots.pid_simulation.PidSimulator;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import u_szeged.inf.fog.structure_optimizer.models.PidConstraints;
import u_szeged.inf.fog.structure_optimizer.models.PidSimulationModel;
import u_szeged.inf.fog.structure_optimizer.services.JeneticsService;
import u_szeged.inf.fog.structure_optimizer.services.PidSimulationService;

import java.util.Arrays;

@SpringBootApplication
public class StructureOptimizerApplication {


    public static void main(String[] args) {
//        var pidSimulationService = new PidSimulationService();
//        var jeneticsService = new JeneticsService();

        var constraint = new PidConstraints(30, 0.0001, 0.02, 10);

//        var best = jeneticsService.OptimizePid(constraint);
//        var bests = jeneticsService.OptimizeMultiPid(constraint);
//
//        System.out.println("Constraints: " + constraint);

//        {
//            System.out.println("Best PID: " + best);
//            var result = pidSimulationService.simulatePid(best, 100, constraint.outputLimiter());
//
//            System.out.println("Result: " + result);
//            System.out.println("Values: " + Arrays.toString(result.values()));
//        }
//        System.out.println();
//        System.out.println();
//
//        for (var i = 0; i < bests.size(); i++) {
//            System.out.println("#" + (i + 1) + " Best PID: " + bests.get(i));
//            var result = pidSimulationService.simulatePid(bests.get(i), 100, constraint.outputLimiter());
//
//            System.out.println("Result: " + result);
//            System.out.println("Values: " + Arrays.toString(result.values()));
//        }


        SpringApplication.run(StructureOptimizerApplication.class, args);
    }

}
