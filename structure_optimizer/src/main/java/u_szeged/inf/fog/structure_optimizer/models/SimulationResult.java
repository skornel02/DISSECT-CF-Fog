package u_szeged.inf.fog.structure_optimizer.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;
import org.apache.commons.lang3.exception.ExceptionUtils;

@Data
@Builder
public class SimulationResult {
    @NotNull
    private String id;

    @NotNull
    private String resultDirectory;

    @NotNull
    private String logs;

    @NotNull
    private double totalCost;
    @NotNull
    private double totalEnergyConsumption;
    @NotNull
    private long executionTime;

    @NotNull
    private int totalTasks;
    @NotNull
    private int completedTasks;

    @JsonIgnore
    private Exception exception;

    public String getErrorMessage() {
        return exception != null ? exception.getMessage() : null;
    }

    public String getErrorStackTrace() {
        return exception != null ? ExceptionUtils.getStackTrace(exception) : null;
    }
}
