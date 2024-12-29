package u_szeged.inf.fog.structure_optimizer.optimizers;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import u_szeged.inf.fog.structure_optimizer.models.SimulationComputerInstance;
import u_szeged.inf.fog.structure_optimizer.models.SimulationModel;
import u_szeged.inf.fog.structure_optimizer.services.SimulationService;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CopyOnWriteArrayList;

@EqualsAndHashCode
@Getter
public abstract class BaseSimulationOptimization {

    protected final SimulationService service;

    private final String id;

    protected final List<SimulationComputerInstance> computerInstances;

    protected boolean isRunning = false;

    protected List<SimulationModel> simulations = new CopyOnWriteArrayList<>();

    private OffsetDateTime lastUpdated;

    public BaseSimulationOptimization(
            SimulationService service,
            String id,
            List<SimulationComputerInstance> computerInstances) {
        this.service = service;
        this.id = id;
        this.computerInstances = computerInstances;

        this.lastUpdated = OffsetDateTime.now();
    }

    public String getSimulationType() {
        return switch (this) {
            case RandomSimulationOptimization randomSimulationOptimization -> "Random";
            case GeneticSimulationOptimization geneticSimulationOptimization -> "Genetic";
            default -> "Unknown";
        };
    }

    public abstract void start();

    public abstract void stop();

    public abstract boolean isDone();

    public long getTotalSimulationCount() {
        return simulations.size();
    }

    public long getFailedSimulationCount() {
        return simulations.stream()
                .filter(s -> s.getResult().map(res -> res.getException() != null).orElse(false))
                .count();
    }

    public Optional<SimulationModel> getBestExecutionTimeSimulation()
    {
        return simulations.stream()
                .filter(simulation -> simulation.getResult().isPresent())
                .min(Comparator.comparingLong(simulation -> simulation.getResult().get().getExecutionTime()));
    }

    public Optional<SimulationModel> getBestCostSimulation()
    {
        return simulations.stream()
                .filter(simulation -> simulation.getResult().isPresent())
                .min(Comparator.comparingDouble(simulation -> simulation.getResult().get().getTotalCost()));
    }

    public Optional<SimulationModel> getBestEnergySimulation()
    {
        return simulations.stream()
                .filter(simulation -> simulation.getResult().isPresent())
                .min(Comparator.comparingDouble(simulation -> simulation.getResult().get().getTotalEnergyConsumption()));
    }

    public void updateLastUpdated() {
        this.lastUpdated = OffsetDateTime.now();
    }
}
