package spring.jpa.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import spring.jpa.model.Formateur;

public interface FormateurRepository extends JpaRepository<Formateur, Long> {

    Page<Formateur> findByNomLike(String mc, Pageable pageable);

    Page<Formateur> findBySpecialiteLike(String mc, Pageable pageable);
}
