package u_szeged.inf.fog.structure_optimizer.optimizers;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import u_szeged.inf.fog.structure_optimizer.models.SimulationComputerInstance;
import u_szeged.inf.fog.structure_optimizer.models.SimulationModel;
import u_szeged.inf.fog.structure_optimizer.services.ISimulationService;
import u_szeged.inf.fog.structure_optimizer.services.SimulationService;
import u_szeged.inf.fog.structure_optimizer.structures.RegionConnection;
import u_szeged.inf.fog.structure_optimizer.structures.SimulationStructure;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

@EqualsAndHashCode
@Getter
public abstract class BaseSimulationOptimization {

    protected final ISimulationService service;

    private final String id;

    protected boolean isRunning = false;

    protected SimulationStructure structure;

    protected List<SimulationComputerInstance> computerInstances;

    protected List<SimulationModel> simulations = new CopyOnWriteArrayList<>();

    private OffsetDateTime lastUpdated;

    public BaseSimulationOptimization(
            ISimulationService service,
            String id,
            SimulationStructure structure) {
        this.service = service;
        this.id = id;
        this.structure = structure;

        this.computerInstances = createComputerInstanceListFromStructure(structure);
        this.lastUpdated = OffsetDateTime.now();
    }

    public String getSimulationType() {
        return switch (this) {
            case RandomSimulationOptimization ignored -> "Random";
            case GeneticSimulationOptimization ignored -> "Genetic";
            default -> "Unknown";
        };
    }

    public abstract void start();

    public abstract void stop();

    public abstract boolean isDone();

    public void updateLastUpdated() {
        this.lastUpdated = OffsetDateTime.now();
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
