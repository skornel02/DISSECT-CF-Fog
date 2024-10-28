package u_szeged.inf.fog.structure_optimizer.models;

public record PidSimulationResult(
        int timeToSettle,
        double overshoot,
        double steadyState,
        double error,
        double[] values) {

}
