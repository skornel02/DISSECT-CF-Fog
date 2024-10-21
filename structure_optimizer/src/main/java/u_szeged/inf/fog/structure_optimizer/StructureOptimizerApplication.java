package u_szeged.inf.fog.structure_optimizer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import u_szeged.inf.fog.structure_optimizer.services.JeneticsService;

@SpringBootApplication
public class StructureOptimizerApplication {


    public static void main(String[] args) {
        //new JeneticsService();

        SpringApplication.run(StructureOptimizerApplication.class, args);
    }

}
