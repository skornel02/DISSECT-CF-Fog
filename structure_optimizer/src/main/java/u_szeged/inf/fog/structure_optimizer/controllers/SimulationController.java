package u_szeged.inf.fog.structure_optimizer.controllers;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.websocket.server.PathParam;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import u_szeged.inf.fog.structure_optimizer.dtos.SimulationStartedDto;
import u_szeged.inf.fog.structure_optimizer.dtos.SimulationStatusDto;
import u_szeged.inf.fog.structure_optimizer.enums.SimulationStatus;
import u_szeged.inf.fog.structure_optimizer.models.SimulationModel;
import u_szeged.inf.fog.structure_optimizer.models.SimulationResult;
import u_szeged.inf.fog.structure_optimizer.optimizers.BaseSimulationOptimization;
import u_szeged.inf.fog.structure_optimizer.services.OptimizationService;
import u_szeged.inf.fog.structure_optimizer.services.SimulationService;
import u_szeged.inf.fog.structure_optimizer.structures.SimulationStructure;

import java.util.UUID;

@Tag(name = "Simulations", description = "Simulation related operations")
@RestController

public class SimulationController {

    private final OptimizationService optimizationService;

    public SimulationController(OptimizationService optimizationService) {
        this.optimizationService = optimizationService;
    }

    @GetMapping("/api/simulations/{id}")
    public ResponseEntity<SimulationStatusDto> getSimulation(@PathVariable String id) {
        if (!optimizationService.getSimulations().containsKey(id)) {
            return ResponseEntity.notFound().build();
        }

        var simulation = optimizationService.getSimulations().get(id);

        var result = new SimulationStatusDto(
                simulation.getId(),
                simulation.getSimulationType(),
                !simulation.isDone(),
                simulation.getSimulations()
        );

        return ResponseEntity.ok(result);
    }

    @PostMapping("/api/simulations/random")
    public ResponseEntity<SimulationStartedDto> runSimulation(@RequestBody SimulationStructure structure) {
        var model = new SimulationModel();
        model.setId(UUID.randomUUID().toString());
        model.setCloudCount(15);

        var started = optimizationService.startRandomOptimization(structure);

        return ResponseEntity.ok(started);
    }

}
