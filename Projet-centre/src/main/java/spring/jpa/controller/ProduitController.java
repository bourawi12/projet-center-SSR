package spring.jpa.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;

import jakarta.validation.Valid;
import spring.jpa.model.Categorie;
import spring.jpa.model.Produit;
import spring.jpa.repository.CategorieRepository;
import spring.jpa.repository.ProduitRepository;

@Controller
@RequestMapping(value = "/produit")
public class ProduitController {

    @Autowired
    private CategorieRepository categorieRepository;

    @Autowired
    private ProduitRepository produitRepos;

    // ===== LIST + FILTER + PAGINATION =====
    @RequestMapping(value = "/index")
    public String index(Model model,

        @RequestParam(name = "page", defaultValue = "0") int p,
        @RequestParam(name = "motCle", defaultValue = "") String mc,
        @RequestParam(name = "typeProduit", defaultValue = "Tous") String tp
    ) {

        Page<Produit> pg;

        if (tp.equals("Tous")) {
            pg = produitRepos.findByDesignationLike("%" + mc + "%", PageRequest.of(p, 6));
        } 
        else if (tp.equals("Actifs")) {
            pg = produitRepos.findByDesignationLikeAndActif("%" + mc + "%", true, PageRequest.of(p, 6));
        } 
        else {
            pg = produitRepos.findByDesignationLikeAndActif("%" + mc + "%", false, PageRequest.of(p, 6));
        }

        int nbrePages = pg.getTotalPages();
        int[] pages = new int[nbrePages];
        for (int i = 0; i < nbrePages; i++) {
            pages[i] = i;
        }

        model.addAttribute("pages", pages);
        model.addAttribute("pageProduits", pg);
        model.addAttribute("pageCourante", p);
        model.addAttribute("motCle", mc);
        model.addAttribute("typeProduit", tp);

        return "produits";
    }

    // ===== FORM CREATE =====
    @RequestMapping(value = "/form", method = RequestMethod.GET)
    public String formProduit(Model model) {
        model.addAttribute("produit", new Produit());
        model.addAttribute("categories", categorieRepository.findAll());
        return "formProduit";
    }

    // ===== SAVE =====
    @RequestMapping(value = "/save", method = RequestMethod.POST)
    public String save(Model model, @Valid Produit produit, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            model.addAttribute("categories", categorieRepository.findAll());
            return "formProduit";
        }
        produitRepos.save(produit);
        return "confirmation";
    }

    // ===== DELETE =====
    @RequestMapping(value = "/delete", method = RequestMethod.GET)
    public String delete(
            @RequestParam(name = "id") Long id,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "motCle", defaultValue = "") String motCle,
            @RequestParam(name = "typeProduit", defaultValue = "Tous") String typeProduit
    ) {
        produitRepos.deleteById(id);
        return "redirect:index?page=" + page + "&motCle=" + motCle + "&typeProduit=" + typeProduit;
    }

    // ===== EDIT =====
    @RequestMapping(value = "/edit", method = RequestMethod.GET)
    public String edit(Model model, @RequestParam(name = "id") Long id) {
        model.addAttribute("categories", categorieRepository.findAll());

        Produit p = produitRepos.findById(id).orElse(null);
        model.addAttribute("produit", p);

        return "editProduit";
    }

    // ===== UPDATE =====
    @RequestMapping(value = "/update", method = RequestMethod.POST)
    public String update(Model model, @Valid Produit produit, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            model.addAttribute("categories", categorieRepository.findAll());
            return "editProduit";
        }
        produitRepos.save(produit);
        return "confirmation";
    }
}
