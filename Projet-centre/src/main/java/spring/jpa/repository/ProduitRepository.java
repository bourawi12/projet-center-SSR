package spring.jpa.repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import spring.jpa.model.Produit;
public interface ProduitRepository extends JpaRepository<Produit, Long> {
	Page<Produit> findByDesignationLikeAndActif(String mc, boolean actif, Pageable pageable);

// Retourner la page des Produits selon une recherche par designation
// Page<Produit> findByDesignationLike(String mc, Pageable pageable);

 Page<Produit> findByDesignationLike(String mc, PageRequest of);
}