package u_szeged.inf.fog.structure_optimizer.structures;

import lombok.Data;

import java.util.Objects;

@Data
public class StructureConnectionDto {
    private String from;

    private String to;

    private int latency;

    public boolean containsRegion(String region) {
        return Objects.equals(from, region) || Objects.equals(to, region);
    }
}
