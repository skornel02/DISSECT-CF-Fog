package u_szeged.inf.fog.structure_optimizer.models;

import lombok.Builder;

import java.util.Map;

/**
 * Represents a computer instance in the simulation.
 *
 * <p>
 * Fully defined for the simulation.
 * </p>
 */
@Builder(toBuilder = true)
public record SimulationComputerInstance(
        int count,
        String region,
        double latitude,
        double longitude,
        String computerType,
        int cores,
        double processingPerTick,
        long memory,
        double pricePerTick,
        Map<String, Integer> latencyMap) {
}
