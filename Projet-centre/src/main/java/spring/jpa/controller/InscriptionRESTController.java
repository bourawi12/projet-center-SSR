package spring.jpa.controller;

import java.security.Principal;
import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Value;

import spring.jpa.model.Cours;
import spring.jpa.model.Etudiant;
import spring.jpa.model.Formateur;
import spring.jpa.model.Inscription;
import spring.jpa.model.Note;
import spring.jpa.model.User;
import spring.jpa.repository.CoursRepository;
import spring.jpa.repository.EtudiantRepository;
import spring.jpa.repository.InscriptionRepository;
import spring.jpa.repository.NoteRepository;
import spring.jpa.repository.UserRepository; // NEW
import spring.jpa.service.MailService;

@RestController
@RequestMapping("/inscriptions")
public class InscriptionRESTController {

    @Autowired
    private InscriptionRepository inscriptionRepository;

    @Autowired
    private EtudiantRepository etudiantRepository;

    @Autowired
    private CoursRepository coursRepository;
    
    @Autowired
    private UserRepository userRepository; // NEW
    
    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private MailService mailService;

    @Value("${app.inscriptions.manual.enabled:false}")
    private boolean manualInscriptionsEnabled;

    /**
     * Modify inscrire to use the authenticated Etudiant's ID.
     * The Etudiant ID in the request body is ignored for security.
     */
    @PostMapping(
        value = "/",
        consumes = { MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE },
        produces = { MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE }
    )
    public ResponseEntity<?> inscrire(@RequestBody Inscription insc, Principal principal) { // ADD Principal

        if (!manualInscriptionsEnabled) {
            return new ResponseEntity<>("Inscriptions are managed via groupes.", HttpStatus.FORBIDDEN);
        }

        if (principal == null) return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);

