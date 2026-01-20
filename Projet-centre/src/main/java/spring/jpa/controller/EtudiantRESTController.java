package spring.jpa.controller;

import java.security.Principal;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import jakarta.transaction.Transactional;
import spring.jpa.dto.EtudiantCreationRequest; // NEW DTO
import spring.jpa.dto.EtudiantProfileUpdateRequest;
import spring.jpa.model.Etudiant;
import spring.jpa.model.Groupe;
import spring.jpa.model.User;
import spring.jpa.repository.EtudiantRepository;
import spring.jpa.repository.GroupeRepository;
import spring.jpa.repository.InscriptionRepository;
import spring.jpa.repository.NoteRepository;
import spring.jpa.repository.UserRepository; 

@RestController
@RequestMapping("/etudiants") 
public class EtudiantRESTController {

    @Autowired
    private EtudiantRepository etudiantRepository;
    
    @Autowired
    private UserRepository userRepository; 
    
    @Autowired 
    private PasswordEncoder passwordEncoder; // Required for password hashing in Admin creation
    
    @Autowired
    private InscriptionRepository inscriptionRepository;

    @Autowired
    private GroupeRepository groupeRepository;
    
    @Autowired // <-- NEW INJECTION
    private NoteRepository noteRepository;

    // Helper method to generate a unique Matricule (similar to AuthRestController)
    private String generateMatricule() {
        int year = 2026; 
        int randomNum = ThreadLocalRandom.current().nextInt(1000, 10000); 
        return "IIT-" + year + "-" + randomNum;
    }

    // GET MY PROFILE - ETUDIANT ROLE
    @GetMapping(value = "/me", produces = { MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE })
    public ResponseEntity<Etudiant> getCurrentEtudiant(Principal principal) {
        if (principal == null) return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);

        String username = principal.getName();
        User user = userRepository.findByUsername(username).orElse(null);

