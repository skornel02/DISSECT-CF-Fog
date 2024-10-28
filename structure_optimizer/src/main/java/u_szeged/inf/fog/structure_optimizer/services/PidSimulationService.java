package u_szeged.inf.fog.structure_optimizer.services;

import com.stormbots.pid_simulation.PidSimulator;
import lombok.extern.java.Log;
import u_szeged.inf.fog.structure_optimizer.models.PidSimulationModel;
import u_szeged.inf.fog.structure_optimizer.models.PidSimulationResult;

@Log
public class PidSimulationService {

    public PidSimulationService() {
    }

    public PidSimulationResult simulatePid(PidSimulationModel model, int totalTime, double outputLimiter) {
        var miniPID = new PidSimulator(model.proportional(), model.integral(), model.derivative());

        double[] values = new double[totalTime];
        values[0] = 0;

        double target=100;

        double maxValue = 0;

        miniPID.setOutputLimits(outputLimiter);
        miniPID.setSetpoint(100);

        // Position based test code
        for (int i = 1; i < totalTime; i++){
            var previousValue = values[i - 1];
            var output = miniPID.getOutput(previousValue);
            var nextValue = previousValue + output;

            values[i] = nextValue;

            if (nextValue > maxValue) {
                maxValue = nextValue;
            }
        }

        var timeToSettle = -1;
        for (int i = totalTime - 2; i >= 0; i--) {
            var change = Math.abs(values[i] - values[i + 1]);
            if (change < 0.01) {
                timeToSettle = i;
            } else {
                break;
            }
        }

        var overshoot = (maxValue - target) / target;

        var steadyStateValue = timeToSettle == -1 ? -1 : values[totalTime - 1];
        var error = Math.abs(target - steadyStateValue);

        return new PidSimulationResult(timeToSettle, overshoot, steadyStateValue, error, values);
    }
}
