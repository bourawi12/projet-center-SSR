package spring.jpa.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Entity
public class SessionPedagogique {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Size(min = 1, max = 20)
    private String semestre;

    @NotNull
    @Size(min = 4, max = 20)
    private String anneeScolaire;

    public SessionPedagogique() {
        super();
    }

    public SessionPedagogique(String semestre, String anneeScolaire) {
        this.semestre = semestre;
        this.anneeScolaire = anneeScolaire;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSemestre() { return semestre; }
    public void setSemestre(String semestre) { this.semestre = semestre; }

    public String getAnneeScolaire() { return anneeScolaire; }
    public void setAnneeScolaire(String anneeScolaire) { this.anneeScolaire = anneeScolaire; }
}
