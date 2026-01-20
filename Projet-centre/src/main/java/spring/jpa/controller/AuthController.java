/*package spring.jpa.controller;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import spring.jpa.dto.SignupRequest;
import spring.jpa.model.User;
import spring.jpa.repository.UserRepository;
import spring.jpa.security.JwtUtil;

@Controller
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    // ===== SIGNUP FORM =====
    @GetMapping("/signup")
    public String signupForm(Model model) {
        model.addAttribute("signup", new SignupRequest());
        return "signup";
    }

    // ===== SIGNUP SUBMIT =====
    @PostMapping("/signup")
    public String signup(@ModelAttribute SignupRequest request) {

        User user = new User();
        user.setUsername(request.username);
        user.setPassword(passwordEncoder.encode(request.password));
        user.setRole(request.role);

        userRepository.save(user);

        return "redirect:/auth/login";
    }

    // ===== LOGIN FORM =====
    @GetMapping("/login")
    public String loginForm() {
        return "login";
    }

    // ===== LOGIN SUBMIT =====
    @PostMapping("/login")
    public String login(
            @RequestParam String username,
            @RequestParam String password,
            HttpServletResponse response
    ) {

        User user = userRepository.findByUsername(username)
                .orElse(null);

        if (user == null || !passwordEncoder.matches(password, user.getPassword())) {
            return "login";
        }

        String token = jwtUtil.generateToken(
                user.getUsername(),
                List.of(user.getRole())
        );

        Cookie jwtCookie = new Cookie("JWT", token);
        jwtCookie.setHttpOnly(true);
        jwtCookie.setPath("/");

        response.addCookie(jwtCookie);

        return "redirect:/etudiant/index";
    }
}*/
