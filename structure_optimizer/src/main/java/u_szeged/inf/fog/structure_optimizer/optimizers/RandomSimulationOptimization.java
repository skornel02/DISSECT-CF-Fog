package u_szeged.inf.fog.structure_optimizer.optimizers;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import u_szeged.inf.fog.structure_optimizer.enums.SimulationStatus;
import u_szeged.inf.fog.structure_optimizer.models.SimulationComputerInstance;
import u_szeged.inf.fog.structure_optimizer.models.SimulationModel;
import u_szeged.inf.fog.structure_optimizer.services.SimulationService;

import java.util.List;
import java.util.Random;
import java.util.UUID;

@EqualsAndHashCode(callSuper = true)
@Getter
public class RandomSimulationOptimization extends BaseSimulationOptimization {

    private final Random random = new Random();
    private final int iteraations;

    private final Thread worker;

    public RandomSimulationOptimization(
            SimulationService service,
            String id,
            List<SimulationComputerInstance> computers,
            int iterations) {
        super(service, id, computers);
        this.iteraations = iterations;

        ClassLoader contextClassLoader = this.getClass().getClassLoader();

        worker = new Thread(() -> {
            Thread.currentThread().setContextClassLoader(contextClassLoader);

            for (var simulation : simulations) {
                service.runSimulation(simulation);

                updateLastUpdated();
            }
        });
    }

    @Override
    public void start() {
        for (int i = 0; i < iteraations; i++) {
            var simulation = new SimulationModel();

            var computerInstances = this.computerInstances
                    .stream()
                    .map(computer -> computer.toBuilder()
                            .count(random.nextInt(4))
                            .build())
                    .toList();

            simulation.setId(UUID.randomUUID().toString());
            simulation.setInstances(computerInstances);

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
