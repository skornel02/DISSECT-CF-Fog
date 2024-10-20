package u_szeged.inf.fog.structure_optimizer.optimizers;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import u_szeged.inf.fog.structure_optimizer.models.SimulationModel;
import u_szeged.inf.fog.structure_optimizer.services.SimulationService;

import java.util.ArrayList;
import java.util.List;

@EqualsAndHashCode
@Getter
public abstract class BaseSimulationOptimization {

    private final SimulationService service;
    private final String id;

    protected boolean isRunning = false;

    protected List<SimulationModel> simulations = new ArrayList<>();

    public BaseSimulationOptimization(SimulationService service, String id) {
        this.service = service;
        this.id = id;
    }

    public abstract void start();

    public abstract void stop();

    public abstract boolean isDone();
}