        // 1. Get the authenticated User
        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }

        // 2. Load the Course (still needs to be loaded from body's code)
        if (insc.getCours() == null || insc.getCours().getCode() == null) {
            return new ResponseEntity<>("Cours introuvable.", HttpStatus.NOT_FOUND);
        }
        Cours c = coursRepository
                .findById(insc.getCours().getCode())
                .orElse(null);

        if (c == null) {
            return new ResponseEntity<>("Cours introuvable.", HttpStatus.NOT_FOUND);
        }

        String role = normalizeRole(user.getRole());
        boolean isAdmin = "ADMIN".equals(role) || hasRole("ADMIN");
        boolean isEtudiant = "ETUDIANT".equals(role) || hasRole("ETUDIANT");
        Etudiant etudiant;
        if (isAdmin) {
            if (insc.getEtudiant() == null || insc.getEtudiant().getId() == null) {
                return new ResponseEntity<>("Etudiant introuvable.", HttpStatus.NOT_FOUND);
            }
            etudiant = etudiantRepository.findById(insc.getEtudiant().getId()).orElse(null);
            if (etudiant == null) {
                return new ResponseEntity<>("Etudiant introuvable.", HttpStatus.NOT_FOUND);
            }
        } else if (isEtudiant && user.getEtudiant() != null) {
            etudiant = user.getEtudiant();
        } else {
            return new ResponseEntity<>("Seuls les etudiants ou l'admin peuvent inscrire.", HttpStatus.FORBIDDEN);
        }

        // 3. Check for double inscription
        if (inscriptionRepository.existsByEtudiantAndCours(etudiant, c)) {
            return new ResponseEntity<>("Etudiant deja inscrit a ce cours.", HttpStatus.CONFLICT);
        }

        // 4. Set Etudiant and Course
        insc.setEtudiant(etudiant);
        insc.setCours(c);
        if (insc.getDateInscription() == null) {
            insc.setDateInscription(new Date());
        }

        Inscription saved = inscriptionRepository.save(insc);

        if (!noteRepository.existsByEtudiantAndCours(etudiant, c)) {
            Note note = new Note();
            note.setEtudiant(etudiant);
            note.setCours(c);
            note.setNoteExamen(0);
            note.setNoteDs(0);
            note.setNoteOral(0);
            noteRepository.save(note);
        }

        mailService.sendEnrollmentStudent(etudiant, c);
        mailService.sendEnrollmentFormateur(c.getFormateur(), etudiant, c);

        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }


    /**
     * Modify getAll to return either ALL inscriptions (for ADMIN) or
     * only the logged-in Etudiant's inscriptions.
     */
    @GetMapping("/")
    public List<Inscription> getAll(Principal principal) {
        if (principal == null) return List.of(); // Should be caught by SecurityConfig

        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null) return List.of();

        // If the user is an Etudiant, return only their inscriptions
        if ("ETUDIANT".equals(normalizeRole(user.getRole())) || hasRole("ETUDIANT")) {
            if (user.getEtudiant() != null) {
                // Assuming InscriptionRepository has findByEtudiant() method
                // You will need to add this method to your InscriptionRepository interface.
                // e.g., List<Inscription> findByEtudiant(Etudiant etudiant);
                // return inscriptionRepository.findByEtudiant(user.getEtudiant());
                // Placeholder for now:
                return inscriptionRepository.findAll().stream()
                        .filter(insc -> insc.getEtudiant().getId().equals(user.getEtudiant().getId()))
                        .toList(); 
            }
            return List.of();
        }

        // If the user is an ADMIN (or FORMATEUR if they have access to this endpoint), return all.
        return inscriptionRepository.findAll();
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancelInscription(@PathVariable Long id, Principal principal) {
        if (!manualInscriptionsEnabled) {
            return new ResponseEntity<>("Inscriptions are managed via groupes.", HttpStatus.FORBIDDEN);
        }

        if (principal == null) return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);

        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null) return new ResponseEntity<>(HttpStatus.FORBIDDEN);

        Inscription inscription = inscriptionRepository.findById(id).orElse(null);
        if (inscription == null) return new ResponseEntity<>(HttpStatus.NOT_FOUND);

        String role = normalizeRole(user.getRole());
        boolean isAdmin = "ADMIN".equals(role) || hasRole("ADMIN");
        boolean isEtudiant = "ETUDIANT".equals(role) || hasRole("ETUDIANT");
        if (isAdmin) {
            if (inscription.getEtudiant() != null && inscription.getCours() != null) {
                noteRepository.deleteByEtudiantAndCours(inscription.getEtudiant(), inscription.getCours());
                mailService.sendUnenrollFormateur(
                    inscription.getCours().getFormateur(),
                    inscription.getEtudiant(),
                    inscription.getCours()
                );
            }
            inscriptionRepository.delete(inscription);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }

        if (isEtudiant && user.getEtudiant() != null) {
            Long etudiantId = user.getEtudiant().getId();
            if (inscription.getEtudiant() != null && inscription.getEtudiant().getId().equals(etudiantId)) {
                if (inscription.getCours() != null) {
                    noteRepository.deleteByEtudiantAndCours(inscription.getEtudiant(), inscription.getCours());
                    mailService.sendUnenrollFormateur(
                        inscription.getCours().getFormateur(),
                        inscription.getEtudiant(),
                        inscription.getCours()
                    );
                }
                inscriptionRepository.delete(inscription);
                return new ResponseEntity<>(HttpStatus.NO_CONTENT);
            }
        }

        return new ResponseEntity<>(HttpStatus.FORBIDDEN);
    }
    
    @GetMapping(
            value = "/by-course/{code}",
            produces = { MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE }
        )
        public ResponseEntity<List<Inscription>> getStudentsByCourse(@PathVariable String code, Principal principal) {
            if (principal == null) return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);

            User user = userRepository.findByUsername(principal.getName()).orElse(null);
            if (user == null) return new ResponseEntity<>(HttpStatus.FORBIDDEN);

            String role = normalizeRole(user.getRole());
            boolean isAdmin = "ADMIN".equals(role) || hasRole("ADMIN");
            boolean isFormateur = "FORMATEUR".equals(role) || hasRole("FORMATEUR");
            
            // 1. Load the Course entity
            Cours course = coursRepository.findById(code).orElse(null);
            
            if (course == null) {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }

            // 2. Authorization Check
            if (isFormateur) {
                Formateur formateurAuthentifie = user.getFormateur();
                
                // Check if the authenticated Formateur is the one assigned to this course
                if (formateurAuthentifie == null || course.getFormateur() == null || !course.getFormateur().getId().equals(formateurAuthentifie.getId())) {
                    return new ResponseEntity<>(HttpStatus.FORBIDDEN); // Formateur is not authorized for this course
                }
            } 
            // Allow ADMIN role to bypass this check (as defined in SecurityConfig, which grants ADMIN full access)
            else if (!isAdmin) {
                // Block all other roles (ETUDIANT, or unlinked users)
                return new ResponseEntity<>(HttpStatus.FORBIDDEN);
            }
            
            // 3. Fetch Inscriptions for the Course
            // This assumes you have implemented 'List<Inscription> findByCours(Cours cours);' 
            // in your InscriptionRepository (which is a standard derived query).
            List<Inscription> inscriptions = inscriptionRepository.findByCours(course);

            // 4. Return the list of inscriptions (which includes the Etudiant data)
            return new ResponseEntity<>(inscriptions, HttpStatus.OK);
    }

    private String normalizeRole(String role) {
        if (role == null) return "";
        String normalized = role.startsWith("ROLE_") ? role.substring("ROLE_".length()) : role;
        return normalized.toUpperCase();
    }

    private boolean hasRole(String role) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getAuthorities() == null) return false;
        String target = "ROLE_" + role.toUpperCase();
        return auth.getAuthorities().stream().anyMatch(a ->
            target.equalsIgnoreCase(a.getAuthority()) || role.equalsIgnoreCase(a.getAuthority())
        );
    }
}
