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
import { Plus, Pencil, Trash2, Search, Eye, BookOpen, BookX } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface Formateur {
  id: number
  nom: string
  prenom: string
}

interface Cours {
  id: number
  code: string
  titre: string
  actif: boolean
  formateur?: Formateur
}

export default function CoursPage() {
  const [cours, setCours] = useState<Cours[]>([])
  const [formateurs, setFormateurs] = useState<Formateur[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCours, setSelectedCours] = useState<Cours | null>(null)
  const [formData, setFormData] = useState({
    code: "",
    titre: "",
    actif: true,
    formateurId: "",
  })

  useEffect(() => {
    fetchCours()
    fetchFormateurs()
  }, [])

  const fetchCours = async () => {
    try {
      const response = await api.get("/api/cours")
      setCours(response.data)
    } catch (error) {
      toast.error("Erreur lors du chargement des cours")
    } finally {
      setLoading(false)
    }
  }

  const fetchFormateurs = async () => {
    try {
      const response = await api.get("/api/formateurs")
      setFormateurs(response.data)
    } catch (error) {
      console.error("Error fetching formateurs:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        code: formData.code,
        titre: formData.titre,
        actif: formData.actif,
        formateur: formData.formateurId ? { id: Number.parseInt(formData.formateurId) } : null,
      }

      if (selectedCours) {
        await api.put(`/api/cours/${selectedCours.id}`, payload)
        toast.success("Cours modifié avec succès")
      } else {
        await api.post("/api/cours", payload)
        toast.success("Cours créé avec succès")
      }
      setIsDialogOpen(false)
      fetchCours()
      resetForm()
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement")
    }
  }

  const handleEdit = (cours: Cours) => {
    setSelectedCours(cours)
    setFormData({
      code: cours.code,
      titre: cours.titre,
      actif: cours.actif,
      formateurId: cours.formateur?.id?.toString() || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedCours) return
    try {
      await api.delete(`/api/cours/${selectedCours.id}`)
      toast.success("Cours supprimé avec succès")
      setIsDeleteDialogOpen(false)
      fetchCours()
    } catch (error) {
      toast.error("Erreur lors de la suppression")
    }
  }

  const toggleActif = async (cours: Cours) => {
    try {
      await api.put(`/api/cours/${cours.id}`, {
        ...cours,
        actif: !cours.actif,
        formateur: cours.formateur,
      })
      toast.success(`Cours ${cours.actif ? "désactivé" : "activé"}`)
      fetchCours()
    } catch (error) {
      toast.error("Erreur lors de la mise à jour")
    }
  }

  const resetForm = () => {
    setSelectedCours(null)
    setFormData({
      code: "",
      titre: "",
      actif: true,
      formateurId: "",
    })
  }

  const filteredCours = cours.filter(
    (c) =>
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.titre.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const columns = [
    { key: "code", label: "Code", sortable: true },
    { key: "titre", label: "Titre", sortable: true },
    {
      key: "formateur",
      label: "Formateur",
      render: (cours: Cours) => (cours.formateur ? `${cours.formateur.prenom} ${cours.formateur.nom}` : "-"),
    },
    {
      key: "actif",
      label: "Statut",
      render: (cours: Cours) => (
        <Badge variant={cours.actif ? "default" : "secondary"}>{cours.actif ? "Actif" : "Inactif"}</Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (cours: Cours) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/cours/${cours.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleActif(cours)}
            title={cours.actif ? "Désactiver" : "Activer"}
          >
            {cours.actif ? <BookX className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleEdit(cours)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedCours(cours)
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
            <h1 className="text-3xl font-bold text-foreground">Gestion des Cours</h1>
            <p className="text-muted-foreground mt-1">
              {cours.length} cours enregistré{cours.length > 1 ? "s" : ""}
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm()
              setIsDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nouveau cours
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un cours..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <DataTable columns={columns} data={filteredCours} loading={loading} emptyMessage="Aucun cours trouvé" />

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{selectedCours ? "Modifier le cours" : "Nouveau cours"}</DialogTitle>
              <DialogDescription>
                {selectedCours ? "Modifiez les informations du cours" : "Remplissez les informations du nouveau cours"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="code">Code</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="ex: INFO101"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="titre">Titre</Label>
                  <Input
                    id="titre"
                    value={formData.titre}
                    onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="formateur">Formateur</Label>
                  <Select
                    value={formData.formateurId}
                    onValueChange={(value) => setFormData({ ...formData, formateurId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un formateur" />
                    </SelectTrigger>
                    <SelectContent>
                      {formateurs.map((formateur) => (
                        <SelectItem key={formateur.id} value={formateur.id.toString()}>
                          {formateur.prenom} {formateur.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="actif"
                    checked={formData.actif}
                    onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                    className="h-4 w-4 rounded border-input"
                  />
                  <Label htmlFor="actif">Cours actif</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">{selectedCours ? "Enregistrer" : "Créer"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer le cours <strong>{selectedCours?.titre}</strong> ? Cette action est
                irréversible.
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
