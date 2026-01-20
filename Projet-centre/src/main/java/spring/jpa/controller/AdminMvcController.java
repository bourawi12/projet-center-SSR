package spring.jpa.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable; // NEW
import org.springframework.web.bind.annotation.RequestMapping;

import spring.jpa.repository.CoursRepository;
import spring.jpa.repository.EtudiantRepository;

@Controller
@RequestMapping("/admin")
public class AdminMvcController {

    private final EtudiantRepository etudiantRepository;
    private final CoursRepository coursRepository;

    public AdminMvcController(EtudiantRepository etudiantRepository, CoursRepository coursRepository) {
        this.etudiantRepository = etudiantRepository;
        this.coursRepository = coursRepository;
    }

    // --- Course Management ---
    @GetMapping("/courses")
    public String listCourses() {
        return "admin/list_courses";
    }

    @GetMapping("/courses/new")
    public String newCourseForm() {
        return "admin/new_course";
    }
    
    @GetMapping("/courses/edit/{code}")
    public String editCourseForm(@PathVariable String code) {
        return "admin/edit_course";
    }

    // --- Etudiant Management ---
    @GetMapping("/etudiants") // List page
    public String listStudents() {
        return "admin/list_etudiants"; 
    }
    
    @GetMapping("/etudiants/new") // NEW: Add page
    public String newStudentForm() {
        // Maps to src/main/resources/templates/admin/new_etudiant.html
        return "admin/new_etudiant";
    }

    @GetMapping("/etudiants/edit/{id}") // NEW: Edit page
    public String editStudentForm(@PathVariable Long id) {
        // Maps to src/main/resources/templates/admin/edit_etudiant.html
        // The ID is available to the client via JavaScript (window.location)
        return "admin/edit_etudiant";
    }
    
    // --- Formateur Management ---
    @GetMapping("/formateurs") 
    public String listFormateurs() {
        return "admin/list_formateurs"; 
    }
    
    @GetMapping("/formateurs/new") // NEW: Add page
    public String newFormateurForm() {
        // Maps to src/main/resources/templates/admin/new_etudiant.html
        return "admin/new_formateurs";
    }
    
    @GetMapping("/formateurs/edit/{id}")
    public String editFormateurForm(@PathVariable Long id) {
        return "admin/edit_formateur";
    }

    // --- Note Management ---
    @GetMapping("/notes")
    public String viewNotes() {
        return "admin/view_notes"; 
    }

    @GetMapping("/inscriptions")
    public String listInscriptions() {
        return "admin/inscriptions";
    }

    @GetMapping("/sessions")
    public String listSessions() {
        return "admin/list_sessions";
    }

    @GetMapping("/specialites")
    public String listSpecialites() {
        return "admin/list_specialites";
    }

    @GetMapping("/groupes")
    public String listGroupes() {
        return "admin/list_groupes";
    }

    @GetMapping("/groupes/edit/{id}")
    public String editGroupe(@PathVariable Long id) {
        return "admin/edit_groupe";
    }

    @GetMapping("/seances")
    public String listSeances() {
        return "admin/list_seances";
    }

    @GetMapping("/reporting")
    public String reporting(Model model) {
        model.addAttribute("etudiants", etudiantRepository.findAll());
        model.addAttribute("coursList", coursRepository.findAll());
        return "admin/reporting";
    }
    
    @GetMapping("/notes/new")
    public String newNoteForm() {
        return "notes/add_notes";
    }
    
    @GetMapping("/notes/edit/{id}")
    public String editNoteForm(@PathVariable Long id) {
        return "notes/edit_notes";
    }
}
