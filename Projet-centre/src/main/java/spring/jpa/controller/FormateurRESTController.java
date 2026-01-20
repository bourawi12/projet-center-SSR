package spring.jpa.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import jakarta.transaction.Transactional;
import spring.jpa.model.Formateur;
import spring.jpa.model.Cours;
import spring.jpa.model.Groupe;
import spring.jpa.model.Seance;
import spring.jpa.model.User;
import spring.jpa.dto.FormateurProfileUpdateRequest;
import spring.jpa.repository.CoursRepository;
import spring.jpa.repository.GroupeRepository;
import spring.jpa.repository.SeanceRepository;
import spring.jpa.repository.FormateurRepository;
import spring.jpa.repository.UserRepository;

@RestController
@RequestMapping("/formateurs")
public class FormateurRESTController {

    @Autowired
    private FormateurRepository formateurRepository;

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private CoursRepository coursRepository;
    
    @Autowired
    private GroupeRepository groupeRepository;
    
    @Autowired
    private SeanceRepository seanceRepository;

    /**
     * GET /formateurs/me
     * Endpoint for the Formateur to retrieve their own data.
     * Accessible by FORMATEUR role.
     */
    @GetMapping("/me")
    public ResponseEntity<Formateur> getCurrentFormateur(Principal principal) {
        if (principal == null) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }

        String username = principal.getName();
        User user = userRepository.findByUsername(username).orElse(null);
        
        if (user == null || user.getFormateur() == null || !"FORMATEUR".equals(normalizeRole(user.getRole()))) {
             return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        
        return new ResponseEntity<>(user.getFormateur(), HttpStatus.OK);
    }

