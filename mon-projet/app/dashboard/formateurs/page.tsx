"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Plus, Pencil, Trash2, Search, Eye } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface Formateur {
  id: number
  nom: string
  prenom: string
  email: string
  specialite: string
}

export default function FormateursPage() {
  const [formateurs, setFormateurs] = useState<Formateur[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedFormateur, setSelectedFormateur] = useState<Formateur | null>(null)
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    specialite: "",
  })

  useEffect(() => {
    fetchFormateurs()
  }, [])

  const fetchFormateurs = async () => {
    try {
      const response = await api.get("/api/formateurs")
      setFormateurs(response.data)
    } catch (error) {
      toast.error("Erreur lors du chargement des formateurs")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (selectedFormateur) {
        await api.put(`/api/formateurs/${selectedFormateur.id}`, formData)
        toast.success("Formateur modifié avec succès")
      } else {
        await api.post("/api/formateurs", formData)
        toast.success("Formateur créé avec succès")
      }
      setIsDialogOpen(false)
      fetchFormateurs()
      resetForm()
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement")
    }
  }

  const handleEdit = (formateur: Formateur) => {
    setSelectedFormateur(formateur)
    setFormData({
      nom: formateur.nom,
      prenom: formateur.prenom,
      email: formateur.email,
      specialite: formateur.specialite,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedFormateur) return
    try {
      await api.delete(`/api/formateurs/${selectedFormateur.id}`)
      toast.success("Formateur supprimé avec succès")
      setIsDeleteDialogOpen(false)
      fetchFormateurs()
    } catch (error) {
      toast.error("Erreur lors de la suppression")
    }
  }

  const resetForm = () => {
    setSelectedFormateur(null)
    setFormData({
      nom: "",
      prenom: "",
      email: "",
      specialite: "",
    })
  }

  const filteredFormateurs = formateurs.filter(
    (f) =>
      f.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.specialite.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const columns = [
    { key: "nom", label: "Nom", sortable: true },
    { key: "prenom", label: "Prénom", sortable: true },
    { key: "email", label: "Email", sortable: true },
    { key: "specialite", label: "Spécialité", sortable: true },
    {
      key: "actions",
      label: "Actions",
      render: (formateur: Formateur) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/formateurs/${formateur.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleEdit(formateur)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedFormateur(formateur)
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
            <h1 className="text-3xl font-bold text-foreground">Gestion des Formateurs</h1>
            <p className="text-muted-foreground mt-1">
              {formateurs.length} formateur{formateurs.length > 1 ? "s" : ""} enregistré
              {formateurs.length > 1 ? "s" : ""}
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm()
              setIsDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nouveau formateur
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un formateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredFormateurs}
          loading={loading}
          emptyMessage="Aucun formateur trouvé"
        />

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{selectedFormateur ? "Modifier le formateur" : "Nouveau formateur"}</DialogTitle>
              <DialogDescription>
                {selectedFormateur
                  ? "Modifiez les informations du formateur"
                  : "Remplissez les informations du nouveau formateur"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="nom">Nom</Label>
                    <Input
                      id="nom"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="prenom">Prénom</Label>
                    <Input
                      id="prenom"
                      value={formData.prenom}
                      onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="specialite">Spécialité</Label>
                  <Input
                    id="specialite"
                    value={formData.specialite}
                    onChange={(e) => setFormData({ ...formData, specialite: e.target.value })}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">{selectedFormateur ? "Enregistrer" : "Créer"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer le formateur{" "}
                <strong>
                  {selectedFormateur?.prenom} {selectedFormateur?.nom}
                </strong>{" "}
                ? Cette action est irréversible.
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
