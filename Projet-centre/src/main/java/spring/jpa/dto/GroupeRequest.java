package spring.jpa.dto;

import java.util.List;

public class GroupeRequest {
    private String nom;
    private Long sessionId;
    private Long specialiteId;
    private List<String> coursCodes;
    private List<Long> etudiantIds;

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long sessionId) { this.sessionId = sessionId; }

    public Long getSpecialiteId() { return specialiteId; }
    public void setSpecialiteId(Long specialiteId) { this.specialiteId = specialiteId; }

    public List<String> getCoursCodes() { return coursCodes; }
    public void setCoursCodes(List<String> coursCodes) { this.coursCodes = coursCodes; }

    public List<Long> getEtudiantIds() { return etudiantIds; }
    public void setEtudiantIds(List<Long> etudiantIds) { this.etudiantIds = etudiantIds; }
}
