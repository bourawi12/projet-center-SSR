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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { coursApi, formateursApi, type Cours, type Formateur } from "@/lib/api"
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react"

export default function CoursPage() {
  const [cours, setCours] = useState<Cours[]>([])
  const [formateurs, setFormateurs] = useState<Formateur[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedCours, setSelectedCours] = useState<Cours | null>(null)
  const [formData, setFormData] = useState({ titre: "", description: "", formateurId: "", actif: true })
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const fetchData = async () => {
    try {
      const [coursData, formateursData] = await Promise.all([coursApi.getAll(), formateursApi.getAll()])
      setCours(coursData)
      setFormateurs(formateursData)
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
      await coursApi.create({
        titre: formData.titre,
        description: formData.description,
        actif: formData.actif,
        formateur: formData.formateurId ? ({ id: Number.parseInt(formData.formateurId) } as Formateur) : undefined,
      })
      toast({ title: "Succès", description: "Cours créé avec succès" })
      setDialogOpen(false)
      resetForm()
      fetchData()
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de créer le cours", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedCours) return
    setSubmitting(true)
    try {
      await coursApi.update(selectedCours.code, {
        titre: formData.titre,
        actif: formData.actif,
        formateur: formData.formateurId ? ({ id: Number.parseInt(formData.formateurId) } as Formateur) : undefined,
      })
      toast({ title: "Succès", description: "Cours mis à jour avec succès" })
      setDialogOpen(false)
      setSelectedCours(null)
      resetForm()
      fetchData()
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de mettre à jour le cours", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedCours) return
    try {
      await coursApi.delete(selectedCours.code)
      toast({ title: "Succès", description: "Cours supprimé avec succès" })
      setDeleteDialogOpen(false)
      setSelectedCours(null)
      fetchData()
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de supprimer le cours", variant: "destructive" })
    }
  }

  const resetForm = () => {
    setFormData({ titre: "", description: "", formateurId: "", actif: true })
  }

  const openEditDialog = (c: Cours) => {
    setSelectedCours(c)
    setFormData({
      titre: c.titre,
      description: c.description || "",
      formateurId: c.formateur?.id?.toString() || "",
      actif: c.actif,
    })
    setDialogOpen(true)
  }

  const columns = [
    { key: "code", header: "Code" },
    { key: "titre", header: "Titre" },
    {
      key: "formateur",
      header: "Formateur",
      render: (item: Cours) => (item.formateur ? `${item.formateur.prenom} ${item.formateur.nom}` : "-"),
    },
    {
      key: "actif",
      header: "Statut",
      render: (item: Cours) => (
        <Badge variant={item.actif ? "default" : "secondary"}>{item.actif ? "Actif" : "Inactif"}</Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (item: Cours) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedCours(item)
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
            <h1 className="text-2xl font-bold">Gestion des Cours</h1>
            <p className="text-muted-foreground">Gérez les cours et leurs formateurs</p>
          </div>
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open)
              if (!open) {
                setSelectedCours(null)
                resetForm()
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un cours
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>{selectedCours ? "Modifier le cours" : "Ajouter un cours"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="titre">Titre</Label>
                  <Input
                    id="titre"
                    value={formData.titre}
                    onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                {!selectedCours && (
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="formateur">Formateur</Label>
                  <Select
                    value={formData.formateurId}
                    onValueChange={(value) => setFormData({ ...formData, formateurId: value })}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Sélectionner un formateur" />
                    </SelectTrigger>
                    <SelectContent>
                      {formateurs.map((f) => (
                        <SelectItem key={f.id} value={f.id.toString()}>
                          {f.prenom} {f.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="actif"
                    checked={formData.actif}
                    onCheckedChange={(checked) => setFormData({ ...formData, actif: checked })}
                  />
                  <Label htmlFor="actif">Actif</Label>
                </div>
                <Button className="w-full" onClick={selectedCours ? handleUpdate : handleCreate} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {selectedCours ? "Mise à jour..." : "Création..."}
                    </>
                  ) : selectedCours ? (
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
          <DataTable data={cours} columns={columns} searchKey="titre" searchPlaceholder="Rechercher par titre..." />
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer le cours "{selectedCours?.titre}" ?
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
