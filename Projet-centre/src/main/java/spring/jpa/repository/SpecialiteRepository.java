package spring.jpa.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import spring.jpa.model.Specialite;

public interface SpecialiteRepository extends JpaRepository<Specialite, Long> {
}
