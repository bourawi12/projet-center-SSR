package spring.jpa.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import spring.jpa.model.Seance;

public interface SeanceRepository extends JpaRepository<Seance, Long> {
    List<Seance> findByDateSeance(LocalDate dateSeance);
}
