package u_szeged.inf.fog.structure_optimizer.dtos;

import jakarta.validation.constraints.NotNull;
import u_szeged.inf.fog.structure_optimizer.models.SimulationModel;

import java.util.List;

public record SimulationStatusDto(
        @NotNull String id,
        @NotNull String type,
        @NotNull boolean isRunning,
        @NotNull List<SimulationModel> simulations
) {
}
