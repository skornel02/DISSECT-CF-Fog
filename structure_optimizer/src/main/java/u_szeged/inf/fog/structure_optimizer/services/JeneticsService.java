package u_szeged.inf.fog.structure_optimizer.services;

import io.jenetics.*;
import io.jenetics.engine.Engine;
import io.jenetics.engine.EvolutionResult;
import io.jenetics.util.Factory;
import lombok.extern.java.Log;
import u_szeged.inf.fog.structure_optimizer.models.PidConstraints;
import u_szeged.inf.fog.structure_optimizer.models.PidSimulationModel;

import java.util.concurrent.Executors;
import java.util.function.Function;

@Log
public class JeneticsService {

    private final PidSimulationService pidSimulationService;

    private Function<Genotype<DoubleGene>, Integer> evalPidGenes(PidConstraints constraints) {
        return (gt) -> {
            var proportional = gt.get(0).gene().doubleValue();
            var integral = gt.get(1).gene().doubleValue();
            var derivative = gt.get(2).gene().doubleValue();
            var model = new PidSimulationModel(proportional, integral, derivative);

            var result = pidSimulationService.simulatePid(model, 100, constraints.outputLimiter());

            log.info("Evaluating PID: " + model + " -> " + result.timeToSettle());

            if (result.error() > constraints.maxError()) {
                return Integer.MAX_VALUE;
            }

            if (result.overshoot() > constraints.maxOverShoot()) {
                return Integer.MAX_VALUE;
            }

            var timeToSettle = result.timeToSettle();
            if (timeToSettle == -1) {
                return Integer.MAX_VALUE;
            }

            return timeToSettle;
        };
    }

    public JeneticsService() {
        this.pidSimulationService = new PidSimulationService();
    }

    public PidSimulationModel OptimizePid(PidConstraints constraints) {
        var executor = Executors.newFixedThreadPool(10);

        var gtf = Genotype.of(DoubleChromosome.of(0, 1), DoubleChromosome.of(0, 1), DoubleChromosome.of(0, 1));

        var engine = Engine
                .builder(evalPidGenes(constraints), gtf)
                .minimizing()
                .alterers(
                        new Mutator<>(0.1),
                        new MeanAlterer<>(0.1)
                )
                .populationSize(100)
                .executor(executor)
                .build();

        var result = engine.stream()
                .limit(1000)
                .collect(EvolutionResult.toBestGenotype());

        var proportional = result.get(0).gene().doubleValue();
        var integral = result.get(1).gene().doubleValue();
        var derivative = result.get(2).gene().doubleValue();

        executor.shutdown();

        return new PidSimulationModel(proportional, integral, derivative);
    }
}
