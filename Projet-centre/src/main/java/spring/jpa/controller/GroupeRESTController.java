package spring.jpa.controller;

import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import spring.jpa.dto.GroupeRequest;
import spring.jpa.model.Cours;
import spring.jpa.model.Etudiant;
import spring.jpa.model.Groupe;
import spring.jpa.model.Inscription;
import spring.jpa.model.Note;
import spring.jpa.model.SessionPedagogique;
import spring.jpa.model.Specialite;
import spring.jpa.repository.CoursRepository;
import spring.jpa.repository.EtudiantRepository;
import spring.jpa.repository.GroupeRepository;
import spring.jpa.repository.InscriptionRepository;
import spring.jpa.repository.NoteRepository;
import spring.jpa.repository.SessionPedagogiqueRepository;
import spring.jpa.repository.SpecialiteRepository;
import spring.jpa.service.MailService;

@RestController
@RequestMapping("/groupes")
public class GroupeRESTController {

    @Autowired
    private GroupeRepository groupeRepository;
    
    @Autowired
    private SessionPedagogiqueRepository sessionRepository;
    
    @Autowired
    private SpecialiteRepository specialiteRepository;
    
    @Autowired
    private CoursRepository coursRepository;
    
    @Autowired
    private EtudiantRepository etudiantRepository;
    
    @Autowired
    private InscriptionRepository inscriptionRepository;
    
    @Autowired
    private NoteRepository noteRepository;
    
    @Autowired
    private MailService mailService;

    @GetMapping("/")
    public List<Groupe> getAll() {
        return groupeRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Groupe> getById(@PathVariable Long id) {
        return groupeRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/")
    public ResponseEntity<?> create(@RequestBody GroupeRequest request) {
        Groupe g = new Groupe();
        g.setNom(request.getNom());
        applyLinks(g, request);
        applyStudents(g, request);
        Groupe saved = groupeRepository.save(g);
        syncInscriptionsForStudents(saved.getEtudiants());
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody GroupeRequest request) {
        return groupeRepository.findById(id)
            .map(existing -> {
                Set<Etudiant> oldStudents = new HashSet<>(existing.getEtudiants());
                existing.setNom(request.getNom());
                applyLinks(existing, request);
                applyStudents(existing, request);
                Groupe saved = groupeRepository.save(existing);
                Set<Etudiant> affected = new HashSet<>(oldStudents);
                affected.addAll(saved.getEtudiants());
                syncInscriptionsForStudents(affected);
                return new ResponseEntity<>(saved, HttpStatus.OK);
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Groupe group = groupeRepository.findById(id).orElse(null);
        if (group != null) {
            Set<Etudiant> affected = new HashSet<>(group.getEtudiants());
            groupeRepository.delete(group);
            syncInscriptionsForStudents(affected);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    private void applyLinks(Groupe g, GroupeRequest request) {
        if (request.getSessionId() != null) {
            SessionPedagogique s = sessionRepository.findById(request.getSessionId()).orElse(null);
            g.setSession(s);
        } else {
            g.setSession(null);
        }

        if (request.getSpecialiteId() != null) {
            Specialite sp = specialiteRepository.findById(request.getSpecialiteId()).orElse(null);
            g.setSpecialite(sp);
        } else {
            g.setSpecialite(null);
        }

        Set<Cours> cours = new HashSet<>();
        if (request.getCoursCodes() != null) {
            for (String code : request.getCoursCodes()) {
                if (code == null || code.isBlank()) continue;
                Cours c = coursRepository.findById(code).orElse(null);
                if (c != null) {
                    cours.add(c);
                }
            }
        }
        g.setCours(cours);
    }

    private void applyStudents(Groupe g, GroupeRequest request) {
        if (request.getEtudiantIds() == null) {
            return;
        }
        List<Etudiant> selected = etudiantRepository.findAllById(request.getEtudiantIds());
        g.setEtudiants(new HashSet<>(selected));
    }

    private void syncInscriptionsForStudents(Set<Etudiant> students) {
        if (students == null || students.isEmpty()) return;

        List<Groupe> allGroups = groupeRepository.findAll();
        Map<Long, Set<Cours>> allowedByStudent = new HashMap<>();
        for (Groupe g : allGroups) {
            for (Etudiant e : g.getEtudiants()) {
                if (e == null || e.getId() == null) continue;
                allowedByStudent
                    .computeIfAbsent(e.getId(), k -> new HashSet<>())
                    .addAll(g.getCours());
            }
        }

        for (Etudiant student : students) {
            if (student == null || student.getId() == null) continue;
            Set<Cours> allowedCourses = allowedByStudent.getOrDefault(student.getId(), Set.of());
            Set<String> allowedCodes = new HashSet<>();
            for (Cours c : allowedCourses) {
                if (c != null && c.getCode() != null) {
                    allowedCodes.add(c.getCode());
                }
            }

            for (Cours c : allowedCourses) {
                if (c == null) continue;
                if (!inscriptionRepository.existsByEtudiantAndCours(student, c)) {
                    Inscription ins = new Inscription();
                    ins.setEtudiant(student);
                    ins.setCours(c);
                    ins.setDateInscription(new Date());
                    inscriptionRepository.save(ins);

                    if (!noteRepository.existsByEtudiantAndCours(student, c)) {
                        Note note = new Note();
                        note.setEtudiant(student);
                        note.setCours(c);
                        note.setNoteExamen(0);
                        note.setNoteDs(0);
                        note.setNoteOral(0);
                        note.setValeur(0);
                        noteRepository.save(note);
                    }

                    mailService.sendEnrollmentStudent(student, c);
                    mailService.sendEnrollmentFormateur(c.getFormateur(), student, c);
                }
            }

            for (Inscription existing : inscriptionRepository.findByEtudiant(student)) {
                if (existing.getCours() == null || existing.getCours().getCode() == null) continue;
                if (!allowedCodes.contains(existing.getCours().getCode())) {
                    noteRepository.deleteByEtudiantAndCours(student, existing.getCours());
                    mailService.sendUnenrollFormateur(
                        existing.getCours().getFormateur(),
                        student,
                        existing.getCours()
                    );
                    inscriptionRepository.delete(existing);
                }
            }
        }
    }
}
