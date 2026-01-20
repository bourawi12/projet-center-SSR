package spring.jpa.model;

import java.util.Date;

import jakarta.persistence.*;
import org.springframework.format.annotation.DateTimeFormat;

@Entity
public class Inscription {

    @Id
    @GeneratedValue
    private Long id;

    @Temporal(TemporalType.DATE)
    @DateTimeFormat(pattern = "yyyy-MM-dd")
    private Date dateInscription;

    @ManyToOne
    private Etudiant etudiant;

    @ManyToOne
    private Cours cours;

    public Inscription() {
        super();
    }

    public Inscription(Date dateInscription, Etudiant etudiant, Cours cours) {
        super();
        this.dateInscription = dateInscription;
        this.etudiant = etudiant;
        this.cours = cours;
    }

    // getters & setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Date getDateInscription() { return dateInscription; }
    public void setDateInscription(Date dateInscription) { this.dateInscription = dateInscription; }

    public Etudiant getEtudiant() { return etudiant; }
    public void setEtudiant(Etudiant etudiant) { this.etudiant = etudiant; }

    public Cours getCours() { return cours; }
    public void setCours(Cours cours) { this.cours = cours; }
}
