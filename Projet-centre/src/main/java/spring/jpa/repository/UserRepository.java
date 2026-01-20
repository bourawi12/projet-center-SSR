package spring.jpa.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import spring.jpa.model.User;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
}
