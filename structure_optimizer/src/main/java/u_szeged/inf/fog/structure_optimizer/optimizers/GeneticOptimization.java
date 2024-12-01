package u_szeged.inf.fog.structure_optimizer.optimizers;

import io.jenetics.*;
import io.jenetics.engine.Engine;
import io.jenetics.engine.EvolutionResult;
import u_szeged.inf.fog.structure_optimizer.models.SimulationComputerInstance;
import u_szeged.inf.fog.structure_optimizer.models.SimulationModel;
import u_szeged.inf.fog.structure_optimizer.services.SimulationService;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Function;

public class GeneticOptimization extends BaseSimulationOptimization {

    private static final int MAX_COMPUTERS = 10;

    private boolean isFinished = false;

    private final Thread worker;

    public GeneticOptimization(
            SimulationService service,
            String id,
            List<SimulationComputerInstance> computerInstances) {
        super(service, id, computerInstances);

        ClassLoader contextClassLoader = this.getClass().getClassLoader();

        worker = new Thread(() -> {
            Thread.currentThread().setContextClassLoader(contextClassLoader);

            var chromosomes = new ArrayList<IntegerChromosome>();
            for (var computer : computerInstances) {
                chromosomes.add(IntegerChromosome.of(0, MAX_COMPUTERS));
            }

            var gtf = Genotype.of(chromosomes);

            var engine = Engine
                    .builder(evalPidGenes(), gtf)
                    .minimizing()
                    .alterers(
                            new Mutator<>(0.1),
                            new MeanAlterer<>(0.1),
                            new UniformCrossover<>(0.1, 0.1)
                    )
                    .populationSize(20)
                    .build();

            var result = engine.stream()
                    .limit(100)
                    .collect(EvolutionResult.toBestGenotype());

            isFinished = true;
        });
    }

    private Function<Genotype<IntegerGene>, Long> evalPidGenes() {
        return (gt) -> {
            var simulation = new SimulationModel();

            AtomicInteger index = new AtomicInteger();
            var computerInstances = this.computerInstances
                    .stream()
                    .map(computer -> computer.toBuilder()
                            .count(gt.get(index.getAndIncrement()).gene().intValue())
                            .build())
                    .toList();

            simulation.setId(UUID.randomUUID().toString());
            simulation.setInstances(computerInstances);

            simulations.add(simulation);

            var result = service.runSimulation(simulation);

            if (result.getException() != null) {
                return Long.MAX_VALUE;
            }

            return result.getExecutionTime();
        };
    }

    @Override
    public void start() {
        worker.start();
    }

    @Override
    public void stop() {
        worker.interrupt();
    }

    @Override
    public boolean isDone() {
        return isFinished;
    }
}
