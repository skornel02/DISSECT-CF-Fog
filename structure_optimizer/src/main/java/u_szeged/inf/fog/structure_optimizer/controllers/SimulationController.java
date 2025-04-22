package u_szeged.inf.fog.structure_optimizer.controllers;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import u_szeged.inf.fog.structure_optimizer.dtos.GeneticSimulationRequest;
import u_szeged.inf.fog.structure_optimizer.dtos.SimulationStartedDto;
import u_szeged.inf.fog.structure_optimizer.dtos.SimulationStatusDto;
import u_szeged.inf.fog.structure_optimizer.enums.SimulationStatus;
import u_szeged.inf.fog.structure_optimizer.models.SimulationModel;
import u_szeged.inf.fog.structure_optimizer.optimizers.GeneticSimulationOptimization;
import u_szeged.inf.fog.structure_optimizer.services.OptimizationService;
import u_szeged.inf.fog.structure_optimizer.services.SimulationService;
import u_szeged.inf.fog.structure_optimizer.structures.SimulationStructure;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

@Tag(name = "Simulations", description = "Simulation related operations")
@RestController

public class SimulationController {

    private final OptimizationService optimizationService;
    private final SimulationService simulationService;

    public SimulationController(OptimizationService optimizationService, SimulationService simulationService) {
        this.optimizationService = optimizationService;
        this.simulationService = simulationService;
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

    @PostMapping("/api/simulations/{id}/manual")
    public ResponseEntity<SimulationModel> runManualSimulation(
            @PathVariable String id,
            @RequestBody List<Integer> computers) {
        if (!optimizationService.getSimulations().containsKey(id)) {
            return ResponseEntity.notFound().build();
        }

        var simulation = optimizationService.getSimulations().get(id);

        if (simulation.isRunning()) {
            return ResponseEntity.status(409).build();
        }

        var i = new AtomicInteger();
        var computerInstances = simulation.getComputerInstances()
                .stream()
                .map(computer -> computer.toBuilder()
                        .count(computers.get(i.getAndIncrement()))
                        .build())
                .toList();

        var simulationModel = new SimulationModel();
        simulationModel.setId(UUID.randomUUID().toString());
        simulationModel.setInstances(computerInstances);
        simulationModel.setGeneration(-1);

        var result = simulationService.runSimulation(simulationModel, 1);
        simulationModel.setResult(result);
        simulationModel.setStatus(SimulationStatus.Finished);

        if (simulation instanceof GeneticSimulationOptimization gso)
        {
            simulationModel.setPricePenalty(gso.getPricePenalty(result));
            simulationModel.setFitness(gso.calculateFitness(result));
        }

        simulation.getSimulations().add(simulationModel);
        simulation.updateLastUpdated();

        return ResponseEntity.ok()
                .body(simulationModel);
    }

    @PostMapping("/api/simulations/random")
    public ResponseEntity<SimulationStartedDto> runRandomSimulation(@RequestBody SimulationStructure structure) {
        var started = optimizationService.startRandomOptimization(structure);

        return ResponseEntity.ok(started);
    }

    @PostMapping("/api/simulations/genetic")
    public ResponseEntity<SimulationStartedDto> runGeneticSimulation(@RequestBody GeneticSimulationRequest request) {
        var started = optimizationService.startGeneticOptimization(request);

        return ResponseEntity.ok(started);
    }

}
