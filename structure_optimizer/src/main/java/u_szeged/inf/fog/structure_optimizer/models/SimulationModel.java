package u_szeged.inf.fog.structure_optimizer.models;

import lombok.Data;
import u_szeged.inf.fog.structure_optimizer.enums.SimulationStatus;
import u_szeged.inf.fog.structure_optimizer.structures.SimulationStructure;

import java.util.List;
import java.util.Optional;

@Data
public class SimulationModel {
    private String id;

    private SimulationStatus status = SimulationStatus.Waiting;

    private List<SimulationComputerInstance> instances;

    private SimulationResult result;

    public Optional<SimulationResult> getResult() {
        return Optional.ofNullable(result);
    }
}
