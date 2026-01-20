package spring.jpa.model;

import java.util.HashSet;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Entity
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Groupe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Size(min = 2, max = 50)
    private String nom;

    @ManyToOne
    private SessionPedagogique session;

    @ManyToOne
    private Specialite specialite;

    @ManyToMany
    @JoinTable(
        name = "groupe_cours",
        joinColumns = @JoinColumn(name = "groupe_id"),
        inverseJoinColumns = @JoinColumn(name = "cours_code")
    )
    private Set<Cours> cours = new HashSet<>();

    @ManyToMany
    @JoinTable(
        name = "groupe_etudiant",
        joinColumns = @JoinColumn(name = "groupe_id"),
        inverseJoinColumns = @JoinColumn(name = "etudiant_id")
    )
    private Set<Etudiant> etudiants = new HashSet<>();

    public Groupe() {
        super();
    }

    public Groupe(String nom) {
        this.nom = nom;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public SessionPedagogique getSession() { return session; }
    public void setSession(SessionPedagogique session) { this.session = session; }

    public Specialite getSpecialite() { return specialite; }
    public void setSpecialite(Specialite specialite) { this.specialite = specialite; }

    public Set<Cours> getCours() { return cours; }
    public void setCours(Set<Cours> cours) { this.cours = cours; }

    public Set<Etudiant> getEtudiants() { return etudiants; }
    public void setEtudiants(Set<Etudiant> etudiants) { this.etudiants = etudiants; }
}
