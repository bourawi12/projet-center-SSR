package spring.jpa.model;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Entity
public class Formateur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Size(min = 2, max = 50)
    private String nom;
    
    // NEW FIELD: prenom
    @NotNull
    @Size(min = 2, max = 50)
    private String prenom; 

    @NotNull
    private String specialite;

    @NotNull
    private String email;
    
    // One-to-one link to the User account (owning side)
    @OneToOne(cascade = CascadeType.REMOVE) // When Formateur is deleted, User is also deleted
    @JoinColumn(name = "user_id")
    private User user;
    
    public Formateur() {
        super();
    }

    // Updated Constructor
    public Formateur(String nom, String prenom, String specialite, String email) {
        super();
        this.nom = nom;
        this.prenom = prenom;
        this.specialite = specialite;
        this.email = email;
    }

    // getters & setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    
    // NEW GETTER & SETTER for prenom
    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }

    public String getSpecialite() { return specialite; }
    public void setSpecialite(String specialite) { this.specialite = specialite; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}