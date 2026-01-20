package spring.jpa.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/formateur")
public class FormateurMvcController {

    @GetMapping("/notes")
    public String notesPage() {
        return "formateur/notes";
    }
    
    @GetMapping("/notes/new")
    public String newNoteForm() {
        return "notes/add_notes";
    }
    
    @GetMapping("/notes/edit/{id}")
    public String editNoteForm() {
        return "notes/edit_notes";
    }
}
