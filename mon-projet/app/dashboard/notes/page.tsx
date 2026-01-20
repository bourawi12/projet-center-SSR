"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { api } from "@/lib/api"
import { Plus, Pencil, Trash2, Search } from "lucide-react"
import { toast } from "sonner"

interface Etudiant {
  id: number
  matricule: string
  nom: string
  prenom: string
}

interface Cours {
  id: number
  code: string
  titre: string
}

interface Note {
  id: number
  examen: number
  ds: number
  oral: number
  etudiant: Etudiant
  cours: Cours
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [etudiants, setEtudiants] = useState<Etudiant[]>([])
  const [cours, setCours] = useState<Cours[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [formData, setFormData] = useState({
    examen: "",
    ds: "",
    oral: "",
    etudiantId: "",
    coursId: "",
  })

  useEffect(() => {
    fetchNotes()
    fetchEtudiants()
    fetchCours()
  }, [])

  const fetchNotes = async () => {
    try {
      const response = await api.get("/api/notes")
      setNotes(response.data)
    } catch (error) {
      toast.error("Erreur lors du chargement des notes")
    } finally {
      setLoading(false)
    }
  }

  const fetchEtudiants = async () => {
    try {
      const response = await api.get("/api/etudiants")
      setEtudiants(response.data)
    } catch (error) {
      console.error("Error fetching etudiants:", error)
    }
  }

  const fetchCours = async () => {
    try {
      const response = await api.get("/api/cours")
      setCours(response.data)
    } catch (error) {
      console.error("Error fetching cours:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        examen: Number.parseFloat(formData.examen),
        ds: Number.parseFloat(formData.ds),
        oral: Number.parseFloat(formData.oral),
        etudiant: { id: Number.parseInt(formData.etudiantId) },
        cours: { id: Number.parseInt(formData.coursId) },
      }

      if (selectedNote) {
        await api.put(`/api/notes/${selectedNote.id}`, payload)
        toast.success("Note modifiée avec succès")
      } else {
        await api.post("/api/notes", payload)
        toast.success("Note créée avec succès")
      }
      setIsDialogOpen(false)
      fetchNotes()
      resetForm()
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement")
    }
  }

  const handleEdit = (note: Note) => {
    setSelectedNote(note)
    setFormData({
      examen: note.examen.toString(),
      ds: note.ds.toString(),
      oral: note.oral.toString(),
      etudiantId: note.etudiant.id.toString(),
      coursId: note.cours.id.toString(),
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedNote) return
    try {
      await api.delete(`/api/notes/${selectedNote.id}`)
      toast.success("Note supprimée avec succès")
      setIsDeleteDialogOpen(false)
      fetchNotes()
    } catch (error) {
      toast.error("Erreur lors de la suppression")
    }
  }

  const resetForm = () => {
    setSelectedNote(null)
    setFormData({
      examen: "",
      ds: "",
      oral: "",
      etudiantId: "",
      coursId: "",
    })
  }

  const calculateMoyenne = (note: Note) => {
    return (note.examen * 0.5 + note.ds * 0.3 + note.oral * 0.2).toFixed(2)
  }

  const getMoyenneColor = (moyenne: number) => {
    if (moyenne >= 14) return "default"
    if (moyenne >= 10) return "secondary"
    return "destructive"
  }

  const filteredNotes = notes.filter(
    (n) =>
      n.etudiant.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.etudiant.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.cours.titre.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const columns = [
    {
      key: "etudiant",
      label: "Étudiant",
      sortable: true,
      render: (note: Note) => `${note.etudiant.prenom} ${note.etudiant.nom}`,
    },
    {
      key: "cours",
      label: "Cours",
      sortable: true,
      render: (note: Note) => note.cours.titre,
    },
    {
      key: "examen",
      label: "Examen (50%)",
      render: (note: Note) => `${note.examen}/20`,
    },
    {
      key: "ds",
      label: "DS (30%)",
      render: (note: Note) => `${note.ds}/20`,
    },
    {
      key: "oral",
      label: "Oral (20%)",
      render: (note: Note) => `${note.oral}/20`,
    },
    {
      key: "moyenne",
      label: "Moyenne",
      render: (note: Note) => {
        const moyenne = Number.parseFloat(calculateMoyenne(note))
        return <Badge variant={getMoyenneColor(moyenne)}>{moyenne}/20</Badge>
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (note: Note) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(note)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedNote(note)
              setIsDeleteDialogOpen(true)
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestion des Notes</h1>
            <p className="text-muted-foreground mt-1">
              {notes.length} note{notes.length > 1 ? "s" : ""} enregistrée{notes.length > 1 ? "s" : ""}
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm()
              setIsDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle note
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par étudiant ou cours..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <DataTable columns={columns} data={filteredNotes} loading={loading} emptyMessage="Aucune note trouvée" />

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{selectedNote ? "Modifier la note" : "Nouvelle note"}</DialogTitle>
              <DialogDescription>
                {selectedNote ? "Modifiez les notes de l'étudiant" : "Saisissez les notes de l'étudiant"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="etudiant">Étudiant</Label>
                  <Select
                    value={formData.etudiantId}
                    onValueChange={(value) => setFormData({ ...formData, etudiantId: value })}
                    disabled={!!selectedNote}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un étudiant" />
                    </SelectTrigger>
                    <SelectContent>
                      {etudiants.map((etudiant) => (
                        <SelectItem key={etudiant.id} value={etudiant.id.toString()}>
                          {etudiant.prenom} {etudiant.nom} ({etudiant.matricule})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cours">Cours</Label>
                  <Select
                    value={formData.coursId}
                    onValueChange={(value) => setFormData({ ...formData, coursId: value })}
                    disabled={!!selectedNote}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un cours" />
                    </SelectTrigger>
                    <SelectContent>
                      {cours.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.titre} ({c.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="examen">Examen (50%)</Label>
                    <Input
                      id="examen"
                      type="number"
                      min="0"
                      max="20"
                      step="0.25"
                      value={formData.examen}
                      onChange={(e) => setFormData({ ...formData, examen: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="ds">DS (30%)</Label>
                    <Input
                      id="ds"
                      type="number"
                      min="0"
                      max="20"
                      step="0.25"
                      value={formData.ds}
                      onChange={(e) => setFormData({ ...formData, ds: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="oral">Oral (20%)</Label>
                    <Input
                      id="oral"
                      type="number"
                      min="0"
                      max="20"
                      step="0.25"
                      value={formData.oral}
                      onChange={(e) => setFormData({ ...formData, oral: e.target.value })}
                      required
                    />
                  </div>
                </div>
                {formData.examen && formData.ds && formData.oral && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Moyenne calculée:</p>
                    <p className="text-2xl font-bold">
                      {(
                        Number.parseFloat(formData.examen) * 0.5 +
                        Number.parseFloat(formData.ds) * 0.3 +
                        Number.parseFloat(formData.oral) * 0.2
                      ).toFixed(2)}
                      /20
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">{selectedNote ? "Enregistrer" : "Créer"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer cette note ? Cette action est irréversible.
              </AlertDialogDescription>
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
