"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { notesApi, formateursApi, type Note, type Cours } from "@/lib/api"
import { Pencil, Loader2 } from "lucide-react"

export default function FormateurNotesPage() {
  const searchParams = useSearchParams()
  const coursCode = searchParams.get("cours")

  const [cours, setCours] = useState<Cours[]>([])
  const [selectedCours, setSelectedCours] = useState(coursCode || "")
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [formData, setFormData] = useState({ noteExamen: "0", noteDs: "0", noteOral: "0" })
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchCours = async () => {
      try {
        const coursData = await formateursApi.getMyCours()
        setCours(coursData)
        if (coursCode && coursData.find((c) => c.code === coursCode)) {
          setSelectedCours(coursCode)
        }
      } catch (error) {
        toast({ title: "Erreur", description: "Impossible de charger", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    fetchCours()
  }, [])

  useEffect(() => {
    if (selectedCours) {
      const fetchNotes = async () => {
        try {
          const notesData = await notesApi.getByCourse(selectedCours)
          setNotes(notesData)
        } catch (error) {
          toast({ title: "Erreur", description: "Impossible de charger les notes", variant: "destructive" })
        }
      }
      fetchNotes()
    }
  }, [selectedCours])

  const handleUpdate = async () => {
    if (!selectedNote) return
    setSubmitting(true)
    try {
      await notesApi.update(selectedNote.id, {
        noteExamen: Number.parseFloat(formData.noteExamen),
        noteDs: Number.parseFloat(formData.noteDs),
        noteOral: Number.parseFloat(formData.noteOral),
      })
      toast({ title: "Succès", description: "Note mise à jour" })
      setDialogOpen(false)
      const notesData = await notesApi.getByCourse(selectedCours)
      setNotes(notesData)
    } catch (error) {
      toast({ title: "Erreur", description: "Mise à jour échouée", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const openEditDialog = (note: Note) => {
    setSelectedNote(note)
    setFormData({
      noteExamen: note.noteExamen.toString(),
      noteDs: note.noteDs.toString(),
      noteOral: note.noteOral.toString(),
    })
    setDialogOpen(true)
  }

  const columns = [
    {
      key: "etudiant",
      header: "Étudiant",
      render: (item: Note) => (item.etudiant ? `${item.etudiant.prenom} ${item.etudiant.nom}` : "-"),
    },
    { key: "matricule", header: "Matricule", render: (item: Note) => item.etudiant?.matricule || "-" },
    { key: "noteExamen", header: "Examen", render: (item: Note) => item.noteExamen.toFixed(2) },
    { key: "noteDs", header: "DS", render: (item: Note) => item.noteDs.toFixed(2) },
    { key: "noteOral", header: "Oral", render: (item: Note) => item.noteOral.toFixed(2) },
    {
      key: "moyenne",
      header: "Moyenne",
      render: (item: Note) => ((item.noteExamen + item.noteDs + item.noteOral) / 3).toFixed(2),
    },
    {
      key: "actions",
      header: "Actions",
      render: (item: Note) => (
        <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Notes</h1>
          <p className="text-muted-foreground">Modifiez les notes de vos étudiants</p>
        </div>

        <div className="max-w-sm">
          <Label>Sélectionner un cours</Label>
          <Select value={selectedCours} onValueChange={setSelectedCours}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Choisir un cours" />
            </SelectTrigger>
            <SelectContent>
              {cours.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.titre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : selectedCours ? (
          <DataTable data={notes} columns={columns} />
        ) : (
          <p className="text-muted-foreground">Sélectionnez un cours pour voir les notes</p>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>
                Modifier la note de {selectedNote?.etudiant?.prenom} {selectedNote?.etudiant?.nom}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Examen</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="20"
                    value={formData.noteExamen}
                    onChange={(e) => setFormData({ ...formData, noteExamen: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>DS</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="20"
                    value={formData.noteDs}
                    onChange={(e) => setFormData({ ...formData, noteDs: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Oral</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="20"
                    value={formData.noteOral}
                    onChange={(e) => setFormData({ ...formData, noteOral: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
              </div>
              <Button className="w-full" onClick={handleUpdate} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}Enregistrer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
