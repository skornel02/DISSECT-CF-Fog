package u_szeged.inf.fog.structure_optimizer.services;

import u_szeged.inf.fog.structure_optimizer.models.SimulationModel;
import u_szeged.inf.fog.structure_optimizer.models.SimulationResult;

public interface ISimulationService {
    SimulationResult runSimulation(SimulationModel model, int tasksMultiplier);
}
