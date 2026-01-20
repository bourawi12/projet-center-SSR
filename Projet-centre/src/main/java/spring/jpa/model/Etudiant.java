package spring.jpa.model;

import java.util.Date;
import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.format.annotation.DateTimeFormat;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
public class Etudiant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Now auto-generated

    @NotNull
    @Size(min = 3, max = 20)
    private String matricule;

    @NotNull
    @Size(min = 2, max = 50)
    private String nom;

    @NotNull
    @Size(min = 2, max = 50)
    private String prenom;

    @NotNull
    private String email;

 // NEW: One-to-one link to the User account (owning side)
    @OneToOne
    @JoinColumn(name = "user_id") // This creates the foreign key column in the Etudiant table
    @JsonIgnore
    private User user;
    
    @Temporal(TemporalType.DATE)
    @DateTimeFormat(pattern = "yyyy-MM-dd")
    private Date dateInscription;

    private boolean actif;

    @JsonIgnore
    @ManyToMany(mappedBy = "etudiants")
    private Set<Groupe> groupes = new HashSet<>();

    @ManyToOne
    private Specialite specialite;

    public Etudiant() {
        super();
    }

    public Etudiant(String matricule, String nom, String prenom, String email, Date dateInscription) {
        super();
        this.matricule = matricule;
        this.nom = nom;
        this.prenom = prenom;
        this.email = email;
        this.dateInscription = dateInscription;
    }

    // getters & setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getMatricule() { return matricule; }
    public void setMatricule(String matricule) { this.matricule = matricule; }

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public Date getDateInscription() { return dateInscription; }
    public void setDateInscription(Date dateInscription) { this.dateInscription = dateInscription; }

    public boolean isActif() { return actif; }
    public void setActif(boolean actif) { this.actif = actif; }
 // NEW: Getter/Setter for User
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Set<Groupe> getGroupes() { return groupes; }
    public void setGroupes(Set<Groupe> groupes) { this.groupes = groupes; }

    public Specialite getSpecialite() { return specialite; }
    public void setSpecialite(Specialite specialite) { this.specialite = specialite; }
}
