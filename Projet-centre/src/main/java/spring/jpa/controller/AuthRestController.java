package spring.jpa.controller;

import java.security.Principal;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional; 
import java.util.concurrent.ThreadLocalRandom; 

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import spring.jpa.dto.SignupRequest;
import spring.jpa.dto.LoginRequest;
import spring.jpa.model.User;
import spring.jpa.model.Etudiant;
import spring.jpa.model.Formateur;
import spring.jpa.repository.UserRepository;
import spring.jpa.repository.EtudiantRepository;
import spring.jpa.repository.FormateurRepository;
import spring.jpa.security.JwtUtil;

@RestController
@RequestMapping("/auth")
public class AuthRestController {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private EtudiantRepository etudiantRepository; 
    
    @Autowired
    private FormateurRepository formateurRepository; 
    
    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private PasswordEncoder passwordEncoder; 

    // Helper method to generate a unique Matricule (e.g., IIT-2026-1234)
    private String generateMatricule() {
        int year = 2026; // Adjust based on current year or signup date
        // Generate a random 4-digit number
        int randomNum = ThreadLocalRandom.current().nextInt(1000, 10000); 
        return "IIT-" + year + "-" + randomNum;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpServletResponse response) { 
        
        // 1. Find the user by username
        String username = request.getUsername();
        Optional<User> userOptional = userRepository.findByUsername(username);

        if (userOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Invalid credentials."));
        }

        User user = userOptional.get();

        // 2. Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Invalid credentials."));
        }

        // 3. Generate JWT
        String token = jwtUtil.generateToken(user.getUsername(), List.of(user.getRole()));
        
        // 4. Set JWT cookie (for browser/Thymeleaf pages)
        Cookie cookie = new Cookie("JWT", token);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge((int) (86400 * 2)); // 2 days
        // cookie.setSecure(true); // Uncomment in production with HTTPS
        response.addCookie(cookie);

        // 5. RETURN TOKEN IN JSON RESPONSE (for Thunder Client/Postman/API clients)
        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("token", token);
        responseBody.put("username", user.getUsername());
        responseBody.put("role", user.getRole());
        
        // Add profile ID if available
        if ("ETUDIANT".equals(user.getRole()) && user.getEtudiant() != null) {
            responseBody.put("etudiantId", user.getEtudiant().getId());
        } else if ("FORMATEUR".equals(user.getRole()) && user.getFormateur() != null) {
            responseBody.put("formateurId", user.getFormateur().getId());
        }

        return ResponseEntity.ok(responseBody);
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, String>> getCurrentUser(Principal principal) {
        if (principal == null) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED); 
        }

        String username = principal.getName(); 
        User user = userRepository.findByUsername(username).orElse(null);
        
        if (user == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        return ResponseEntity.ok(Map.of(
            "username", user.getUsername(), 
            "role", user.getRole()
        ));
    }


    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest request, HttpServletResponse response) { 
        
        String principalUsername = request.getEmail(); 

        // 1. Input Validation: Check if email (now username) is already taken
        if (userRepository.findByUsername(principalUsername).isPresent()) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Email address is already used for an account!"));
        }

        // 2. Create and Save the base User entity
        User user = new User();
        user.setUsername(principalUsername); 
        user.setPassword(passwordEncoder.encode(request.getPassword())); 
        String role = request.getRole().toUpperCase();
        user.setRole(role);
        
        User savedUser = userRepository.save(user);

        // 3. Link User to Etudiant/Formateur based on role
        if ("ETUDIANT".equals(role)) {
            
            Etudiant etudiant = new Etudiant();
            etudiant.setNom(request.getNom());         
            etudiant.setPrenom(request.getPrenom());   
            etudiant.setEmail(request.getEmail());     
            
            // Auto-generate Matricule
            etudiant.setMatricule(generateMatricule()); 
            
            etudiant.setDateInscription(new Date()); 
            etudiant.setActif(true); 

            etudiant.setUser(savedUser); 
            Etudiant savedEtudiant = etudiantRepository.save(etudiant);
            
            savedUser.setEtudiant(savedEtudiant); 
            userRepository.save(savedUser); 

        } else if ("FORMATEUR".equals(role)) {
            
            Formateur formateur = new Formateur();
            formateur.setNom(request.getNom());          
            formateur.setPrenom(request.getPrenom());  
            formateur.setEmail(request.getEmail());      
            formateur.setSpecialite(request.getSpecialite()); 

            formateur.setUser(savedUser);
            Formateur savedFormateur = formateurRepository.save(formateur);
            
            savedUser.setFormateur(savedFormateur);
            userRepository.save(savedUser);
            
        } 

        // 4. Generate JWT and set cookie (automatic login after signup)
        String token = jwtUtil.generateToken(savedUser.getUsername(), List.of(savedUser.getRole()));
        
        Cookie cookie = new Cookie("JWT", token);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge((int) (86400 * 2)); 
        response.addCookie(cookie);

        // 5. RETURN TOKEN IN JSON RESPONSE (for API clients)
        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("token", token);
        responseBody.put("username", savedUser.getUsername());
        responseBody.put("role", savedUser.getRole());
        responseBody.put("message", "Signup successful");

        return ResponseEntity.ok(responseBody);
    }
}