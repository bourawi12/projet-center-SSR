package spring.jpa.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import spring.jpa.model.Cours;
import spring.jpa.model.Etudiant;
import spring.jpa.model.Formateur;

@Service
public class MailService {

    private static final Logger logger = LoggerFactory.getLogger(MailService.class);

    private final JavaMailSender mailSender;
    private final String from;

    public MailService(
            JavaMailSender mailSender,
            @Value("${app.mail.from:${spring.mail.username:}}") String from) {
        this.mailSender = mailSender;
        this.from = from == null ? "" : from.trim();
    }

    public void sendEnrollmentStudent(Etudiant etudiant, Cours cours) {
        if (etudiant == null || cours == null) return;
        String to = safeEmail(etudiant.getEmail());
        if (to.isBlank() || from.isBlank()) return;
        String subject = "Inscription au cours";
        String body = "Bonjour " + safeName(etudiant.getNom(), etudiant.getPrenom())
            + ",\nVous etes inscrit(e) au cours " + cours.getCode()
            + " - " + cours.getTitre() + ".";
        send(to, subject, body);
    }

    public void sendEnrollmentFormateur(Formateur formateur, Etudiant etudiant, Cours cours) {
        if (formateur == null || etudiant == null || cours == null) return;
        String to = safeEmail(formateur.getEmail());
        if (to.isBlank() || from.isBlank()) return;
        String subject = "Nouvelle inscription";
        String body = "Bonjour " + safeName(formateur.getNom(), formateur.getPrenom())
            + ",\nL'etudiant " + safeName(etudiant.getNom(), etudiant.getPrenom())
            + " s'est inscrit(e) au cours " + cours.getCode()
            + " - " + cours.getTitre() + ".";
        send(to, subject, body);
    }

    public void sendUnenrollFormateur(Formateur formateur, Etudiant etudiant, Cours cours) {
        if (formateur == null || etudiant == null || cours == null) return;
        String to = safeEmail(formateur.getEmail());
        if (to.isBlank() || from.isBlank()) return;
        String subject = "Desinscription";
        String body = "Bonjour " + safeName(formateur.getNom(), formateur.getPrenom())
            + ",\nL'etudiant " + safeName(etudiant.getNom(), etudiant.getPrenom())
            + " s'est desinscrit(e) du cours " + cours.getCode()
            + " - " + cours.getTitre() + ".";
        send(to, subject, body);
    }

    private void send(String to, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        try {
            mailSender.send(message);
        } catch (MailException ex) {
            logger.warn("Mail send failed to {}: {}", to, ex.getMessage());
        }
    }

    private String safeEmail(String email) {
        return email == null ? "" : email.trim();
    }

    private String safeName(String nom, String prenom) {
        String n = nom == null ? "" : nom.trim();
        String p = prenom == null ? "" : prenom.trim();
        return (n + " " + p).trim();
    }
}
