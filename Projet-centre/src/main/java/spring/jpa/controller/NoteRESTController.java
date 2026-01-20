package spring.jpa.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import spring.jpa.model.Cours;
import spring.jpa.model.Etudiant;
import spring.jpa.model.Formateur; // NEW
import spring.jpa.model.Note;
import spring.jpa.model.User; // NEW
import spring.jpa.repository.CoursRepository;
import spring.jpa.repository.EtudiantRepository;
import spring.jpa.repository.InscriptionRepository;
import spring.jpa.repository.NoteRepository;
import spring.jpa.repository.UserRepository; // NEW

@RestController
@RequestMapping("/notes")
public class NoteRESTController {

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private EtudiantRepository etudiantRepository;

    @Autowired
    private CoursRepository coursRepository;
    
    @Autowired
    private InscriptionRepository inscriptionRepository;
    
    @Autowired
    private UserRepository userRepository; // NEW: To fetch the current user's entity

    /**
     * Creation/Update of a Note. Restricted to Formateur (or Admin).
     * SECURITY: Must verify the authenticated user is the course's Formateur.
     */
    @PostMapping(
        value = "/",
        consumes = { MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE },
        produces = { MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE }
    )
    public ResponseEntity<?> saveNote(@RequestBody Note n, Principal principal) {
        if (principal == null) return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);

