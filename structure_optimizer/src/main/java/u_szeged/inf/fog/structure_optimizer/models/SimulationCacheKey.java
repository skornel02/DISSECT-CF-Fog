package u_szeged.inf.fog.structure_optimizer.models;

import java.util.List;

public record SimulationCacheKey(List<SimulationComputerInstance> structure, int taskMultiplier) {
}
