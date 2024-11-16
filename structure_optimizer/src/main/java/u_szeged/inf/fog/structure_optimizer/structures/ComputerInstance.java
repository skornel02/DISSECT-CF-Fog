package u_szeged.inf.fog.structure_optimizer.structures;

public record ComputerInstance(
        String computerSpecification,
        String regionSpecification
) implements Comparable<ComputerInstance> {
    @Override
    public int compareTo(ComputerInstance o) {
        if (regionSpecification.equals(o.regionSpecification)) {
            return computerSpecification.compareTo(o.computerSpecification);
        }

        return regionSpecification.compareTo(o.regionSpecification);
    }
}
