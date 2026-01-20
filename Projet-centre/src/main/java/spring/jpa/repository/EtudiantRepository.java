package spring.jpa.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import spring.jpa.model.Etudiant;

public interface EtudiantRepository extends JpaRepository<Etudiant, Long> {

    // Recherche par nom + actif avec pagination
    Page<Etudiant> findByNomLikeAndActif(String mc, boolean actif, Pageable pageable);

    // Recherche par nom seulement
    Page<Etudiant> findByNomLike(String mc, Pageable pageable);
}
