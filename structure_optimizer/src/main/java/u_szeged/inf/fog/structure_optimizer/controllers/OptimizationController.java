package u_szeged.inf.fog.structure_optimizer.controllers;

import hu.u_szeged.inf.fog.simulator.demo.ScenarioBase;
import hu.u_szeged.inf.fog.simulator.util.SimLogger;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyEmitter;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;
import u_szeged.inf.fog.structure_optimizer.models.SimulationModel;
import u_szeged.inf.fog.structure_optimizer.optimizers.BaseSimulationOptimization;
import u_szeged.inf.fog.structure_optimizer.optimizers.RandomSimulationOptimization;
import u_szeged.inf.fog.structure_optimizer.services.SimulationService;
import u_szeged.inf.fog.structure_optimizer.utils.SimpleLogHandler;

import java.io.File;
import java.nio.file.Files;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Controller
public class OptimizationController {
    private static final Set<ResponseBodyEmitter.DataWithMediaType> FINISH_EVENT = SseEmitter.event()
            .id("-1")
            .name("finished")
            .build();
    private static final Set<ResponseBodyEmitter.DataWithMediaType> INVALID_UUID_EVENT = SseEmitter.event()
            .data("Invalid UUID")
            .id("-2")
            .name("message")
            .build();

    private final SimulationService simulationService;
    private final SpringTemplateEngine templateEngine;

    private final HashMap<String, BaseSimulationOptimization> simulations;

    @Autowired
    public OptimizationController(SimulationService simulationService,
                                  SpringTemplateEngine templateEngine) {
        this.simulationService = simulationService;
        this.templateEngine = templateEngine;

        simulations = new HashMap<>();
    }

    @GetMapping("/optimize")
    public String optimize(Model model) {
        return "redirect:/";
    }

    @PostMapping("/optimize")
    public String optimize(Model model, @RequestParam String uuid) {
        model.addAttribute("uuid", uuid);

        if (!simulations.containsKey(uuid)) {
            try {
                var simulation = new RandomSimulationOptimization(simulationService, uuid, 10);

                simulations.put(uuid, simulation);
                simulation.start();
            } catch (Exception ex) {

            }
        }

        return "optimize";
    }

    @GetMapping("/optimize/{uuid}/simulations")
    public SseEmitter streamOptimizationSimulations(@PathVariable String uuid) {
        SseEmitter emitter = new SseEmitter();
        //noinspection resource
        ExecutorService sseMvcExecutor = Executors.newSingleThreadExecutor();
        sseMvcExecutor.execute(() -> {
            try {
                if (!simulations.containsKey(uuid)) {
                    emitter.send(INVALID_UUID_EVENT);
                    emitter.send(FINISH_EVENT);
                    emitter.complete();
                    return;
                }

                var optimization = simulations.get(uuid);

                if (optimization.isDone()) {
                    emitter.send(FINISH_EVENT);
                    emitter.complete();
                    return;
                }

                for (int i = 0; true; i++) {
                    var context = new Context();
                    context.setVariable("simulations", optimization.getSimulations());

                    var rendered = templateEngine.process("simulation-card", context);

                    SseEmitter.SseEventBuilder event = SseEmitter.event()
                            .data(rendered)
                            .id(String.valueOf(i))
                            .name("message");
                    emitter.send(event);

                    if (optimization.isDone()) {
                        emitter.send(FINISH_EVENT);
                        emitter.complete();
                        break;
                    }

                    Thread.sleep(2000);
                }
            } catch (Exception ex) {
                emitter.completeWithError(ex);
            }
        });
        return emitter;
    }

    @GetMapping("/optimize/{uuid}/status")
    public SseEmitter streamOptimizationStatus(@PathVariable String uuid) {
        SseEmitter emitter = new SseEmitter();
        //noinspection resource
        ExecutorService sseMvcExecutor = Executors.newSingleThreadExecutor();
        sseMvcExecutor.execute(() -> {
            try {
                if (!simulations.containsKey(uuid)) {
                    emitter.send(INVALID_UUID_EVENT);
                    emitter.send(FINISH_EVENT);
                    emitter.complete();
                    return;
                }

                var optimization = simulations.get(uuid);

                if (optimization.isDone()) {
                    emitter.send(FINISH_EVENT);
                    emitter.complete();
                    return;
                }

                for (int i = 0; true; i++) {
                    var context = new Context();
                    context.setVariable("optimization", optimization);

                    var rendered = templateEngine.process("optimize-status", context);

                    SseEmitter.SseEventBuilder event = SseEmitter.event()
                            .data(rendered)
                            .id(String.valueOf(i))
                            .name("message");
                    emitter.send(event);

                    if (optimization.isDone()) {
                        emitter.send(FINISH_EVENT);
                        emitter.complete();
                        break;
                    }

                    Thread.sleep(2000);
                }
            } catch (Exception ex) {
                emitter.completeWithError(ex);
            }
        });
        return emitter;
    }
}
