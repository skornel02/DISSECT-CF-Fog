package u_szeged.inf.fog.structure_optimizer.services;

import io.jenetics.*;
import io.jenetics.engine.Codecs;
import io.jenetics.engine.Engine;
import io.jenetics.engine.EvolutionResult;
import io.jenetics.engine.Problem;
import io.jenetics.ext.moea.MOEA;
import io.jenetics.ext.moea.UFTournamentSelector;
import io.jenetics.ext.moea.Vec;
import io.jenetics.util.DoubleRange;
import io.jenetics.util.Factory;
import io.jenetics.util.IntRange;
import lombok.extern.java.Log;
import u_szeged.inf.fog.structure_optimizer.models.PidConstraints;
import u_szeged.inf.fog.structure_optimizer.models.PidSimulationModel;

import java.util.List;
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

    private Function<double[], Vec<double[]>> evalPidGenesMultiObjective(PidConstraints constraints) {
        return (params) -> {
            var proportional = params[0];
            var integral = params[1];
            var derivative = params[2];
            var model = new PidSimulationModel(proportional, integral, derivative);

            var result = pidSimulationService.simulatePid(model, 100, constraints.outputLimiter());

            log.info("Evaluating PID: " + model + " -> " + result.timeToSettle());

            if (result.error() > constraints.maxError()) {
                return Vec.of(101d, 1d, 1d);
            }

            if (result.overshoot() > constraints.maxOverShoot()) {
                return Vec.of(101d, 1d, 1d);
            }

            var timeToSettle = result.timeToSettle();
            if (timeToSettle == -1) {
                return Vec.of(101d, 1d, 1d);
            }

            return Vec.of(timeToSettle, result.error(), result.overshoot());
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
                        new MeanAlterer<>(0.1),
                        new UniformCrossover<>(0.1, 0.1)
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

    public List<PidSimulationModel> OptimizeMultiPid(PidConstraints constraints) {
        var executor = Executors.newFixedThreadPool(100);

        Problem<double[], DoubleGene, Vec<double[]>> problem = Problem.of(
                evalPidGenesMultiObjective(constraints),
                Codecs.ofVector(
                        DoubleRange.of(0, 1),
                        DoubleRange.of(0, 1),
                        DoubleRange.of(0, 1)
                )
        );

        var engine = Engine
                .builder(problem)
                .minimizing()
                .alterers(
                        new Mutator<>(0.1),
                        new MeanAlterer<>(0.1),
                        new UniformCrossover<>(0.1, 0.1)
                )
                .offspringSelector(new TournamentSelector<>(4))
                .survivorsSelector(UFTournamentSelector.ofVec())
                .executor(executor)
                .build();

        var result = engine.stream()
                .limit(1000)
                .collect(MOEA.toParetoSet(IntRange.of(10, 25)));

        var models = result.stream()
                .map(gt -> {
                    var proportional = gt.genotype().get(0).gene().doubleValue();
                    var integral = gt.genotype().get(1).gene().doubleValue();
                    var derivative = gt.genotype().get(2).gene().doubleValue();

                    return new PidSimulationModel(proportional, integral, derivative);
                })
                .filter(model -> {
                    var result1 = pidSimulationService.simulatePid(model, 100, constraints.outputLimiter());

                    return result1.timeToSettle() != -1 && result1.error() <= constraints.maxError() && result1.overshoot() <= constraints.maxOverShoot();
                })
                .toList();

        executor.shutdown();

        return models;
    }
}
