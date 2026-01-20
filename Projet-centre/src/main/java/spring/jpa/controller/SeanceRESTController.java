package spring.jpa.controller;

import java.security.Principal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import spring.jpa.model.Cours;
import spring.jpa.model.Etudiant;
import spring.jpa.model.Formateur;
import spring.jpa.model.Groupe;
import spring.jpa.model.Inscription;
import spring.jpa.model.Seance;
import spring.jpa.model.User;
import spring.jpa.repository.CoursRepository;
import spring.jpa.repository.InscriptionRepository;
import spring.jpa.repository.SeanceRepository;
import spring.jpa.repository.UserRepository;
import spring.jpa.repository.GroupeRepository;

@RestController
@RequestMapping("/seances")
public class SeanceRESTController {

    @Autowired
    private SeanceRepository seanceRepository;

    @Autowired
    private CoursRepository coursRepository;

    @Autowired
    private InscriptionRepository inscriptionRepository;

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private GroupeRepository groupeRepository;

    @GetMapping("/")
    public List<Seance> getAll() {
        return seanceRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Seance> getById(@PathVariable Long id) {
        return seanceRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/etudiant/me")
    public ResponseEntity<List<Seance>> getMySchedule(Principal principal) {
        if (principal == null) return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);

        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null || user.getEtudiant() == null) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }

        Etudiant etudiant = user.getEtudiant();
        List<Seance> all = seanceRepository.findAll();
        List<Seance> mine = all.stream()
            .filter(s -> belongsToStudent(s, etudiant))
            .toList();
        return new ResponseEntity<>(mine, HttpStatus.OK);
    }

    @PostMapping("/")
    @Transactional
    public ResponseEntity<?> create(@RequestBody Seance seance, Principal principal) {
        if (!isAdmin(principal)) return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        return saveSeance(null, seance);
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Seance seance, Principal principal) {
        if (!isAdmin(principal)) return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        return saveSeance(id, seance);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, Principal principal) {
        if (!isAdmin(principal)) return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        if (seanceRepository.existsById(id)) {
            seanceRepository.deleteById(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    private ResponseEntity<?> saveSeance(Long id, Seance input) {
        if (input.getCours() == null || input.getCours().getCode() == null) {
            return new ResponseEntity<>("Cours introuvable.", HttpStatus.BAD_REQUEST);
        }
        Cours cours = coursRepository.findById(input.getCours().getCode()).orElse(null);
        if (cours == null) {
            return new ResponseEntity<>("Cours introuvable.", HttpStatus.NOT_FOUND);
        }
        if (input.getDateSeance() == null || input.getHeureDebut() == null || input.getHeureFin() == null) {
            return new ResponseEntity<>("Date et heures obligatoires.", HttpStatus.BAD_REQUEST);
        }
        if (!input.getHeureDebut().isBefore(input.getHeureFin())) {
            return new ResponseEntity<>("Heure debut doit etre avant heure fin.", HttpStatus.BAD_REQUEST);
        }

        Groupe groupe = null;
        if (input.getGroupe() != null && input.getGroupe().getId() != null) {
            groupe = groupeRepository.findById(input.getGroupe().getId()).orElse(null);
        }

        if (hasConflict(id, input.getDateSeance(), input.getHeureDebut(), input.getHeureFin(), cours, groupe)) {
            return new ResponseEntity<>("Conflit d'horaire detecte.", HttpStatus.CONFLICT);
        }

        Seance target = (id == null) ? new Seance() : seanceRepository.findById(id).orElse(null);
        if (id != null && target == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        target.setCours(cours);
        target.setDateSeance(input.getDateSeance());
        target.setHeureDebut(input.getHeureDebut());
        target.setHeureFin(input.getHeureFin());
        target.setSalle(input.getSalle());
        target.setGroupe(groupe);

        Seance saved = seanceRepository.save(target);
        return new ResponseEntity<>(saved, id == null ? HttpStatus.CREATED : HttpStatus.OK);
    }

    private boolean hasConflict(Long currentId, LocalDate date, LocalTime start, LocalTime end, Cours cours, Groupe groupe) {
        List<Seance> sameDay = seanceRepository.findByDateSeance(date);

        Formateur formateur = cours.getFormateur();
        for (Seance s : sameDay) {
            if (currentId != null && s.getId().equals(currentId)) continue;
            if (!overlaps(start, end, s.getHeureDebut(), s.getHeureFin())) continue;

            Cours sc = s.getCours();
            if (formateur != null && sc != null && sc.getFormateur() != null) {
                if (formateur.getId().equals(sc.getFormateur().getId())) {
                    return true;
                }
            }

            Set<Long> targetStudents = getStudentIdsFor(cours, groupe);
            Set<Long> otherStudents = getStudentIdsFor(sc, s.getGroupe());
            if (!targetStudents.isEmpty() && intersects(targetStudents, otherStudents)) {
                return true;
            }
        }
        return false;
    }

    private boolean overlaps(LocalTime aStart, LocalTime aEnd, LocalTime bStart, LocalTime bEnd) {
        return aStart.isBefore(bEnd) && aEnd.isAfter(bStart);
    }

    private Set<Long> getStudentIdsFor(Cours cours, Groupe groupe) {
        Set<Long> ids = new HashSet<>();
        if (groupe != null && groupe.getEtudiants() != null && !groupe.getEtudiants().isEmpty()) {
            for (Etudiant e : groupe.getEtudiants()) {
                ids.add(e.getId());
            }
            return ids;
        }
        List<Inscription> inscriptions = inscriptionRepository.findByCours(cours);
        for (Inscription insc : inscriptions) {
            if (insc.getEtudiant() != null) {
                ids.add(insc.getEtudiant().getId());
            }
        }
        return ids;
    }

    private boolean belongsToStudent(Seance s, Etudiant etudiant) {
        if (s.getGroupe() != null && s.getGroupe().getEtudiants() != null) {
            return s.getGroupe().getEtudiants().stream()
                .anyMatch(e -> e.getId().equals(etudiant.getId()));
        }
        if (s.getCours() == null) return false;
        return inscriptionRepository.findByCours(s.getCours()).stream()
            .anyMatch(i -> i.getEtudiant() != null && i.getEtudiant().getId().equals(etudiant.getId()));
    }

    private boolean intersects(Set<Long> a, Set<Long> b) {
        for (Long id : a) {
            if (b.contains(id)) return true;
        }
        return false;
    }

    private boolean isAdmin(Principal principal) {
        if (principal == null) return false;
        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null || user.getRole() == null) return false;
        String role = user.getRole().trim().toUpperCase();
        if (role.startsWith("ROLE_")) role = role.substring("ROLE_".length());
        return "ADMIN".equals(role);
    }
}
