package u_szeged.inf.fog.structure_optimizer.models;

import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;
import u_szeged.inf.fog.structure_optimizer.enums.SimulationStatus;
import u_szeged.inf.fog.structure_optimizer.structures.SimulationStructure;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Data
public class SimulationModel {
    private String id;

    private SimulationStatus status = SimulationStatus.Waiting;

    private List<SimulationComputerInstance> instances;

    private long generation;

    private SimulationResult result;

    @DateTimeFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSZ")
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @DateTimeFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSZ")
    private OffsetDateTime finishedAt;

    private double fitness;

    private boolean bestPhenotype;

    public Optional<SimulationResult> getResult() {
        return Optional.ofNullable(result);
    }
}
