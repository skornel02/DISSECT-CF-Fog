package u_szeged.inf.fog.structure_optimizer.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Represents a computer instance in the simulation.
 *
 * <p>
 * Fully defined for the simulation.
 * </p>
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class SimulationComputerInstance {
    private int count;

    private String region;

    private double latitude;
    private double longitude;

    private String computerType;
    private int cores;
    private double processingPerTick;
    private long memory;

    private Map<String, Integer> latencyMap;
}
