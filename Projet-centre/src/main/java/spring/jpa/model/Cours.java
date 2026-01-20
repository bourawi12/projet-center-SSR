package spring.jpa.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Entity
public class Cours {

    @Id
    @Column(length = 10)
    private String code;

    @NotNull
    @Size(min = 3, max = 100)
    private String titre;

    private String description;

    @ManyToOne
    private Formateur formateur;

    private boolean actif;

    public Cours() {
        super();
    }

    public Cours(String code, String titre, String description, Formateur formateur) {
        super();
        this.code = code;
        this.titre = titre;
        this.description = description;
        this.formateur = formateur;
    }

    // getters & setters
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getTitre() { return titre; }
    public void setTitre(String titre) { this.titre = titre; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Formateur getFormateur() { return formateur; }
    public void setFormateur(Formateur formateur) { this.formateur = formateur; }

    public boolean isActif() { return actif; }
    public void setActif(boolean actif) { this.actif = actif; }
}
