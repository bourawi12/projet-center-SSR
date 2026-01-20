package spring.jpa.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import spring.jpa.model.SessionPedagogique;
import spring.jpa.repository.SessionPedagogiqueRepository;

@RestController
@RequestMapping("/sessions")
public class SessionPedagogiqueRESTController {

    @Autowired
    private SessionPedagogiqueRepository sessionRepository;

    @GetMapping("/")
    public List<SessionPedagogique> getAll() {
        return sessionRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<SessionPedagogique> getById(@PathVariable Long id) {
        return sessionRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/")
    public ResponseEntity<SessionPedagogique> create(@RequestBody SessionPedagogique session) {
        SessionPedagogique saved = sessionRepository.save(session);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SessionPedagogique> update(@PathVariable Long id, @RequestBody SessionPedagogique sessionDetails) {
        return sessionRepository.findById(id)
            .map(existing -> {
                existing.setSemestre(sessionDetails.getSemestre());
                existing.setAnneeScolaire(sessionDetails.getAnneeScolaire());
                return new ResponseEntity<>(sessionRepository.save(existing), HttpStatus.OK);
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (sessionRepository.existsById(id)) {
            sessionRepository.deleteById(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }
}
