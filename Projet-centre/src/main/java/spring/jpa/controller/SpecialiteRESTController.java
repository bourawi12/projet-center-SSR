package spring.jpa.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import spring.jpa.model.Specialite;
import spring.jpa.repository.SpecialiteRepository;

@RestController
@RequestMapping("/specialites")
public class SpecialiteRESTController {

    @Autowired
    private SpecialiteRepository specialiteRepository;

    @GetMapping("/")
    public List<Specialite> getAll() {
        return specialiteRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Specialite> getById(@PathVariable Long id) {
        return specialiteRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/")
    public ResponseEntity<Specialite> create(@RequestBody Specialite specialite) {
        Specialite saved = specialiteRepository.save(specialite);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Specialite> update(@PathVariable Long id, @RequestBody Specialite specialiteDetails) {
        return specialiteRepository.findById(id)
            .map(existing -> {
                existing.setNom(specialiteDetails.getNom());
                existing.setDescription(specialiteDetails.getDescription());
                return new ResponseEntity<>(specialiteRepository.save(existing), HttpStatus.OK);
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (specialiteRepository.existsById(id)) {
            specialiteRepository.deleteById(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }
}
