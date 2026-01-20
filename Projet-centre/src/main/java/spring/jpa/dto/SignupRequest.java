package spring.jpa.dto;

public class SignupRequest {

    // Common User Details
    // private String username; // Removed
    private String password;
    private String role; // ETUDIANT | FORMATEUR | ADMIN
    
    // Personal Details (common to Etudiant and Formateur)
    private String nom;
    private String prenom;
    private String email; // Will be used as the Spring Security username

    // Etudiant Specific
    // private String matricule; // Removed from DTO as it's auto-generated
    
    // Formateur Specific
    private String specialite;

    public SignupRequest() {} 
    
    // --- Getters and Setters ---
    
    // public String getUsername() { return username; } // Removed
    // public void setUsername(String username) { this.username = username; } // Removed

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }

    public String getEmail() { return email; } // THIS IS NOW THE USERNAME
    public void setEmail(String email) { this.email = email; }

    // public String getMatricule() { return matricule; } // Removed
    // public void setMatricule(String matricule) { this.matricule = matricule; } // Removed

    public String getSpecialite() { return specialite; }
    public void setSpecialite(String specialite) { this.specialite = specialite; }
}