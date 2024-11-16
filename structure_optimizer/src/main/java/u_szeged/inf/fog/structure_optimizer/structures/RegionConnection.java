package u_szeged.inf.fog.structure_optimizer.structures;

public record RegionConnection(String from, String to, int latency) {
    public boolean containsRegion(String region) {
        return from.equals(region) || to.equals(region);
    }
}
