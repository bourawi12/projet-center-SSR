package spring.jpa.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import jakarta.transaction.Transactional;
import spring.jpa.model.Cours;
import spring.jpa.model.Etudiant;
import spring.jpa.model.Inscription;

import java.util.List;

public interface InscriptionRepository extends JpaRepository<Inscription, Long> {

    // Vérifier si un étudiant est déjà inscrit à un cours
    boolean existsByEtudiantAndCours(Etudiant etudiant, Cours cours);
    
    // Retrieve all inscriptions for a specific Etudiant (used by ETUDIANT role)
    List<Inscription> findByEtudiant(Etudiant etudiant);
    
    // NEW: Retrieve all inscriptions for a specific Cours (used by FORMATEUR role)
    List<Inscription> findByCours(Cours cours);
    
    @Transactional
    void deleteAllByEtudiantId(Long etudiantId);
}