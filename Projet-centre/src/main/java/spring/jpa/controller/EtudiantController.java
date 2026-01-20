package spring.jpa.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import spring.jpa.model.Etudiant;
import spring.jpa.repository.EtudiantRepository;

@Controller
@RequestMapping(value = "/etudiant")
public class EtudiantController {

    @Autowired
    private EtudiantRepository etudiantRepository;

    // ===== LIST + FILTER + PAGINATION =====
    @RequestMapping(value = "/index")
    public String index(Model model,

        @RequestParam(name = "page", defaultValue = "0") int p,
        @RequestParam(name = "motCle", defaultValue = "") String mc,
        @RequestParam(name = "typeEtudiant", defaultValue = "Tous") String te
    ) {

        Page<Etudiant> pg;

        if (te.equals("Tous")) {
            pg = etudiantRepository.findByNomLike("%" + mc + "%", PageRequest.of(p, 6));
        } 
        else if (te.equals("Actifs")) {
            pg = etudiantRepository.findByNomLikeAndActif("%" + mc + "%", true, PageRequest.of(p, 6));
        } 
        else {
            pg = etudiantRepository.findByNomLikeAndActif("%" + mc + "%", false, PageRequest.of(p, 6));
        }

        int nbrePages = pg.getTotalPages();
        int[] pages = new int[nbrePages];
        for (int i = 0; i < nbrePages; i++) {
            pages[i] = i;
        }

        model.addAttribute("pages", pages);
        model.addAttribute("pageEtudiants", pg);
        model.addAttribute("pageCourante", p);
        model.addAttribute("motCle", mc);
        model.addAttribute("typeEtudiant", te);

        return "etudiants";
    }

    // ===== FORM CREATE =====
    @RequestMapping(value = "/form", method = RequestMethod.GET)
    public String formEtudiant(Model model) {
        model.addAttribute("etudiant", new Etudiant());
        return "formEtudiant";
    }

    // ===== SAVE =====
    @RequestMapping(value = "/save", method = RequestMethod.POST)
    public String save(Model model, @Valid Etudiant etudiant, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            return "formEtudiant";
        }
        etudiantRepository.save(etudiant);
        return "confirmation";
    }

    // ===== DELETE =====
    @RequestMapping(value = "/delete", method = RequestMethod.GET)
    public String delete(
            @RequestParam(name = "id") Long id,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "motCle", defaultValue = "") String motCle,
            @RequestParam(name = "typeEtudiant", defaultValue = "Tous") String typeEtudiant
    ) {
        etudiantRepository.deleteById(id);
        return "redirect:index?page=" + page + "&motCle=" + motCle + "&typeEtudiant=" + typeEtudiant;
    }

    // ===== EDIT =====
    @RequestMapping(value = "/edit", method = RequestMethod.GET)
    public String edit(Model model, @RequestParam(name = "id") Long id) {

        Etudiant e = etudiantRepository.findById(id).orElse(null);
        model.addAttribute("etudiant", e);

        return "editEtudiant";
    }

    // ===== UPDATE =====
    @RequestMapping(value = "/update", method = RequestMethod.POST)
    public String update(Model model, @Valid Etudiant etudiant, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            return "editEtudiant";
        }
        etudiantRepository.save(etudiant);
        return "confirmation";
    }
}
