"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { etudiantsApi, type Etudiant } from "@/lib/api"
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react"

export default function EtudiantsPage() {
  const [etudiants, setEtudiants] = useState<Etudiant[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedEtudiant, setSelectedEtudiant] = useState<Etudiant | null>(null)
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    password: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const fetchEtudiants = async () => {
    try {
      // Use the API client instead of direct fetch
      const data = await etudiantsApi.getAll()
      setEtudiants(data)
    } catch (error) {
      console.error("Error fetching etudiants:", error)
      toast({ 
        title: "Erreur", 
        description: "Impossible de charger les étudiants", 
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEtudiants()
  }, [])

  const handleCreate = async () => {
    setSubmitting(true)
    try {
      await etudiantsApi.create(formData)
      toast({ title: "Succès", description: "Étudiant créé avec succès" })
      setDialogOpen(false)
      setFormData({ nom: "", prenom: "", email: "", password: "" })
      fetchEtudiants()
    } catch (error) {
      console.error("Error creating etudiant:", error)
      toast({ title: "Erreur", description: "Impossible de créer l'étudiant", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedEtudiant) return
    setSubmitting(true)
    try {
      await etudiantsApi.update({
        id: selectedEtudiant.id,
        nom: formData.nom,
        prenom: formData.prenom,
      })
      toast({ title: "Succès", description: "Étudiant mis à jour avec succès" })
      setDialogOpen(false)
      setSelectedEtudiant(null)
      setFormData({ nom: "", prenom: "", email: "", password: "" })
      fetchEtudiants()
    } catch (error) {
      console.error("Error updating etudiant:", error)
      toast({ title: "Erreur", description: "Impossible de mettre à jour l'étudiant", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedEtudiant) return
    try {
      await etudiantsApi.delete(selectedEtudiant.id)
      toast({ title: "Succès", description: "Étudiant supprimé avec succès" })
      setDeleteDialogOpen(false)
      setSelectedEtudiant(null)
      fetchEtudiants()
    } catch (error) {
      console.error("Error deleting etudiant:", error)
      toast({ title: "Erreur", description: "Impossible de supprimer l'étudiant", variant: "destructive" })
    }
  }

  const openEditDialog = (etudiant: Etudiant) => {
    setSelectedEtudiant(etudiant)
    setFormData({
      nom: etudiant.nom,
      prenom: etudiant.prenom,
      email: etudiant.email,
      password: "",
    })
    setDialogOpen(true)
  }

  const openDeleteDialog = (etudiant: Etudiant) => {
    setSelectedEtudiant(etudiant)
    setDeleteDialogOpen(true)
  }

  const columns = [
    { key: "matricule", header: "Matricule" },
    { key: "nom", header: "Nom" },
    { key: "prenom", header: "Prénom" },
    { key: "email", header: "Email" },
    {
      key: "actif",
      header: "Statut",
      render: (item: Etudiant) => (
        <Badge variant={item.actif ? "default" : "secondary"}>{item.actif ? "Actif" : "Inactif"}</Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (item: Etudiant) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(item)}>
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
            <h1 className="text-2xl font-bold">Gestion des Étudiants</h1>
            <p className="text-muted-foreground">Gérez les comptes des étudiants</p>
          </div>
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open)
              if (!open) {
                setSelectedEtudiant(null)
                setFormData({ nom: "", prenom: "", email: "", password: "" })
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un étudiant
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>{selectedEtudiant ? "Modifier l'étudiant" : "Ajouter un étudiant"}</DialogTitle>
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
                {!selectedEtudiant && (
                  <>
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
                      <Label htmlFor="password">Mot de passe</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="bg-secondary border-border"
                      />
                    </div>
                  </>
                )}
                <Button
                  className="w-full"
                  onClick={selectedEtudiant ? handleUpdate : handleCreate}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {selectedEtudiant ? "Mise à jour..." : "Création..."}
                    </>
                  ) : selectedEtudiant ? (
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
          <DataTable data={etudiants} columns={columns} searchKey="nom" searchPlaceholder="Rechercher par nom..." />
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer l'étudiant {selectedEtudiant?.prenom} {selectedEtudiant?.nom} ? Cette
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