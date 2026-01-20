package spring.jpa.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import spring.jpa.model.Cours;
import spring.jpa.model.Formateur; // NEW: Import the Formateur entity

import java.util.List; // NEW: To return a list of courses

public interface CoursRepository extends JpaRepository<Cours, String> {

    Page<Cours> findByTitreLike(String mc, Pageable pageable);

    Page<Cours> findByActif(boolean actif, Pageable pageable);
    
    // NEW: Retrieve all courses taught by a specific Formateur
    List<Cours> findByFormateur(Formateur formateur);
}