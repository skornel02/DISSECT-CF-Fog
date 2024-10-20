package u_szeged.inf.fog.structure_optimizer.optimizers;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import u_szeged.inf.fog.structure_optimizer.enums.SimulationStatus;
import u_szeged.inf.fog.structure_optimizer.models.SimulationModel;
import u_szeged.inf.fog.structure_optimizer.services.SimulationService;

import java.util.UUID;

@EqualsAndHashCode(callSuper = true)
@Getter
public class RandomSimulationOptimization extends BaseSimulationOptimization {

    private final int iteraations;

    private final Thread worker;

    public RandomSimulationOptimization(SimulationService service, String id, int iteraations) {
        super(service, id);
        this.iteraations = iteraations;

        worker = new Thread(() -> {
            for (var simulation : simulations) {
                service.RunSimulation(simulation);
            }
        });
    }

    @Override
    public void start() {
        for (int i = 0; i < iteraations; i++) {
            var simulation = new SimulationModel();
            simulation.setId(UUID.randomUUID().toString());

            simulations.add(simulation);
        }

        worker.start();
    }

    @Override
    public void stop() {
        worker.interrupt();
    }

    @Override
    public boolean isDone() {
        return simulations.stream()
                .filter(simulation -> simulation.getStatus() == SimulationStatus.Finished)
                .count() == iteraations;
    }
}
