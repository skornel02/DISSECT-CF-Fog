package u_szeged.inf.fog.structure_optimizer.models;

import lombok.Data;

@Data
public class GoalSettings {

    private boolean useRandom;
    private boolean minimizingCost;
    private int populationSize = 20;
    private int maximumGenerations = 100;

    private double timeWeight = 1;
    private double priceWeight = 0;
    private double energyWeight = 0;

    private Double maximumPrice;
}
