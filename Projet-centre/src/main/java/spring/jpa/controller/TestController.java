package spring.jpa.controller;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class TestController {

    @GetMapping("/hello")
    public String hello(Authentication authentication) {
        return "Hello " + authentication.getName();
    }

    @GetMapping("/admin")
    public String admin(Authentication authentication) {
        return "Admin access OK for " + authentication.getName();
    }
}
