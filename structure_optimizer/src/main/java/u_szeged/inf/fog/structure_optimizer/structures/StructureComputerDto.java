package u_szeged.inf.fog.structure_optimizer.structures;

import lombok.Data;

@Data
public class StructureComputerDto {
    private String name;

    private String region;

    private ComputerSpecs specs;
}
