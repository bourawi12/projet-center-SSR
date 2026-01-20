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
import { useToast } from "@/hooks/use-toast"
import { formateursApi, type Formateur } from "@/lib/api"
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react"

export default function FormateursPage() {
  const [formateurs, setFormateurs] = useState<Formateur[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedFormateur, setSelectedFormateur] = useState<Formateur | null>(null)
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    specialite: "",
    username: "",
    password: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const fetchFormateurs = async () => {
    try {
      const data = await formateursApi.getAll()
      setFormateurs(data)
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de charger les formateurs", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFormateurs()
  }, [])

  const handleCreate = async () => {
    setSubmitting(true)
    try {
      await formateursApi.create({
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        specialite: formData.specialite,
        user: {
          username: formData.email,
          password: formData.password,
        },
      } as Formateur)
      toast({ title: "Succès", description: "Formateur créé avec succès" })
      setDialogOpen(false)
      resetForm()
      fetchFormateurs()
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de créer le formateur", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedFormateur) return
    setSubmitting(true)
    try {
      await formateursApi.update(selectedFormateur.id, {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        specialite: formData.specialite,
      })
      toast({ title: "Succès", description: "Formateur mis à jour avec succès" })
      setDialogOpen(false)
      setSelectedFormateur(null)
      resetForm()
      fetchFormateurs()
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de mettre à jour le formateur", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedFormateur) return
    try {
      await formateursApi.delete(selectedFormateur.id)
      toast({ title: "Succès", description: "Formateur supprimé avec succès" })
      setDeleteDialogOpen(false)
      setSelectedFormateur(null)
      fetchFormateurs()
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de supprimer le formateur", variant: "destructive" })
    }
  }

  const resetForm = () => {
    setFormData({ nom: "", prenom: "", email: "", specialite: "", username: "", password: "" })
  }

  const openEditDialog = (formateur: Formateur) => {
    setSelectedFormateur(formateur)
    setFormData({
      nom: formateur.nom,
      prenom: formateur.prenom,
      email: formateur.email,
      specialite: formateur.specialite,
      username: "",
      password: "",
    })
    setDialogOpen(true)
  }

  const columns = [
    { key: "id", header: "ID" },
    { key: "nom", header: "Nom" },
    { key: "prenom", header: "Prénom" },
    { key: "email", header: "Email" },
    { key: "specialite", header: "Spécialité" },
    {
      key: "actions",
      header: "Actions",
      render: (item: Formateur) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedFormateur(item)
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
            <h1 className="text-2xl font-bold">Gestion des Formateurs</h1>
            <p className="text-muted-foreground">Gérez les comptes des formateurs</p>
          </div>
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open)
              if (!open) {
                setSelectedFormateur(null)
                resetForm()
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un formateur
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>{selectedFormateur ? "Modifier le formateur" : "Ajouter un formateur"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prenom">Prénom</Label>
                    <Input
                      id="prenom"
                      value={formData.prenom}
                      onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nom">Nom</Label>
                    <Input
                      id="nom"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialite">Spécialité</Label>
                  <Input
                    id="specialite"
                    value={formData.specialite}
                    onChange={(e) => setFormData({ ...formData, specialite: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                {!selectedFormateur && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                )}
                <Button
                  className="w-full"
                  onClick={selectedFormateur ? handleUpdate : handleCreate}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {selectedFormateur ? "Mise à jour..." : "Création..."}
                    </>
                  ) : selectedFormateur ? (
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
          <DataTable data={formateurs} columns={columns} searchKey="nom" searchPlaceholder="Rechercher par nom..." />
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer le formateur {selectedFormateur?.prenom} {selectedFormateur?.nom} ?
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
