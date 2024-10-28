package u_szeged.inf.fog.structure_optimizer.models;

public record PidConstraints(
        int minimalTimeToSettle,
        double maxError,
        double maxOverShoot,
        double outputLimiter) {
}
