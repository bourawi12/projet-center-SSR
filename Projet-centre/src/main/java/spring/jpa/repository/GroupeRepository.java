package spring.jpa.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import spring.jpa.model.Groupe;

public interface GroupeRepository extends JpaRepository<Groupe, Long> {
}
