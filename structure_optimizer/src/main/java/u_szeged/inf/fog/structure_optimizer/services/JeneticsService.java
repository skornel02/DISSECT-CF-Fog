package u_szeged.inf.fog.structure_optimizer.services;

import io.jenetics.IntegerChromosome;
import io.jenetics.IntegerGene;
import io.jenetics.Genotype;
import io.jenetics.engine.Engine;
import io.jenetics.engine.EvolutionResult;
import io.jenetics.util.Factory;

public class JeneticsService {

    private static int eval(Genotype<IntegerGene> gt) {
        return gt.chromosome()
                .as(IntegerChromosome.class)
                .intValue();
    }

    public JeneticsService() {
        // 1.) Define the genotype (factory) suitable
        //     for the problem.
        Factory<Genotype<IntegerGene>> gtf =
                Genotype.of(IntegerChromosome.of(0, 10000));

        // 3.) Create the execution environment.
        Engine<IntegerGene, Integer> engine = Engine
                .builder(JeneticsService::eval, gtf)
                .build();

        // 4.) Start the execution (evolution) and
        //     collect the result.
        Genotype<IntegerGene> result = engine.stream()
                .limit(100)
                .collect(EvolutionResult.toBestGenotype());

        System.out.println("Hello World:\n" + result);
    }
}
