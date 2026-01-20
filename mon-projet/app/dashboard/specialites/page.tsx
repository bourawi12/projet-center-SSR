"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

interface Specialite {
  id: number
  nom: string
  description: string
}

export default function SpecialitesPage() {
  const [specialites, setSpecialites] = useState<Specialite[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedSpecialite, setSelectedSpecialite] = useState<Specialite | null>(null)
  const [formData, setFormData] = useState({
    nom: "",
    description: "",
  })

  useEffect(() => {
    fetchSpecialites()
  }, [])

  const fetchSpecialites = async () => {
    try {
      const response = await api.get("/api/specialites")
      setSpecialites(response.data)
    } catch (error) {
      toast.error("Erreur lors du chargement des spécialités")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (selectedSpecialite) {
        await api.put(`/api/specialites/${selectedSpecialite.id}`, formData)
        toast.success("Spécialité modifiée avec succès")
      } else {
        await api.post("/api/specialites", formData)
        toast.success("Spécialité créée avec succès")
      }
      setIsDialogOpen(false)
      fetchSpecialites()
      resetForm()
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement")
    }
  }

  const handleEdit = (specialite: Specialite) => {
    setSelectedSpecialite(specialite)
    setFormData({
      nom: specialite.nom,
      description: specialite.description || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedSpecialite) return
    try {
      await api.delete(`/api/specialites/${selectedSpecialite.id}`)
      toast.success("Spécialité supprimée avec succès")
      setIsDeleteDialogOpen(false)
      fetchSpecialites()
    } catch (error) {
      toast.error("Erreur lors de la suppression")
    }
  }

  const resetForm = () => {
    setSelectedSpecialite(null)
    setFormData({
      nom: "",
      description: "",
    })
  }

  const filteredSpecialites = specialites.filter(
    (s) =>
      s.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const columns = [
    { key: "nom", label: "Nom", sortable: true },
    {
      key: "description",
      label: "Description",
      render: (specialite: Specialite) => <span className="line-clamp-2">{specialite.description || "-"}</span>,
    },
    {
      key: "actions",
      label: "Actions",
      render: (specialite: Specialite) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(specialite)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedSpecialite(specialite)
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
            <h1 className="text-3xl font-bold text-foreground">Gestion des Spécialités</h1>
            <p className="text-muted-foreground mt-1">
              {specialites.length} spécialité{specialites.length > 1 ? "s" : ""} enregistrée
              {specialites.length > 1 ? "s" : ""}
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm()
              setIsDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle spécialité
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher une spécialité..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredSpecialites}
          loading={loading}
          emptyMessage="Aucune spécialité trouvée"
        />

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{selectedSpecialite ? "Modifier la spécialité" : "Nouvelle spécialité"}</DialogTitle>
              <DialogDescription>
                {selectedSpecialite
                  ? "Modifiez les informations de la spécialité"
                  : "Remplissez les informations de la nouvelle spécialité"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nom">Nom</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    placeholder="ex: Informatique"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description de la spécialité..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">{selectedSpecialite ? "Enregistrer" : "Créer"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer la spécialité <strong>{selectedSpecialite?.nom}</strong> ? Cette
                action est irréversible.
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
