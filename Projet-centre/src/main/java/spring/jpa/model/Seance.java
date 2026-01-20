package spring.jpa.model;

import java.time.LocalDate;
import java.time.LocalTime;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

@Entity
public class Seance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    private LocalDate dateSeance;

    @NotNull
    @JsonFormat(pattern = "HH:mm")
    @Column(columnDefinition = "TIME")
    private LocalTime heureDebut;

    @NotNull
    @JsonFormat(pattern = "HH:mm")
    @Column(columnDefinition = "TIME")
    private LocalTime heureFin;

    @NotNull
    private String salle;

    @ManyToOne
    private Cours cours;

    @ManyToOne
    private Groupe groupe;

    public Seance() {
        super();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDate getDateSeance() { return dateSeance; }
    public void setDateSeance(LocalDate dateSeance) { this.dateSeance = dateSeance; }

    public LocalTime getHeureDebut() { return heureDebut; }
    public void setHeureDebut(LocalTime heureDebut) { this.heureDebut = heureDebut; }

    public LocalTime getHeureFin() { return heureFin; }
    public void setHeureFin(LocalTime heureFin) { this.heureFin = heureFin; }

    public String getSalle() { return salle; }
    public void setSalle(String salle) { this.salle = salle; }

    public Cours getCours() { return cours; }
    public void setCours(Cours cours) { this.cours = cours; }

    public Groupe getGroupe() { return groupe; }
    public void setGroupe(Groupe groupe) { this.groupe = groupe; }
}
