package u_szeged.inf.fog.structure_optimizer.models;

import lombok.Builder;
import lombok.Data;
import org.apache.commons.lang3.exception.ExceptionUtils;

@Data
@Builder
public class SimulationResult {
    private String id;

    private String resultDirectory;

    private String logs;

    private double totalCost;
    private double totalEnergyConsumption;
    private long executionTime;

    private int totalTasks;
    private int completedTasks;

    private Exception exception;

    public String getErrorMessage() {
        return exception != null ? exception.getMessage() : null;
    }

    public String getErrorStackTrace() {
        return exception != null ? ExceptionUtils.getStackTrace(exception) : null;
    }
}