        if (user == null || user.getEtudiant() == null || !"ETUDIANT".equals(normalizeRole(user.getRole()))) {
             return new ResponseEntity<>(HttpStatus.FORBIDDEN); 
        }
        return new ResponseEntity<>(user.getEtudiant(), HttpStatus.OK);
    }

    // UPDATE MY PROFILE - ETUDIANT ROLE
    @PutMapping(value = "/me", consumes = MediaType.APPLICATION_JSON_VALUE, produces = { MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE })
    public ResponseEntity<?> updateCurrentEtudiant(@RequestBody EtudiantProfileUpdateRequest request, Principal principal) {
        if (principal == null) return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);

        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null || user.getEtudiant() == null || !"ETUDIANT".equals(normalizeRole(user.getRole()))) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }

        Etudiant etudiant = user.getEtudiant();
        if (request.getNom() != null && !request.getNom().isBlank()) {
            etudiant.setNom(request.getNom());
        }
        if (request.getPrenom() != null && !request.getPrenom().isBlank()) {
            etudiant.setPrenom(request.getPrenom());
        }

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            String newEmail = request.getEmail().trim();
            if (!newEmail.equalsIgnoreCase(user.getUsername())) {
                if (userRepository.findByUsername(newEmail).isPresent()) {
                    return ResponseEntity.badRequest().body("Email address is already used for an account!");
                }
                user.setUsername(newEmail);
                etudiant.setEmail(newEmail);
            }
        }

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        userRepository.save(user);
        Etudiant updated = etudiantRepository.save(etudiant);
        return new ResponseEntity<>(updated, HttpStatus.OK);
    }
    
    // READ ALL - ADMIN ROLE
    @GetMapping(value = "/", produces = { MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE })
    public List<Etudiant> getAllEtudiants() {
        return etudiantRepository.findAll();
    }

    // READ BY ID - ADMIN ROLE
    @GetMapping(value = "/{id}", produces = { MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE })
    public ResponseEntity<Etudiant> getEtudiant(@PathVariable Long id) {
        return etudiantRepository.findById(id)
                .map(etudiant -> new ResponseEntity<>(etudiant, HttpStatus.OK))
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    // CREATE (POST) - ADMIN ROLE: Creates both User (login) and Etudiant
    @PostMapping(value = "/", consumes = MediaType.APPLICATION_JSON_VALUE, produces = { MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE })
    public ResponseEntity<?> createEtudiant(@RequestBody EtudiantCreationRequest request) {
        // 1. Check if email/username exists
        if (userRepository.findByUsername(request.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email address is already used for an account!");
        }

        // 2. Create and Save the base User entity
        User user = new User();
        user.setUsername(request.getEmail()); 
        user.setPassword(passwordEncoder.encode(request.getPassword())); 
        user.setRole("ETUDIANT");
        
        User savedUser = userRepository.save(user);

        // 3. Create and Save Etudiant entity
        Etudiant etudiant = new Etudiant();
        etudiant.setNom(request.getNom());         
        etudiant.setPrenom(request.getPrenom());   
        etudiant.setEmail(request.getEmail());     
        etudiant.setMatricule(generateMatricule()); 
        etudiant.setDateInscription(new Date()); 
        etudiant.setActif(true); 

        etudiant.setUser(savedUser); 
        Etudiant savedEtudiant = etudiantRepository.save(etudiant);
            
        savedUser.setEtudiant(savedEtudiant); 
        userRepository.save(savedUser); 

        return new ResponseEntity<>(savedEtudiant, HttpStatus.CREATED);
    }

    // UPDATE (PUT) - ADMIN ROLE: Updates only the Etudiant details
    @PutMapping(value = "/", consumes = MediaType.APPLICATION_JSON_VALUE, produces = { MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE })
    public ResponseEntity<Etudiant> updateEtudiant(@RequestBody Etudiant etudiantDetails) {
        Optional<Etudiant> existingEtudiant = etudiantRepository.findById(etudiantDetails.getId());

        if (existingEtudiant.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        
        Etudiant etudiant = existingEtudiant.get();
        // Update only editable fields
        etudiant.setNom(etudiantDetails.getNom());
        etudiant.setPrenom(etudiantDetails.getPrenom());
        // For simplicity, we assume other fields like email/matricule are non-editable here.
        
        Etudiant updatedEtudiant = etudiantRepository.save(etudiant);
        return new ResponseEntity<>(updatedEtudiant, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deleteEtudiant(@PathVariable Long id) {
        Optional<Etudiant> etudiantOptional = etudiantRepository.findById(id);

        if (etudiantOptional.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        
        Etudiant etudiant = etudiantOptional.get();
        Long etudiantId = etudiant.getId();
        User user = etudiant.getUser(); 

        // --- 0. REMOVE FROM GROUPES (JOIN TABLE CLEANUP) ---
        if (etudiant.getGroupes() != null && !etudiant.getGroupes().isEmpty()) {
            for (Groupe groupe : new java.util.HashSet<>(etudiant.getGroupes())) {
                groupe.getEtudiants().remove(etudiant);
                groupeRepository.save(groupe);
            }
            etudiant.getGroupes().clear();
        }
        
        // --- 1. CLEAN UP CHILD DEPENDENCIES (Notes FIRST) ---
        // Must be done before deleting the Etudiant, which is their parent.
        try {
            noteRepository.deleteAllByEtudiantId(etudiantId); // <-- NEW DELETION STEP
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete dependent Notes.", e);
        }
        
        // --- 2. CLEAN UP CHILD DEPENDENCIES (Inscription SECOND) ---
        try {
            inscriptionRepository.deleteAllByEtudiantId(etudiantId);
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete dependent Inscriptions.", e);
        }


        // --- 3. CLEAN UP PARENT/USER LINK ---
        if (user != null) {
            // Break the bidirectional link from User to Etudiant 
            user.setEtudiant(null); 
            userRepository.save(user); 
            
            // Delete the linked User
            userRepository.delete(user);
        } 
        
        // --- 4. DELETE THE ETUDIANT ---
        etudiantRepository.delete(etudiant);
        
        return new ResponseEntity<>(HttpStatus.NO_CONTENT); // 204 Success
    }

    private String normalizeRole(String role) {
        if (role == null) return "";
        String trimmed = role.trim();
        String normalized = trimmed.startsWith("ROLE_") ? trimmed.substring("ROLE_".length()) : trimmed;
        return normalized.trim().toUpperCase();
    }
}
