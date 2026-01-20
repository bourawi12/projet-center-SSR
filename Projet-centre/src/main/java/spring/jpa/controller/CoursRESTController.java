package spring.jpa.controller;

import java.security.Principal;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional; // <-- NEW IMPORT

import spring.jpa.model.Cours;
import spring.jpa.model.Formateur;
import spring.jpa.model.User;
import spring.jpa.repository.CoursRepository;
import spring.jpa.repository.FormateurRepository;
import spring.jpa.repository.UserRepository;

@RestController
@RequestMapping("/cours")
public class CoursRESTController {

    @Autowired
    private CoursRepository coursRepository;

    @Autowired
    private FormateurRepository formateurRepository;
    
    @Autowired 
    private UserRepository userRepository;

    // POST /cours/ - CREATE (Already exists, but adding comments)
    @PostMapping(
        value = "/",
        consumes = { MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE },
        produces = { MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE }
    )
    public Cours saveCours(@RequestBody Cours c) {
        if (c.getCode() == null || c.getCode().trim().isEmpty()) {
            c.setCode(generateUniqueCode());
        }
        // ... existing logic to load Formateur ...
        if (c.getFormateur() != null && c.getFormateur().getId() != null) {
            Formateur f = formateurRepository
                    .findById(c.getFormateur().getId())
                    .orElse(null);
            c.setFormateur(f);
        }
        return coursRepository.save(c);
    }

    private String generateUniqueCode() {
        String code;
        do {
            int randomNum = ThreadLocalRandom.current().nextInt(100000, 1000000);
            code = "CRS-" + randomNum;
        } while (coursRepository.existsById(code));
        return code;
    }

    // GET /cours/ - READ ALL (Already exists)
    @GetMapping("/")
    public List<Cours> getAllCours() {
        return coursRepository.findAll();
    }
    
    // GET /cours/{code} - READ ONE BY CODE <-- NEW
    @GetMapping("/{code}")
    public ResponseEntity<Cours> getCoursByCode(@PathVariable String code) {
        return coursRepository.findById(code)
                .map(cours -> new ResponseEntity<>(cours, HttpStatus.OK))
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    // PUT /cours/{code} - UPDATE <-- NEW
    @PutMapping("/{code}")
    public ResponseEntity<Cours> updateCours(@PathVariable String code, @RequestBody Cours updatedCours) {
        return coursRepository.findById(code)
            .map(existingCours -> {
                // Ensure the code isn't changed if the key is immutable
                // existingCours.setCode(updatedCours.getCode()); 
                existingCours.setTitre(updatedCours.getTitre());
                existingCours.setActif(updatedCours.isActif());
                
                // Handle Formateur assignment/reassignment
                if (updatedCours.getFormateur() != null && updatedCours.getFormateur().getId() != null) {
                    Formateur f = formateurRepository
                            .findById(updatedCours.getFormateur().getId())
                            .orElse(null);
                    existingCours.setFormateur(f);
                } else {
                    existingCours.setFormateur(null); // Allows unassigning the formateur
                }
                
                Cours savedCours = coursRepository.save(existingCours);
                return new ResponseEntity<>(savedCours, HttpStatus.OK);
            })
            .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    // DELETE /cours/{code} - DELETE <-- NEW
    @DeleteMapping("/{code}")
    @Transactional // Ensures cascading deletes (if any) are handled
    public ResponseEntity<Void> deleteCours(@PathVariable String code) {
        if (coursRepository.existsById(code)) {
            coursRepository.deleteById(code);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }
    
    @GetMapping(
            value = "/me",
            produces = { MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE }
        )
        public ResponseEntity<List<Cours>> getMyCourses(Principal principal) {
            if (principal == null) {
                return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
            }

            User user = userRepository.findByUsername(principal.getName()).orElse(null);

            // Security check: Only linked Formateurs can use this endpoint
            if (user == null || user.getFormateur() == null || !user.getRole().equals("FORMATEUR")) {
                 return new ResponseEntity<>(HttpStatus.FORBIDDEN);
            }
            
            Formateur formateur = user.getFormateur();
            
            // Use the new repository method: List<Cours> findByFormateur(Formateur formateur)
            List<Cours> courses = coursRepository.findByFormateur(formateur);

            return new ResponseEntity<>(courses, HttpStatus.OK);
        }
}
