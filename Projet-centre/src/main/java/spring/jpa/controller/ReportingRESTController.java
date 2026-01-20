package spring.jpa.controller;

import java.io.ByteArrayOutputStream;
import java.security.Principal;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.itextpdf.text.Document;
import com.itextpdf.text.Element;
import com.itextpdf.text.Paragraph;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;

import spring.jpa.model.Cours;
import spring.jpa.model.Etudiant;
import spring.jpa.model.Inscription;
import spring.jpa.model.Note;
import spring.jpa.model.User;
import spring.jpa.repository.CoursRepository;
import spring.jpa.repository.EtudiantRepository;
import spring.jpa.repository.InscriptionRepository;
import spring.jpa.repository.NoteRepository;
import spring.jpa.repository.UserRepository;

@RestController
@RequestMapping("/reports")
public class ReportingRESTController {

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private EtudiantRepository etudiantRepository;

    @Autowired
    private CoursRepository coursRepository;

    @Autowired
    private InscriptionRepository inscriptionRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/etudiant/me/moyenne")
    public ResponseEntity<?> getMyAverage(Principal principal) {
        if (principal == null) return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null || user.getEtudiant() == null) return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        return ResponseEntity.ok(Map.of(
            "etudiantId", user.getEtudiant().getId(),
            "moyenne", computeAverage(user.getEtudiant())
        ));
    }

    @GetMapping("/etudiants/{id}/moyenne")
    public ResponseEntity<?> getAverageByStudent(@PathVariable Long id) {
        Etudiant e = etudiantRepository.findById(id).orElse(null);
        if (e == null) return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        return ResponseEntity.ok(Map.of(
            "etudiantId", id,
            "moyenne", computeAverage(e)
        ));
    }

    @GetMapping("/cours/{code}/taux-reussite")
    public ResponseEntity<?> getSuccessRate(@PathVariable String code) {
        Cours cours = coursRepository.findById(code).orElse(null);
        if (cours == null) return new ResponseEntity<>(HttpStatus.NOT_FOUND);

        List<Note> notes = noteRepository.findByCours(cours);
        if (notes.isEmpty()) {
            return ResponseEntity.ok(Map.of("cours", code, "tauxReussite", 0.0));
        }
        long ok = notes.stream()
            .filter(n -> computeNoteAverage(n) >= 10.0)
            .count();
        double rate = (ok * 100.0) / notes.size();
        return ResponseEntity.ok(Map.of("cours", code, "tauxReussite", rate));
    }

    @GetMapping("/cours/top")
    public List<Map<String, Object>> topCourses(@RequestParam(name = "limit", defaultValue = "5") int limit) {
        List<Inscription> inscriptions = inscriptionRepository.findAll();
        Map<String, Long> counts = inscriptions.stream()
            .filter(i -> i.getCours() != null)
            .collect(Collectors.groupingBy(i -> i.getCours().getCode(), Collectors.counting()));

        return counts.entrySet().stream()
            .sorted(Map.Entry.comparingByValue(Comparator.reverseOrder()))
            .limit(Math.max(1, limit))
            .map(e -> {
                Cours c = coursRepository.findById(e.getKey()).orElse(null);
                Map<String, Object> row = new HashMap<>();
                row.put("code", e.getKey());
                row.put("titre", c != null ? c.getTitre() : "");
                row.put("inscriptions", e.getValue());
                return row;
            })
            .collect(Collectors.toList());
    }

    @GetMapping("/notes/pdf")
    public ResponseEntity<byte[]> exportNotesPdf(@RequestParam(name = "cours", required = false) String code) {
        try {
            List<Note> notes;
            String title = "Notes Report";
            if (code != null && !code.isBlank()) {
                Cours cours = coursRepository.findById(code).orElse(null);
                if (cours == null) return new ResponseEntity<>(HttpStatus.NOT_FOUND);
                notes = noteRepository.findByCours(cours);
                title = "Notes - " + code + " - " + cours.getTitre();
            } else {
                notes = noteRepository.findAll();
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document document = new Document();
            PdfWriter.getInstance(document, out);
            document.open();
            document.add(new Paragraph(title));

            if (notes.isEmpty()) {
                document.add(new Paragraph("Aucune note."));
            } else if (code != null && !code.isBlank()) {
                addCourseNotesTable(document, code, notes);
            } else {
                Map<String, List<Note>> byCourse = notes.stream()
                    .filter(n -> n.getCours() != null)
                    .collect(Collectors.groupingBy(n -> n.getCours().getCode()));

                for (String courseCode : byCourse.keySet().stream().sorted().toList()) {
                    addCourseNotesTable(document, courseCode, byCourse.get(courseCode));
                }
            }

            document.close();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "notes-report.pdf");
            return new ResponseEntity<>(out.toByteArray(), headers, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private PdfPCell header(String text) {
        PdfPCell cell = new PdfPCell(new Paragraph(text));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        return cell;
    }

    private void addCourseNotesTable(Document document, String courseCode, List<Note> notes) throws Exception {
        Cours cours = coursRepository.findById(courseCode).orElse(null);
        String title = cours != null
            ? courseCode + " - " + cours.getTitre()
            : courseCode;
        document.add(new Paragraph(title));

        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100);
        table.addCell(header("Etudiant"));
        table.addCell(header("Examen"));
        table.addCell(header("DS"));
        table.addCell(header("Oral"));

        for (Note n : notes) {
            String etu = n.getEtudiant() != null
                ? n.getEtudiant().getNom() + " " + n.getEtudiant().getPrenom()
                : "";
            table.addCell(etu);
            table.addCell(String.valueOf(n.getNoteExamen()));
            table.addCell(String.valueOf(n.getNoteDs()));
            table.addCell(String.valueOf(n.getNoteOral()));
        }

        document.add(table);
        document.add(new Paragraph(" "));
    }

    private double computeAverage(Etudiant etudiant) {
        List<Note> notes = noteRepository.findByEtudiant(etudiant);
        if (notes.isEmpty()) return 0.0;
        double sum = notes.stream().mapToDouble(this::computeNoteAverage).sum();
        return sum / notes.size();
    }

    private double computeNoteAverage(Note n) {
        return (n.getNoteExamen() + n.getNoteDs() + n.getNoteOral()) / 3.0;
    }
}
