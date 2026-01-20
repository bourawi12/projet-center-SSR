package spring.jpa;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ApplicationContext;

import spring.jpa.model.*;
import spring.jpa.repository.*;

@SpringBootApplication
public class JpaSpringBootThymeleafApplication {

    // Repositories
    static EtudiantRepository etudiantRepos;
    static FormateurRepository formateurRepos;
    static CoursRepository coursRepos;
    static InscriptionRepository inscriptionRepos;
    static NoteRepository noteRepos;

    public static void main(String[] args) {

        ApplicationContext context =
                SpringApplication.run(JpaSpringBootThymeleafApplication.class, args);

        // Injection manuelle (comme ton ancien projet)
        etudiantRepos = context.getBean(EtudiantRepository.class);
        formateurRepos = context.getBean(FormateurRepository.class);
        coursRepos = context.getBean(CoursRepository.class);
        inscriptionRepos = context.getBean(InscriptionRepository.class);
        noteRepos = context.getBean(NoteRepository.class);

       

        // ===== Affichage console =====
        afficherEtudiants();
        afficherCours();
        afficherInscriptions();
        afficherNotes();
    }

    // =================== METHODS ===================

    static void afficherEtudiants() {
        System.out.println("===== LISTE DES ETUDIANTS =====");
        List<Etudiant> list = etudiantRepos.findAll();
        for (Etudiant e : list) {
            System.out.println(e.getMatricule() + " - " + e.getPrenom() + " " + e.getNom());
        }
    }

    static void afficherCours() {
        System.out.println("===== LISTE DES COURS =====");
        List<Cours> list = coursRepos.findAll();
        for (Cours c : list) {
            System.out.println(c.getCode() + " - " + c.getTitre() + " (Formateur: " + c.getFormateur().getPrenom() + " " + c.getFormateur().getNom() + ")");
        }
    }

    static void afficherInscriptions() {
        System.out.println("===== LISTE DES INSCRIPTIONS =====");
        List<Inscription> list = inscriptionRepos.findAll();
        for (Inscription i : list) {
            System.out.println(
                i.getEtudiant().getPrenom() + " " + i.getEtudiant().getNom() + 
                " inscrit(e) à " + i.getCours().getTitre()
            );
        }
    }

    static void afficherNotes() {
        System.out.println("===== LISTE DES NOTES =====");
        List<Note> list = noteRepos.findAll();
        for (Note n : list) {
            System.out.println(
                n.getEtudiant().getPrenom() + " " + n.getEtudiant().getNom() + 
                " : Examen=" + n.getNoteExamen() + 
                ", DS=" + n.getNoteDs() + 
                ", Oral=" + n.getNoteOral() + 
                " (" + n.getCours().getTitre() + ")"
            );
        }
    }
}
