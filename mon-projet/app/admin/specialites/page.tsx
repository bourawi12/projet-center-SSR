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
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { specialitesApi, type Specialite } from "@/lib/api"
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react"

export default function SpecialitesPage() {
  const [specialites, setSpecialites] = useState<Specialite[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedSpecialite, setSelectedSpecialite] = useState<Specialite | null>(null)
  const [formData, setFormData] = useState({ nom: "", description: "" })
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const fetchData = async () => {
    try {
      const data = await specialitesApi.getAll()
      setSpecialites(data)
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de charger", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      if (selectedSpecialite) {
        await specialitesApi.update(selectedSpecialite.id, formData)
        toast({ title: "Succès", description: "Spécialité mise à jour" })
      } else {
        await specialitesApi.create(formData)
        toast({ title: "Succès", description: "Spécialité créée" })
      }
      setDialogOpen(false)
      setSelectedSpecialite(null)
      setFormData({ nom: "", description: "" })
      fetchData()
    } catch (error) {
      toast({ title: "Erreur", description: "Opération échouée", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedSpecialite) return
    try {
      await specialitesApi.delete(selectedSpecialite.id)
      toast({ title: "Succès", description: "Supprimée" })
      setDeleteDialogOpen(false)
      setSelectedSpecialite(null)
      fetchData()
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" })
    }
  }

  const columns = [
    { key: "id", header: "ID" },
    { key: "nom", header: "Nom" },
    { key: "description", header: "Description", render: (item: Specialite) => item.description || "-" },
    {
      key: "actions",
      header: "Actions",
      render: (item: Specialite) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedSpecialite(item)
              setFormData({ nom: item.nom, description: item.description || "" })
              setDialogOpen(true)
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedSpecialite(item)
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
            <h1 className="text-2xl font-bold">Spécialités</h1>
            <p className="text-muted-foreground">Gérez les spécialités</p>
          </div>
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open)
              if (!open) {
                setSelectedSpecialite(null)
                setFormData({ nom: "", description: "" })
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>{selectedSpecialite ? "Modifier" : "Créer"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {selectedSpecialite ? "Mettre à jour" : "Créer"}
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
          <DataTable data={specialites} columns={columns} searchKey="nom" />
        )}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer</AlertDialogTitle>
              <AlertDialogDescription>Supprimer ?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive">
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  )
}
