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
import { seancesApi, coursApi, groupesApi, type Seance, type Cours, type Groupe } from "@/lib/api"
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react"

export default function SeancesPage() {
  const [seances, setSeances] = useState<Seance[]>([])
  const [cours, setCours] = useState<Cours[]>([])
  const [groupes, setGroupes] = useState<Groupe[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedSeance, setSelectedSeance] = useState<Seance | null>(null)
  const [formData, setFormData] = useState({
    coursCode: "",
    groupeId: "",
    dateSeance: "",
    heureDebut: "",
    heureFin: "",
    salle: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const fetchData = async () => {
    try {
      const [seancesResult, coursResult, groupesResult] = await Promise.allSettled([
        seancesApi.getAll(),
        coursApi.getAll(),
        groupesApi.getAll(),
      ])

      if (seancesResult.status === "fulfilled") {
        setSeances(seancesResult.value)
      } else {
        toast({ title: "Erreur", description: "Impossible de charger les sÇ¸ances", variant: "destructive" })
      }

      if (coursResult.status === "fulfilled") {
        setCours(coursResult.value)
      } else {
        toast({ title: "Erreur", description: "Impossible de charger les cours", variant: "destructive" })
      }

      if (groupesResult.status === "fulfilled") {
        setGroupes(groupesResult.value)
      } else {
        toast({ title: "Erreur", description: "Impossible de charger les groupes", variant: "destructive" })
      }
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
      const payload = {
        cours: { code: formData.coursCode } as Cours,
        groupe: formData.groupeId ? ({ id: Number.parseInt(formData.groupeId) } as Groupe) : undefined,
        dateSeance: formData.dateSeance,
        heureDebut: formData.heureDebut,
        heureFin: formData.heureFin,
        salle: formData.salle,
      }
      if (selectedSeance) {
        await seancesApi.update(selectedSeance.id, payload)
        toast({ title: "Succès", description: "Séance mise à jour" })
      } else {
        await seancesApi.create(payload)
        toast({ title: "Succès", description: "Séance créée" })
      }
      setDialogOpen(false)
      setSelectedSeance(null)
      resetForm()
      fetchData()
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Opération échouée",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedSeance) return
    try {
      await seancesApi.delete(selectedSeance.id)
      toast({ title: "Succès", description: "Séance supprimée" })
      setDeleteDialogOpen(false)
      setSelectedSeance(null)
      fetchData()
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" })
    }
  }

  const resetForm = () =>
    setFormData({ coursCode: "", groupeId: "", dateSeance: "", heureDebut: "", heureFin: "", salle: "" })

  const openEditDialog = (seance: Seance) => {
    setSelectedSeance(seance)
    setFormData({
      coursCode: seance.cours?.code || "",
      groupeId: seance.groupe?.id?.toString() || "",
      dateSeance: seance.dateSeance,
      heureDebut: seance.heureDebut,
      heureFin: seance.heureFin,
      salle: seance.salle,
    })
    setDialogOpen(true)
  }

  const columns = [
    { key: "id", header: "ID" },
    { key: "cours", header: "Cours", render: (item: Seance) => item.cours?.titre || "-" },
    { key: "groupe", header: "Groupe", render: (item: Seance) => item.groupe?.nom || "Tous" },
    { key: "dateSeance", header: "Date" },
    { key: "heureDebut", header: "Début" },
    { key: "heureFin", header: "Fin" },
    { key: "salle", header: "Salle" },
    {
      key: "actions",
      header: "Actions",
      render: (item: Seance) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedSeance(item)
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
            <h1 className="text-2xl font-bold">Séances</h1>
            <p className="text-muted-foreground">Gérez les séances de cours</p>
          </div>
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open)
              if (!open) {
                setSelectedSeance(null)
                resetForm()
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle séance
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>{selectedSeance ? "Modifier" : "Créer"} une séance</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Cours</Label>
                  <Select value={formData.coursCode} onValueChange={(v) => setFormData({ ...formData, coursCode: v })}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {cours.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.titre || c.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Groupe (optionnel)</Label>
                  <Select value={formData.groupeId} onValueChange={(v) => setFormData({ ...formData, groupeId: v })}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Tous les étudiants" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Tous les étudiants</SelectItem>
                      {groupes.map((g) => (
                        <SelectItem key={g.id} value={g.id.toString()}>
                          {g.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={formData.dateSeance}
                    onChange={(e) => setFormData({ ...formData, dateSeance: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Heure début</Label>
                    <Input
                      type="time"
                      value={formData.heureDebut}
                      onChange={(e) => setFormData({ ...formData, heureDebut: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Heure fin</Label>
                    <Input
                      type="time"
                      value={formData.heureFin}
                      onChange={(e) => setFormData({ ...formData, heureFin: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Salle</Label>
                  <Input
                    value={formData.salle}
                    onChange={(e) => setFormData({ ...formData, salle: e.target.value })}
                    placeholder="A101"
                    className="bg-secondary border-border"
                  />
                </div>
                <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {selectedSeance ? "Mettre à jour" : "Créer"}
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
          <DataTable data={seances} columns={columns} />
        )}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer</AlertDialogTitle>
              <AlertDialogDescription>Supprimer cette séance ?</AlertDialogDescription>
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
