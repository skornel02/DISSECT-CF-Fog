package u_szeged.inf.fog.structure_optimizer.controllers;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import u_szeged.inf.fog.structure_optimizer.dtos.GeneticSimulationRequest;
import u_szeged.inf.fog.structure_optimizer.dtos.SimulationStartedDto;
import u_szeged.inf.fog.structure_optimizer.dtos.SimulationStatusDto;
import u_szeged.inf.fog.structure_optimizer.models.SimulationModel;
import u_szeged.inf.fog.structure_optimizer.optimizers.GeneticSimulationOptimization;
import u_szeged.inf.fog.structure_optimizer.services.OptimizationService;
import u_szeged.inf.fog.structure_optimizer.structures.SimulationStructure;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;

@Tag(name = "Simulations", description = "Simulation related operations")
@RestController

public class SimulationController {

    private final OptimizationService optimizationService;

    public SimulationController(OptimizationService optimizationService) {
        this.optimizationService = optimizationService;
    }

    @GetMapping("/api/simulations/{id}")
    public ResponseEntity<SimulationStatusDto> getSimulation(
            @PathVariable String id,
            @RequestParam(required = false) String lastUpdated,
            @RequestHeader(name = "If-None-Match", required = false) String ifNoneMatch) {
        if (!optimizationService.getSimulations().containsKey(id)) {
            return ResponseEntity.notFound().build();
        }

        var simulation = optimizationService.getSimulations().get(id);

        if (simulation.getLastUpdated().toString().equals(ifNoneMatch)) {
            return ResponseEntity.status(304).build();
        }

        var simulations = simulation.getSimulations()
                .stream()
                .filter(s -> lastUpdated == null || s == null || s.getCreatedAt().isAfter(OffsetDateTime.parse(lastUpdated)))
                .toList();

        var maxSimulationsFinished = simulations.stream()
                .filter(s -> s.getFinishedAt() != null)
                .min((a, b) -> b.getFinishedAt().compareTo(a.getFinishedAt()));

        var result = new SimulationStatusDto(
                simulation.getId(),
                simulation.getSimulationType(),
                !simulation.isDone(),
                simulations,
                simulation instanceof GeneticSimulationOptimization geneticSim
                        ? geneticSim.getGoalSettings()
                        : null
        );

        return ResponseEntity.ok()
                .eTag(simulation.getLastUpdated().toString())
                .header("X-Last-Updated", maxSimulationsFinished.map(SimulationModel::getFinishedAt).orElse(OffsetDateTime.now().minusMinutes(1)).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME))
                .body(result);
    }

    @PostMapping("/api/simulations/random")
    public ResponseEntity<SimulationStartedDto> runRandomSimulation(@RequestBody SimulationStructure structure) {
        var started = optimizationService.startRandomOptimization(structure);

        return ResponseEntity.ok(started);
    }

    @PostMapping("/api/simulations/genetic")
    public ResponseEntity<SimulationStartedDto> runGeneticSimulation(@RequestBody GeneticSimulationRequest request) {
        var started = optimizationService.startGeneticOptimization(request.getStructure(), request.getGoalSettings());

        return ResponseEntity.ok(started);
    }

}
