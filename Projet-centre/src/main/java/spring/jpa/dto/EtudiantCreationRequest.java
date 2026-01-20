package spring.jpa.dto;

// This DTO contains all data needed to create a User (login) and Etudiant entity
public class EtudiantCreationRequest {

    private String email;      // Becomes User.username
    private String password;   // Becomes User.password (hashed)
    private String nom;
    private String prenom;

    public EtudiantCreationRequest() {}

    // --- Getters and Setters ---
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }
}