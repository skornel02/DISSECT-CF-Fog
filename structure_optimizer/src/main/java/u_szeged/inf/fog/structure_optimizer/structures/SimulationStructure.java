package u_szeged.inf.fog.structure_optimizer.structures;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import java.util.List;

@Data
public class SimulationStructure {

    /**
     * The computer types that are available.
     * <p>
     * Typically these are the vms provided by the cloud providers.
     */
    private List<ComputerSpecification> computerTypes;

    /**
     * The regions that are available.
     * <p>
     * Typically these are the data centers provided by the cloud providers.
     */
    private List<RegionSpecification> regions;

    /**
     * Available computer region pairs.
     */
    private List<ComputerInstance> instances;

    /**
     * The connections between the regions.
     */
    private List<RegionConnection> regionConnections;

    /**
     * The default latency of the connections.
     */
    private int defaultLatency;

    @JsonIgnore
    public List<ComputerInstance> getInvalidComputers() {
        return instances.stream()
                .filter(computer -> {
                    var computerTypeMissing = computerTypes
                            .stream()
                            .noneMatch(type -> type.name().equals(computer.computerSpecification()));

                    var regionMissing = regions
                            .stream()
                            .noneMatch(region -> region.name().equals(computer.regionSpecification()));

                    return computerTypeMissing || regionMissing;
                })
                .toList();
    }
}