    @PutMapping(value = "/me", consumes = MediaType.APPLICATION_JSON_VALUE, produces = { MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE })
    public ResponseEntity<?> updateCurrentFormateur(@RequestBody FormateurProfileUpdateRequest request, Principal principal) {
        User user = requireFormateur(principal);
        if (user == null) return new ResponseEntity<>(HttpStatus.FORBIDDEN);

        Formateur formateur = user.getFormateur();
        if (request.getNom() != null && !request.getNom().isBlank()) {
            formateur.setNom(request.getNom());
        }
        if (request.getPrenom() != null && !request.getPrenom().isBlank()) {
            formateur.setPrenom(request.getPrenom());
        }

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            String newEmail = request.getEmail().trim();
            if (!newEmail.equalsIgnoreCase(user.getUsername())) {
                if (userRepository.findByUsername(newEmail).isPresent()) {
                    return ResponseEntity.badRequest().body("Email address is already used for an account!");
                }
                user.setUsername(newEmail);
                formateur.setEmail(newEmail);
            }
        }

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        userRepository.save(user);
        Formateur updated = formateurRepository.save(formateur);
        return new ResponseEntity<>(updated, HttpStatus.OK);
    }

    @GetMapping("/me/cours")
    public ResponseEntity<List<Cours>> getMyCourses(Principal principal) {
        User user = requireFormateur(principal);
        if (user == null) return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        List<Cours> cours = coursRepository.findByFormateur(user.getFormateur());
        return ResponseEntity.ok(cours);
    }

    @GetMapping("/me/seances")
    public ResponseEntity<List<Seance>> getMySeances(Principal principal) {
        User user = requireFormateur(principal);
        if (user == null) return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        List<Cours> cours = coursRepository.findByFormateur(user.getFormateur());
        List<Seance> seances = seanceRepository.findAll().stream()
            .filter(s -> s.getCours() != null && cours.contains(s.getCours()))
            .toList();
        return ResponseEntity.ok(seances);
    }

    @GetMapping("/me/groupes")
    public ResponseEntity<List<Groupe>> getMyGroupes(Principal principal) {
        User user = requireFormateur(principal);
        if (user == null) return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        List<Cours> cours = coursRepository.findByFormateur(user.getFormateur());
        List<Groupe> groupes = groupeRepository.findAll().stream()
            .filter(g -> g.getCours() != null && g.getCours().stream().anyMatch(cours::contains))
            .toList();
        return ResponseEntity.ok(groupes);
    }
    
    /**
     * GET /formateurs/
     * ADMIN-only endpoint to get all Formateurs.
     */
    @GetMapping("/")
    public ResponseEntity<List<Formateur>> getAll() {
        List<Formateur> formateurs = formateurRepository.findAll();
        return ResponseEntity.ok(formateurs);
    }
    
    /**
     * GET /formateurs/{id}
     * ADMIN-only endpoint to get a specific Formateur by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Formateur> getById(@PathVariable Long id) {
        return formateurRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * POST /formateurs/
     * ADMIN-only endpoint to create a new Formateur.
     */
    @PostMapping(
        value = "/",
        consumes = { MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE },
        produces = { MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE }
    )
    public ResponseEntity<?> saveFormateur(@RequestBody Formateur f) {
        System.out.println("=== CREATE FORMATEUR DEBUG ===");
        System.out.println("Nom: " + f.getNom());
        System.out.println("Prenom: " + f.getPrenom());
        System.out.println("Email: " + f.getEmail());
        
        try {
            // 1. Get the User object from the nested Formateur object
            User newUser = f.getUser(); 
            
            if (newUser == null) {
                System.err.println("ERROR: User information is missing");
                return ResponseEntity.badRequest()
                    .body("User information is required");
            }
            
            System.out.println("Username: " + newUser.getUsername());
            
            // 2. Check if username already exists
            if (userRepository.findByUsername(newUser.getUsername()).isPresent()) {
                System.err.println("ERROR: Username already exists");
                return ResponseEntity.badRequest()
                    .body("Username already exists: " + newUser.getUsername());
            }
            
            // 3. Set the role and encrypt the password
            newUser.setRole("FORMATEUR"); 
            String encodedPassword = passwordEncoder.encode(newUser.getPassword());
            newUser.setPassword(encodedPassword);
            System.out.println("Password encrypted successfully");
            
            // 4. Save the User first (without linking to Formateur yet)
            User savedUser = userRepository.save(newUser);
            System.out.println("User saved with ID: " + savedUser.getId());
            
            // 5. Link the saved User to the Formateur
            f.setUser(savedUser);
            
            // 6. Save the Formateur
            Formateur savedFormateur = formateurRepository.save(f);
            System.out.println("Formateur saved with ID: " + savedFormateur.getId());
            
            // 7. Update the User to link back to Formateur (bidirectional relationship)
            savedUser.setFormateur(savedFormateur);
            userRepository.save(savedUser);
            System.out.println("Bidirectional link established");
            
            return ResponseEntity.status(HttpStatus.CREATED).body(savedFormateur);
            
        } catch (Exception e) {
            System.err.println("ERROR creating formateur: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error creating formateur: " + e.getMessage());
        }
    }

    /**
     * PUT /formateurs/{id}
     * ADMIN-only endpoint to update an existing Formateur.
     */
    @PutMapping(
        value = "/{id}",
        consumes = { MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE },
        produces = { MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE }
    )
    public ResponseEntity<?> updateFormateur(@PathVariable Long id, @RequestBody Formateur updatedFormateur) {
        System.out.println("=== UPDATE FORMATEUR DEBUG ===");
        System.out.println("ID: " + id);
        System.out.println("Updated Nom: " + updatedFormateur.getNom());
        
        try {
            // Find existing formateur
            Formateur existingFormateur = formateurRepository.findById(id).orElse(null);
                
            if (existingFormateur == null) {
                System.err.println("ERROR: Formateur not found with ID: " + id);
                return ResponseEntity.notFound().build();
            }
            
            System.out.println("Found existing formateur: " + existingFormateur.getNom());
            
            // Update formateur fields (only if provided)
            if (updatedFormateur.getNom() != null) {
                existingFormateur.setNom(updatedFormateur.getNom());
            }
            if (updatedFormateur.getPrenom() != null) {
                existingFormateur.setPrenom(updatedFormateur.getPrenom());
            }
            if (updatedFormateur.getEmail() != null) {
                existingFormateur.setEmail(updatedFormateur.getEmail());
            }
            if (updatedFormateur.getSpecialite() != null) {
                existingFormateur.setSpecialite(updatedFormateur.getSpecialite());
            }
            
            // Update user credentials if provided
            if (updatedFormateur.getUser() != null) {
                User existingUser = existingFormateur.getUser();
                
                if (existingUser == null) {
                    System.err.println("WARNING: No user linked to this formateur");
                } else {
                    // Update username if provided and different
                    if (updatedFormateur.getUser().getUsername() != null && 
                        !updatedFormateur.getUser().getUsername().equals(existingUser.getUsername())) {
                        
                        // Check if new username is already taken
                        if (userRepository.findByUsername(updatedFormateur.getUser().getUsername()).isPresent()) {
                            return ResponseEntity.badRequest()
                                .body("Username already exists: " + updatedFormateur.getUser().getUsername());
                        }
                        
                        existingUser.setUsername(updatedFormateur.getUser().getUsername());
                        System.out.println("Username updated");
                    }
                    
                    // Update password if provided and not empty
                    if (updatedFormateur.getUser().getPassword() != null && 
                        !updatedFormateur.getUser().getPassword().trim().isEmpty()) {
                        
                        String encodedPassword = passwordEncoder.encode(updatedFormateur.getUser().getPassword());
                        existingUser.setPassword(encodedPassword);
                        System.out.println("Password updated");
                    }
                    
                    // Save updated user
                    userRepository.save(existingUser);
                }
            }
            
            // Save updated formateur
            Formateur saved = formateurRepository.save(existingFormateur);
            System.out.println("Formateur updated successfully");
            
            return ResponseEntity.ok(saved);
            
        } catch (Exception e) {
            System.err.println("ERROR updating formateur: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error updating formateur: " + e.getMessage());
        }
    }

    /**
     * DELETE /formateurs/{id}
     * ADMIN-only endpoint to delete a Formateur.
     */
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteFormateur(@PathVariable Long id) {
        try {
            System.out.println("=== DELETE FORMATEUR DEBUG ===");
            System.out.println("Deleting formateur ID: " + id);
            
            // Find the formateur
            Formateur formateur = formateurRepository.findById(id).orElse(null);
            
            if (formateur == null) {
                System.err.println("ERROR: Formateur not found");
                return ResponseEntity.notFound().build();
            }
            
            // Get the associated user
            User user = formateur.getUser();
            
            if (user == null) {
                System.out.println("No user associated, deleting formateur only");
                formateurRepository.delete(formateur);
                return ResponseEntity.ok().body("Formateur deleted successfully");
            }
            
            System.out.println("User found: " + user.getUsername() + " (ID: " + user.getId() + ")");
            
            // IMPORTANT: Break the bidirectional link first to avoid constraint issues
            user.setFormateur(null);
            formateur.setUser(null);
            
            // Save both to persist the broken links
            userRepository.save(user);
            formateurRepository.save(formateur);
            formateurRepository.flush();
            
            System.out.println("Bidirectional links removed");
            
            // Now delete formateur (no foreign key constraint issues)
            formateurRepository.delete(formateur);
            formateurRepository.flush();
            System.out.println("Formateur deleted");
            
            // Finally delete the user
            userRepository.delete(user);
            userRepository.flush();
            System.out.println("User deleted");
            
            return ResponseEntity.ok()
                .body("Formateur and associated user deleted successfully");
                
        } catch (Exception e) {
            System.err.println("ERROR deleting formateur: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error deleting formateur: " + e.getMessage());
        }
    }

    private String normalizeRole(String role) {
        if (role == null) return "";
        String trimmed = role.trim();
        String normalized = trimmed.startsWith("ROLE_") ? trimmed.substring("ROLE_".length()) : trimmed;
        return normalized.trim().toUpperCase();
    }

    private User requireFormateur(Principal principal) {
        if (principal == null) return null;
        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null || user.getFormateur() == null || !"FORMATEUR".equals(normalizeRole(user.getRole()))) {
            return null;
        }
        return user;
    }
}
