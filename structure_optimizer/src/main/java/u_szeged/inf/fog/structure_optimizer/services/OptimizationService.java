package u_szeged.inf.fog.structure_optimizer.services;

import lombok.Getter;
import org.springframework.stereotype.Service;
import u_szeged.inf.fog.structure_optimizer.dtos.GeneticSimulationRequest;
import u_szeged.inf.fog.structure_optimizer.dtos.SimulationStartedDto;
import u_szeged.inf.fog.structure_optimizer.models.GoalSettings;
import u_szeged.inf.fog.structure_optimizer.models.SimulationComputerInstance;
import u_szeged.inf.fog.structure_optimizer.optimizers.BaseSimulationOptimization;
import u_szeged.inf.fog.structure_optimizer.optimizers.GeneticSimulationOptimization;
import u_szeged.inf.fog.structure_optimizer.optimizers.RandomSimulationOptimization;
import u_szeged.inf.fog.structure_optimizer.structures.RegionConnection;
import u_szeged.inf.fog.structure_optimizer.structures.SimulationStructure;

import java.util.HashMap;
import java.util.List;
import java.util.UUID;

@Service
public class OptimizationService {

    @Getter
    private final HashMap<String, BaseSimulationOptimization> simulations;

    private final SimulationService simulationService;

    public OptimizationService(SimulationService simulationService) {
        this.simulationService = simulationService;

        simulations = new HashMap<>();
    }

    public SimulationStartedDto startRandomOptimization(SimulationStructure structure) {
        var id = UUID.randomUUID().toString();

        var randomOptimization = new RandomSimulationOptimization(simulationService, id, structure, 100);

        simulations.put(id, randomOptimization);

        randomOptimization.start();

        return new SimulationStartedDto(id);
    }

    public SimulationStartedDto startGeneticOptimization(GeneticSimulationRequest request) {
        var id = UUID.randomUUID().toString();

        var randomOptimization = new GeneticSimulationOptimization(simulationService, id, request);

        simulations.put(id, randomOptimization);

        randomOptimization.start();

        return new SimulationStartedDto(id);
    }
}
