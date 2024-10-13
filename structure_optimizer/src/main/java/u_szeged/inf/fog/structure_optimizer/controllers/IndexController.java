package u_szeged.inf.fog.structure_optimizer.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.UUID;

@Controller
public class IndexController  {
    public IndexController() {
        super();
    }

    @GetMapping
    public String index(Model model) {
        var uuid = UUID.randomUUID().toString();

        // add guid to the model
        model.addAttribute("uuid", uuid);

        return "index";
    }
}
