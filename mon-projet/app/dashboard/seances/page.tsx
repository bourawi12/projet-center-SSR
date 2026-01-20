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
import { Plus, Pencil, Trash2, Search, Calendar, Clock, MapPin } from "lucide-react"
import { toast } from "sonner"

interface Cours {
  id: number
  code: string
  titre: string
}

interface Groupe {
  id: number
  nom: string
}

interface Seance {
  id: number
  date: string
  heureDebut: string
  heureFin: string
  salle: string
  cours?: Cours
  groupe?: Groupe
}

export default function SeancesPage() {
  const [seances, setSeances] = useState<Seance[]>([])
  const [cours, setCours] = useState<Cours[]>([])
  const [groupes, setGroupes] = useState<Groupe[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedSeance, setSelectedSeance] = useState<Seance | null>(null)
  const [formData, setFormData] = useState({
    date: "",
    heureDebut: "",
    heureFin: "",
    salle: "",
    coursId: "",
    groupeId: "",
  })

  useEffect(() => {
    fetchSeances()
    fetchCours()
    fetchGroupes()
  }, [])

  const fetchSeances = async () => {
    try {
      const response = await api.get("/api/seances")
      setSeances(response.data)
    } catch (error) {
      toast.error("Erreur lors du chargement des séances")
    } finally {
      setLoading(false)
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

  const fetchGroupes = async () => {
    try {
      const response = await api.get("/api/groupes")
      setGroupes(response.data)
    } catch (error) {
      console.error("Error fetching groupes:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        date: formData.date,
        heureDebut: formData.heureDebut,
        heureFin: formData.heureFin,
        salle: formData.salle,
        cours: formData.coursId ? { id: Number.parseInt(formData.coursId) } : null,
        groupe: formData.groupeId ? { id: Number.parseInt(formData.groupeId) } : null,
      }

      if (selectedSeance) {
        await api.put(`/api/seances/${selectedSeance.id}`, payload)
        toast.success("Séance modifiée avec succès")
      } else {
        await api.post("/api/seances", payload)
        toast.success("Séance créée avec succès")
      }
      setIsDialogOpen(false)
      fetchSeances()
      resetForm()
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement")
    }
  }

  const handleEdit = (seance: Seance) => {
    setSelectedSeance(seance)
    setFormData({
      date: seance.date,
      heureDebut: seance.heureDebut,
      heureFin: seance.heureFin,
      salle: seance.salle,
      coursId: seance.cours?.id?.toString() || "",
      groupeId: seance.groupe?.id?.toString() || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedSeance) return
    try {
      await api.delete(`/api/seances/${selectedSeance.id}`)
      toast.success("Séance supprimée avec succès")
      setIsDeleteDialogOpen(false)
      fetchSeances()
    } catch (error) {
      toast.error("Erreur lors de la suppression")
    }
  }

  const resetForm = () => {
    setSelectedSeance(null)
    setFormData({
      date: "",
      heureDebut: "",
      heureFin: "",
      salle: "",
      coursId: "",
      groupeId: "",
    })
  }

  const filteredSeances = seances.filter(
    (s) =>
      s.cours?.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.salle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.groupe?.nom.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const columns = [
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (seance: Seance) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          {new Date(seance.date).toLocaleDateString("fr-FR")}
        </div>
      ),
    },
    {
      key: "horaire",
      label: "Horaire",
      render: (seance: Seance) => (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          {seance.heureDebut} - {seance.heureFin}
        </div>
      ),
    },
    {
      key: "cours",
      label: "Cours",
      render: (seance: Seance) => seance.cours?.titre || "-",
    },
    {
      key: "groupe",
      label: "Groupe",
      render: (seance: Seance) => seance.groupe?.nom || "-",
    },
    {
      key: "salle",
      label: "Salle",
      render: (seance: Seance) => (
        <Badge variant="outline">
          <MapPin className="h-3 w-3 mr-1" />
          {seance.salle}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (seance: Seance) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(seance)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedSeance(seance)
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
            <h1 className="text-3xl font-bold text-foreground">Gestion des Séances</h1>
            <p className="text-muted-foreground mt-1">
              {seances.length} séance{seances.length > 1 ? "s" : ""} programmée{seances.length > 1 ? "s" : ""}
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm()
              setIsDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle séance
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher une séance..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <DataTable columns={columns} data={filteredSeances} loading={loading} emptyMessage="Aucune séance trouvée" />

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{selectedSeance ? "Modifier la séance" : "Nouvelle séance"}</DialogTitle>
              <DialogDescription>
                {selectedSeance ? "Modifiez les informations de la séance" : "Planifiez une nouvelle séance de cours"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="cours">Cours</Label>
                  <Select
                    value={formData.coursId}
                    onValueChange={(value) => setFormData({ ...formData, coursId: value })}
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
                <div className="grid gap-2">
                  <Label htmlFor="groupe">Groupe</Label>
                  <Select
                    value={formData.groupeId}
                    onValueChange={(value) => setFormData({ ...formData, groupeId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un groupe" />
                    </SelectTrigger>
                    <SelectContent>
                      {groupes.map((g) => (
                        <SelectItem key={g.id} value={g.id.toString()}>
                          {g.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="heureDebut">Heure de début</Label>
                    <Input
                      id="heureDebut"
                      type="time"
                      value={formData.heureDebut}
                      onChange={(e) => setFormData({ ...formData, heureDebut: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="heureFin">Heure de fin</Label>
                    <Input
                      id="heureFin"
                      type="time"
                      value={formData.heureFin}
                      onChange={(e) => setFormData({ ...formData, heureFin: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="salle">Salle</Label>
                  <Input
                    id="salle"
                    value={formData.salle}
                    onChange={(e) => setFormData({ ...formData, salle: e.target.value })}
                    placeholder="ex: Salle 101"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">{selectedSeance ? "Enregistrer" : "Créer"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer cette séance ? Cette action est irréversible.
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
