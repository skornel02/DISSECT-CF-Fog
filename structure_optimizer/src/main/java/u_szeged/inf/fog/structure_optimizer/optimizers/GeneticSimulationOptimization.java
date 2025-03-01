package u_szeged.inf.fog.structure_optimizer.optimizers;

import io.jenetics.*;
import io.jenetics.engine.Engine;
import io.jenetics.engine.EvolutionResult;
import io.jenetics.engine.Limits;
import lombok.Getter;
import u_szeged.inf.fog.structure_optimizer.enums.SimulationStatus;
import u_szeged.inf.fog.structure_optimizer.models.GoalSettings;
import u_szeged.inf.fog.structure_optimizer.models.SimulationComputerInstance;
import u_szeged.inf.fog.structure_optimizer.models.SimulationModel;
import u_szeged.inf.fog.structure_optimizer.services.SimulationService;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Function;

public class GeneticSimulationOptimization extends BaseSimulationOptimization {

    private final ClassLoader contextClassLoader;

    private static final int MAX_COMPUTERS = 10;

    private long currentGeneration;
    private boolean isFinished = false;

    @Getter
    private final GoalSettings goalSettings;
    private final Thread worker;

    public GeneticSimulationOptimization(
            SimulationService service,
            String id,
            GoalSettings goalSettings,
            List<SimulationComputerInstance> computerInstances) {
        super(service, id, computerInstances);

        contextClassLoader = this.getClass().getClassLoader();

        this.goalSettings = goalSettings;

        worker = new Thread(() -> {
            Thread.currentThread().setContextClassLoader(contextClassLoader);

            var chromosomes = new ArrayList<IntegerChromosome>();
            for (var ignored : computerInstances) {
                chromosomes.add(IntegerChromosome.of(0, MAX_COMPUTERS));
            }

            var gtf = Genotype.of(chromosomes);

            var engine = Engine
                    .builder(evalPidGenes(), gtf)
                    .optimize(goalSettings.isMinimizingCost() ? Optimize.MINIMUM : Optimize.MAXIMUM)
                    .alterers(
                            new Mutator<>(0.1),
                            new MeanAlterer<>(0.1),
                            new UniformCrossover<>(0.1, 0.1)
                    )
                    .populationSize(goalSettings.getPopulationSize())
                    .selector(goalSettings.isUseRandom()
                            ? new MonteCarloSelector<>()
                            : new TournamentSelector<>(3))
                    .build();

            var result = engine.stream()
                    //.limit(Limits.byFitnessConvergence(10, 25, 0.01))
                    .limit(goalSettings.getMaximumGenerations())
                    .peek(er -> {
                        currentGeneration = er.generation();
                    })
                    .collect(EvolutionResult.toBestPhenotype());

            simulations.forEach(simulation -> {
                var instances = simulation.getInstances();

                for (int i = 0; i < instances.size(); i++) {
                    if (instances.get(i).count() != result.genotype().get(i).gene().intValue()) {
                        return;
                    }
                }

                simulation.setBestPhenotype(true);
            });

            isFinished = true;
        });
    }

    private Function<Genotype<IntegerGene>, Double> evalPidGenes() {
        return (gt) -> {
            Thread.currentThread().setContextClassLoader(contextClassLoader);

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
            simulation.setGeneration(currentGeneration);

            simulations.add(simulation);

            var result = service.runSimulation(simulation);
            simulation.setResult(result);
            simulation.setStatus(SimulationStatus.Finished);
            simulation.setFinishedAt(OffsetDateTime.now());

            updateLastUpdated();

            if (result.getException() != null) {
                simulation.setFitness(-1);
                return goalSettings.isMinimizingCost() ? Double.MAX_VALUE : Double.MIN_VALUE;
            }

            var execTime = result.getExecutionTime();
            var price = result.getTotalCost();
            var energy = result.getTotalEnergyConsumption();

            if (goalSettings.getMaximumPrice() != null && price > goalSettings.getMaximumPrice()) {
                price = goalSettings.isMinimizingCost()
                    ? price * 100
                    : price / 100;
            }

            var fitness = (execTime / 60 / 1000) * goalSettings.getTimeWeight()
                    + price * goalSettings.getPriceWeight()
                    + energy * goalSettings.getEnergyWeight();

            simulation.setFitness(fitness);

            return fitness;
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
