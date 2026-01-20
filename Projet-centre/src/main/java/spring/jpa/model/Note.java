package spring.jpa.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;

@Entity
public class Note {

    @Id
    @GeneratedValue
    private Long id;

    // Legacy column kept to satisfy existing DB schema (non-null).
    @Column(name = "valeur")
    private double valeur;

    @DecimalMin("0.0")
    private double noteExamen;

    @DecimalMin("0.0")
    private double noteDs;

    @DecimalMin("0.0")
    private double noteOral;

    @ManyToOne
    private Etudiant etudiant;

    @ManyToOne
    private Cours cours;

    public Note() {
        super();
    }

    public Note(double noteExamen, double noteDs, double noteOral, Etudiant etudiant, Cours cours) {
        super();
        this.valeur = 0;
        this.noteExamen = noteExamen;
        this.noteDs = noteDs;
        this.noteOral = noteOral;
        this.etudiant = etudiant;
        this.cours = cours;
    }

    // getters & setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public double getValeur() { return valeur; }
    public void setValeur(double valeur) { this.valeur = valeur; }

    public double getNoteExamen() { return noteExamen; }
    public void setNoteExamen(double noteExamen) { this.noteExamen = noteExamen; }

    public double getNoteDs() { return noteDs; }
    public void setNoteDs(double noteDs) { this.noteDs = noteDs; }

    public double getNoteOral() { return noteOral; }
    public void setNoteOral(double noteOral) { this.noteOral = noteOral; }

    public Etudiant getEtudiant() { return etudiant; }
    public void setEtudiant(Etudiant etudiant) { this.etudiant = etudiant; }

    public Cours getCours() { return cours; }
    public void setCours(Cours cours) { this.cours = cours; }
}
