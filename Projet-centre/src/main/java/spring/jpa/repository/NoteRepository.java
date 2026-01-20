package spring.jpa.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import jakarta.transaction.Transactional;
import spring.jpa.model.Cours;
import spring.jpa.model.Etudiant;
import spring.jpa.model.Note;

public interface NoteRepository extends JpaRepository<Note, Long> {

    List<Note> findByEtudiant(Etudiant etudiant);

    List<Note> findByCours(Cours cours);

    boolean existsByEtudiantAndCours(Etudiant etudiant, Cours cours);

    @Transactional
    void deleteByEtudiantAndCours(Etudiant etudiant, Cours cours);
    @Transactional
    void deleteAllByEtudiantId(Long etudiantId);
}
