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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { inscriptionsApi, etudiantsApi, coursApi, type Inscription, type Etudiant, type Cours } from "@/lib/api"
import { Plus, Trash2, Loader2 } from "lucide-react"

export default function InscriptionsPage() {
  const [inscriptions, setInscriptions] = useState<Inscription[]>([])
  const [etudiants, setEtudiants] = useState<Etudiant[]>([])
  const [cours, setCours] = useState<Cours[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedInscription, setSelectedInscription] = useState<Inscription | null>(null)
  const [formData, setFormData] = useState({ etudiantId: "", coursCode: "" })
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const fetchData = async () => {
    try {
      const [inscriptionsData, etudiantsData, coursData] = await Promise.all([
        inscriptionsApi.getAll(),
        etudiantsApi.getAll(),
        coursApi.getAll(),
      ])
      setInscriptions(inscriptionsData)
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
      await inscriptionsApi.create({
        etudiant: { id: Number.parseInt(formData.etudiantId) },
        cours: { code: formData.coursCode },
      })
      toast({ title: "Succès", description: "Inscription créée avec succès" })
      setDialogOpen(false)
      setFormData({ etudiantId: "", coursCode: "" })
      fetchData()
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de créer l'inscription",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedInscription) return
    try {
      await inscriptionsApi.delete(selectedInscription.id)
      toast({ title: "Succès", description: "Inscription supprimée avec succès" })
      setDeleteDialogOpen(false)
      setSelectedInscription(null)
      fetchData()
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de supprimer l'inscription", variant: "destructive" })
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("fr-FR")
  }

  const columns = [
    { key: "id", header: "ID" },
    {
      key: "etudiant",
      header: "Étudiant",
      render: (item: Inscription) => (item.etudiant ? `${item.etudiant.prenom} ${item.etudiant.nom}` : "-"),
    },
    { key: "cours", header: "Cours", render: (item: Inscription) => item.cours?.titre || "-" },
    { key: "dateInscription", header: "Date", render: (item: Inscription) => formatDate(item.dateInscription) },
    {
      key: "actions",
      header: "Actions",
      render: (item: Inscription) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setSelectedInscription(item)
            setDeleteDialogOpen(true)
          }}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Gestion des Inscriptions</h1>
            <p className="text-muted-foreground">Gérez les inscriptions aux cours</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle inscription
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Nouvelle inscription</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Étudiant</Label>
                  <Select
                    value={formData.etudiantId}
                    onValueChange={(v) => setFormData({ ...formData, etudiantId: v })}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Sélectionner un étudiant" />
                    </SelectTrigger>
                    <SelectContent>
                      {etudiants.map((e) => (
                        <SelectItem key={e.id} value={e.id.toString()}>
                          {e.prenom} {e.nom} ({e.matricule})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cours</Label>
                  <Select value={formData.coursCode} onValueChange={(v) => setFormData({ ...formData, coursCode: v })}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Sélectionner un cours" />
                    </SelectTrigger>
                    <SelectContent>
                      {cours.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.titre} ({c.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={handleCreate} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Création...
                    </>
                  ) : (
                    "Inscrire"
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
          <DataTable data={inscriptions} columns={columns} />
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la désinscription</AlertDialogTitle>
              <AlertDialogDescription>Êtes-vous sûr de vouloir supprimer cette inscription ?</AlertDialogDescription>
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
