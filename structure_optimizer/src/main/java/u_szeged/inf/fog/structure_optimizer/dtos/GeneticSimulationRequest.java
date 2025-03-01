package u_szeged.inf.fog.structure_optimizer.dtos;

import lombok.Data;
import u_szeged.inf.fog.structure_optimizer.models.GoalSettings;
import u_szeged.inf.fog.structure_optimizer.structures.SimulationStructure;

@Data
public class GeneticSimulationRequest {

    private SimulationStructure structure;

    private GoalSettings goalSettings;
}
