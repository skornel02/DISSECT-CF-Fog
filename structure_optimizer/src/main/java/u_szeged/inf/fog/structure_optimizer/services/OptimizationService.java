package u_szeged.inf.fog.structure_optimizer.services;

import lombok.Getter;
import org.springframework.stereotype.Service;
import u_szeged.inf.fog.structure_optimizer.dtos.SimulationStartedDto;
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

        var computerInstances = createComputerInstanceListFromStructure(structure);

        var randomOptimization = new RandomSimulationOptimization(simulationService, id, computerInstances, 100);

        simulations.put(id, randomOptimization);

        randomOptimization.start();

        return new SimulationStartedDto(id);
    }

    public SimulationStartedDto startGeneticOptimization(SimulationStructure structure) {
        var id = UUID.randomUUID().toString();

        var computerInstances = createComputerInstanceListFromStructure(structure);

        var randomOptimization = new GeneticSimulationOptimization(simulationService, id, computerInstances);

        simulations.put(id, randomOptimization);

        randomOptimization.start();

        return new SimulationStartedDto(id);
    }

    private List<SimulationComputerInstance> createComputerInstanceListFromStructure(SimulationStructure structure) {
        return structure.getInstances()
                .stream()
                .map(instance -> {
                    var computerType = structure.getComputerTypes()
                            .stream()
                            .filter(type -> type.name().equals(instance.computerSpecification()))
                            .findFirst()
                            .orElseThrow();

                    var region = structure.getRegions()
                            .stream()
                            .filter(r -> r.name().equals(instance.regionSpecification()))
                            .findFirst()
                            .orElseThrow();

                    var regionLatencyMap = new HashMap<String, Integer>();
                    for (var targetRegion : structure.getRegions()) {
                        regionLatencyMap.put(targetRegion.name(), structure.getRegionConnections()
                                .stream()
                                .filter((connection) -> connection.containsRegion(region.name()) && connection.containsRegion(targetRegion.name()))
                                .findFirst()
                                .map(RegionConnection::latency)
                                .orElse(structure.getDefaultLatency()));    
                    }

                    return new SimulationComputerInstance(
                            0,
                            region.name(),
                            region.latitude(),
                            region.longitude(),
                            computerType.name(),
                            computerType.cores(),
                            computerType.processingPerTick(),
                            computerType.memory(),
                            computerType.pricePerTick(),
                            regionLatencyMap
                    );
                })
                .toList();
    }
}