        // 1. Get authenticated user and check role
        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null) return new ResponseEntity<>(HttpStatus.FORBIDDEN);

        // Allow ADMIN to bypass role checks
        boolean isAdmin = isAdmin(user);
        
        // 2. Load associated entities from the database
        Etudiant e = etudiantRepository
                .findById(n.getEtudiant().getId())
                .orElse(null);

        Cours c = coursRepository
                .findById(n.getCours().getCode())
                .orElse(null);

        if (e == null || c == null) {
            return new ResponseEntity<>("Étudiant ou Cours introuvable.", HttpStatus.NOT_FOUND);
        }

        // 3. SECURITY CHECK: Only the assigned Formateur (or Admin) can save notes
        if (!isAdmin) {
            Formateur formateurAuthentifie = user.getFormateur();
            if (formateurAuthentifie == null || c.getFormateur() == null || !c.getFormateur().getId().equals(formateurAuthentifie.getId())) {
                return new ResponseEntity<>("Accès refusé. Vous n'êtes pas le formateur de ce cours.", HttpStatus.FORBIDDEN);
            }
        }
        
        // 4. Save the Note
        n.setEtudiant(e);
        n.setCours(c);
        n.setValeur(0);

        return new ResponseEntity<>(noteRepository.save(n), HttpStatus.CREATED);
    }

    /**
     * Viewing Notes. Restricted by role:
     * - ETUDIANT: Sees only their own notes.
     * - FORMATEUR: Sees notes only for courses they teach.
     * - ADMIN: Sees all notes.
     */
    @GetMapping("/")
    public List<Note> getAll(Principal principal) {
        if (principal == null) return List.of(); 
        
        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null) return List.of();

        String role = normalizeRole(user);

        // 1. ADMIN sees everything
        if ("ADMIN".equals(role)) {
            return noteRepository.findAll();
        }

        // 2. ETUDIANT sees only their own notes
        if ("ETUDIANT".equals(role) && user.getEtudiant() != null) {
            // Uses the derived query method we added to NoteRepository
            return noteRepository.findByEtudiant(user.getEtudiant());
        }

        // 3. FORMATEUR sees notes only for the courses they teach
        if ("FORMATEUR".equals(role) && user.getFormateur() != null) {
            Formateur formateur = user.getFormateur();
            
            // This is a complex query: find all notes for courses taught by this formateur.
            // We need to fetch all courses first, then all notes for those courses.
            // Assuming CoursRepository has a method to find courses by formateur:
            // List<Cours> taughtCourses = coursRepository.findByFormateur(formateur);
            
            // Since we don't have that method, we will implement the logic:
            List<Cours> taughtCourses = coursRepository.findAll().stream()
                .filter(c -> c.getFormateur() != null && c.getFormateur().getId().equals(formateur.getId()))
                .toList();
            
            // Get notes for all taught courses
            return noteRepository.findAll().stream()
                .filter(note -> taughtCourses.contains(note.getCours()))
                .toList();
            
            // NOTE: For performance, this should be a single custom query in the NoteRepository 
            // like List<Note> findByCours_Formateur(Formateur formateur);
        }
        
        // All other cases (unlinked user, invalid role, etc.)
        return List.of();
    }
    
    @GetMapping("/by-course/{code}")
    public ResponseEntity<List<Note>> getByCourse(@PathVariable String code, Principal principal) {
        if (principal == null) return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);

        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null) return new ResponseEntity<>(HttpStatus.FORBIDDEN);

        Cours course = coursRepository.findById(code).orElse(null);
        if (course == null) return new ResponseEntity<>(HttpStatus.NOT_FOUND);

        if (isAdmin(user)) {
            ensureNotesForCourse(course);
            return new ResponseEntity<>(noteRepository.findByCours(course), HttpStatus.OK);
        }

        if (isFormateur(user) && user.getFormateur() != null) {
            Formateur formateur = user.getFormateur();
            if (course.getFormateur() == null || !course.getFormateur().getId().equals(formateur.getId())) {
                return new ResponseEntity<>(HttpStatus.FORBIDDEN);
            }
            ensureNotesForCourse(course);
            return new ResponseEntity<>(noteRepository.findByCours(course), HttpStatus.OK);
        }

        if (isEtudiant(user) && user.getEtudiant() != null) {
            List<Note> notes = noteRepository.findByCours(course).stream()
                .filter(n -> n.getEtudiant() != null && n.getEtudiant().getId().equals(user.getEtudiant().getId()))
                .toList();
            return new ResponseEntity<>(notes, HttpStatus.OK);
        }

        return new ResponseEntity<>(HttpStatus.FORBIDDEN);
    }
    
    private void ensureNotesForCourse(Cours course) {
        List<Etudiant> enrolled = inscriptionRepository.findByCours(course).stream()
            .map(insc -> insc.getEtudiant())
            .filter(e -> e != null)
            .toList();

        for (Etudiant etudiant : enrolled) {
            if (!noteRepository.existsByEtudiantAndCours(etudiant, course)) {
                Note note = new Note();
                note.setEtudiant(etudiant);
                note.setCours(course);
                note.setNoteExamen(0);
                note.setNoteDs(0);
                note.setNoteOral(0);
                note.setValeur(0);
                noteRepository.save(note);
            }
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Note> getNoteById(@PathVariable Long id, Principal principal) {
        if (principal == null) return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);

        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null) return new ResponseEntity<>(HttpStatus.FORBIDDEN);

        Note note = noteRepository.findById(id).orElse(null);
        if (note == null) return new ResponseEntity<>(HttpStatus.NOT_FOUND);

        if (!canAccessNote(user, note)) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }

        return new ResponseEntity<>(note, HttpStatus.OK);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateNote(@PathVariable Long id, @RequestBody Note noteDetails, Principal principal) {
        if (principal == null) return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);

        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null) return new ResponseEntity<>(HttpStatus.FORBIDDEN);

        Note existing = noteRepository.findById(id).orElse(null);
        if (existing == null) return new ResponseEntity<>(HttpStatus.NOT_FOUND);

        if (!canModifyNote(user, existing)) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }

        existing.setNoteExamen(noteDetails.getNoteExamen());
        existing.setNoteDs(noteDetails.getNoteDs());
        existing.setNoteOral(noteDetails.getNoteOral());
        existing.setValeur(0);

        if (isAdmin(user)) {
            if (noteDetails.getEtudiant() != null && noteDetails.getEtudiant().getId() != null) {
                Etudiant e = etudiantRepository.findById(noteDetails.getEtudiant().getId()).orElse(null);
                if (e == null) {
                    return new ResponseEntity<>("Etudiant introuvable.", HttpStatus.NOT_FOUND);
                }
                existing.setEtudiant(e);
            }

            if (noteDetails.getCours() != null && noteDetails.getCours().getCode() != null) {
                Cours c = coursRepository.findById(noteDetails.getCours().getCode()).orElse(null);
                if (c == null) {
                    return new ResponseEntity<>("Cours introuvable.", HttpStatus.NOT_FOUND);
                }
                existing.setCours(c);
            }
        }

        return new ResponseEntity<>(noteRepository.save(existing), HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNote(@PathVariable Long id, Principal principal) {
        if (principal == null) return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);

        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null) return new ResponseEntity<>(HttpStatus.FORBIDDEN);

        Note existing = noteRepository.findById(id).orElse(null);
        if (existing == null) return new ResponseEntity<>(HttpStatus.NOT_FOUND);

        if (!canModifyNote(user, existing)) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }

        noteRepository.delete(existing);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    private String normalizeRole(User user) {
        String role = user.getRole();
        if (role == null) return "";
        String trimmed = role.trim();
        String normalized = trimmed.startsWith("ROLE_") ? trimmed.substring("ROLE_".length()) : trimmed;
        return normalized.trim().toUpperCase();
    }

    private boolean isAdmin(User user) {
        return "ADMIN".equals(normalizeRole(user));
    }

    private boolean isFormateur(User user) {
        return "FORMATEUR".equals(normalizeRole(user));
    }

    private boolean isEtudiant(User user) {
        return "ETUDIANT".equals(normalizeRole(user));
    }

    private boolean canAccessNote(User user, Note note) {
        if (isAdmin(user)) return true;

        if (isFormateur(user) && user.getFormateur() != null) {
            Formateur formateur = user.getFormateur();
            return note.getCours() != null
                && note.getCours().getFormateur() != null
                && note.getCours().getFormateur().getId().equals(formateur.getId());
        }

        if (isEtudiant(user) && user.getEtudiant() != null) {
            return note.getEtudiant() != null
                && note.getEtudiant().getId().equals(user.getEtudiant().getId());
        }

        return false;
    }

    private boolean canModifyNote(User user, Note note) {
        if (isAdmin(user)) return true;

        if (isFormateur(user) && user.getFormateur() != null) {
            Formateur formateur = user.getFormateur();
            return note.getCours() != null
                && note.getCours().getFormateur() != null
                && note.getCours().getFormateur().getId().equals(formateur.getId());
        }

        return false;
    }
}
