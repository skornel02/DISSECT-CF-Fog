package u_szeged.inf.fog.structure_optimizer.models;

public record PidSimulationModel(double proportional, double integral, double derivative) {
    public PidSimulationModel {
        if (proportional < 0 || integral < 0 || derivative < 0) {
            throw new IllegalArgumentException("PID parameters must be positive");
        }
    }
}
