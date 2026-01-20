"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { notesApi, etudiantsApi, coursApi, type Note, type Etudiant, type Cours } from "@/lib/api"
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react"

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [etudiants, setEtudiants] = useState<Etudiant[]>([])
  const [cours, setCours] = useState<Cours[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [formData, setFormData] = useState({
    etudiantId: "",
    coursCode: "",
    noteExamen: "0",
    noteDs: "0",
    noteOral: "0",
  })
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const fetchData = async () => {
    try {
      const [notesData, etudiantsData, coursData] = await Promise.all([
        notesApi.getAll(),
        etudiantsApi.getAll(),
        coursApi.getAll(),
      ])
      setNotes(notesData)
      setEtudiants(etudiantsData)
      setCours(coursData)
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de charger les données", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreate = async () => {
    setSubmitting(true)
    try {
      await notesApi.create({
        etudiant: { id: Number.parseInt(formData.etudiantId) } as Etudiant,
        cours: { code: formData.coursCode } as Cours,
        noteExamen: Number.parseFloat(formData.noteExamen),
        noteDs: Number.parseFloat(formData.noteDs),
        noteOral: Number.parseFloat(formData.noteOral),
      })
      toast({ title: "Succès", description: "Note créée avec succès" })
      setDialogOpen(false)
      resetForm()
      fetchData()
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de créer la note", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedNote) return
    setSubmitting(true)
    try {
      await notesApi.update(selectedNote.id, {
        noteExamen: Number.parseFloat(formData.noteExamen),
        noteDs: Number.parseFloat(formData.noteDs),
        noteOral: Number.parseFloat(formData.noteOral),
      })
      toast({ title: "Succès", description: "Note mise à jour avec succès" })
      setDialogOpen(false)
      setSelectedNote(null)
      resetForm()
      fetchData()
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de mettre à jour la note", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedNote) return
    try {
      await notesApi.delete(selectedNote.id)
      toast({ title: "Succès", description: "Note supprimée avec succès" })
      setDeleteDialogOpen(false)
      setSelectedNote(null)
      fetchData()
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de supprimer la note", variant: "destructive" })
    }
  }

  const resetForm = () => {
    setFormData({ etudiantId: "", coursCode: "", noteExamen: "0", noteDs: "0", noteOral: "0" })
  }

  const openEditDialog = (note: Note) => {
    setSelectedNote(note)
    setFormData({
      etudiantId: note.etudiant?.id?.toString() || "",
      coursCode: note.cours?.code || "",
      noteExamen: note.noteExamen.toString(),
      noteDs: note.noteDs.toString(),
      noteOral: note.noteOral.toString(),
    })
    setDialogOpen(true)
  }

  const calculateAverage = (n: Note) => ((n.noteExamen + n.noteDs + n.noteOral) / 3).toFixed(2)

  const columns = [
    {
      key: "etudiant",
      header: "Étudiant",
      render: (item: Note) => (item.etudiant ? `${item.etudiant.prenom} ${item.etudiant.nom}` : "-"),
    },
    { key: "cours", header: "Cours", render: (item: Note) => item.cours?.titre || "-" },
    { key: "noteExamen", header: "Examen", render: (item: Note) => item.noteExamen.toFixed(2) },
    { key: "noteDs", header: "DS", render: (item: Note) => item.noteDs.toFixed(2) },
    { key: "noteOral", header: "Oral", render: (item: Note) => item.noteOral.toFixed(2) },
    { key: "moyenne", header: "Moyenne", render: (item: Note) => calculateAverage(item) },
    {
      key: "actions",
      header: "Actions",
      render: (item: Note) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedNote(item)
              setDeleteDialogOpen(true)
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Gestion des Notes</h1>
            <p className="text-muted-foreground">Gérez les notes des étudiants</p>
          </div>
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open)
              if (!open) {
                setSelectedNote(null)
                resetForm()
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une note
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>{selectedNote ? "Modifier la note" : "Ajouter une note"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                {!selectedNote && (
                  <>
                    <div className="space-y-2">
                      <Label>Étudiant</Label>
                      <Select
                        value={formData.etudiantId}
                        onValueChange={(v) => setFormData({ ...formData, etudiantId: v })}
                      >
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          {etudiants.map((e) => (
                            <SelectItem key={e.id} value={e.id.toString()}>
                              {e.prenom} {e.nom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Cours</Label>
                      <Select
                        value={formData.coursCode}
                        onValueChange={(v) => setFormData({ ...formData, coursCode: v })}
                      >
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue placeholder="Sélectionner" />
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
                  </>
                )}
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
                <Button className="w-full" onClick={selectedNote ? handleUpdate : handleCreate} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ...
                    </>
                  ) : selectedNote ? (
                    "Mettre à jour"
                  ) : (
                    "Créer"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <DataTable data={notes} columns={columns} />
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>Êtes-vous sûr de vouloir supprimer cette note ?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  )
}
