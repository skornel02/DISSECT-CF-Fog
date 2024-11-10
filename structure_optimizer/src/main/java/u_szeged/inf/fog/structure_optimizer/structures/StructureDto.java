package u_szeged.inf.fog.structure_optimizer.structures;

import lombok.Data;

import java.util.List;

@Data
public class StructureDto {

    private List<StructureComputerDto> computers;

    /**
     * The default latency of the connections.
     *
     * @implNote -1 means that the a connection does not exist.
     */
    private int defaultLatency;
}
