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
import { Plus, Trash2, Search, Calendar } from "lucide-react"
import { toast } from "sonner"

interface Etudiant {
  id: number
  matricule: string
  nom: string
  prenom: string
}

interface Cours {
  id: number
  code: string
  titre: string
}

interface Inscription {
  id: number
  dateInscription: string
  etudiant: Etudiant
  cours: Cours
}

export default function InscriptionsPage() {
  const [inscriptions, setInscriptions] = useState<Inscription[]>([])
  const [etudiants, setEtudiants] = useState<Etudiant[]>([])
  const [cours, setCours] = useState<Cours[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedInscription, setSelectedInscription] = useState<Inscription | null>(null)
  const [formData, setFormData] = useState({
    etudiantId: "",
    coursId: "",
    dateInscription: new Date().toISOString().split("T")[0],
  })

  useEffect(() => {
    fetchInscriptions()
    fetchEtudiants()
    fetchCours()
  }, [])

  const fetchInscriptions = async () => {
    try {
      const response = await api.get("/api/inscriptions")
      setInscriptions(response.data)
    } catch (error) {
      toast.error("Erreur lors du chargement des inscriptions")
    } finally {
      setLoading(false)
    }
  }

  const fetchEtudiants = async () => {
    try {
      const response = await api.get("/api/etudiants")
      setEtudiants(response.data)
    } catch (error) {
      console.error("Error fetching etudiants:", error)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        dateInscription: formData.dateInscription,
        etudiant: { id: Number.parseInt(formData.etudiantId) },
        cours: { id: Number.parseInt(formData.coursId) },
      }

      await api.post("/api/inscriptions", payload)
      toast.success("Inscription créée avec succès")
      setIsDialogOpen(false)
      fetchInscriptions()
      resetForm()
    } catch (error: unknown) {
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: { message?: string } } }
        toast.error(axiosError.response?.data?.message || "Erreur lors de l'inscription")
      } else {
        toast.error("Erreur lors de l'inscription")
      }
    }
  }

  const handleDelete = async () => {
    if (!selectedInscription) return
    try {
      await api.delete(`/api/inscriptions/${selectedInscription.id}`)
      toast.success("Inscription supprimée avec succès")
      setIsDeleteDialogOpen(false)
      fetchInscriptions()
    } catch (error) {
      toast.error("Erreur lors de la suppression")
    }
  }

  const resetForm = () => {
    setSelectedInscription(null)
    setFormData({
      etudiantId: "",
      coursId: "",
      dateInscription: new Date().toISOString().split("T")[0],
    })
  }

  const filteredInscriptions = inscriptions.filter(
    (i) =>
      i.etudiant.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.etudiant.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.cours.titre.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const columns = [
    {
      key: "etudiant",
      label: "Étudiant",
      sortable: true,
      render: (inscription: Inscription) => (
        <div>
          <p className="font-medium">
            {inscription.etudiant.prenom} {inscription.etudiant.nom}
          </p>
          <p className="text-sm text-muted-foreground">{inscription.etudiant.matricule}</p>
        </div>
      ),
    },
    {
      key: "cours",
      label: "Cours",
      sortable: true,
      render: (inscription: Inscription) => (
        <div>
          <p className="font-medium">{inscription.cours.titre}</p>
          <p className="text-sm text-muted-foreground">{inscription.cours.code}</p>
        </div>
      ),
    },
    {
      key: "dateInscription",
      label: "Date d'inscription",
      sortable: true,
      render: (inscription: Inscription) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          {new Date(inscription.dateInscription).toLocaleDateString("fr-FR")}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (inscription: Inscription) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setSelectedInscription(inscription)
            setIsDeleteDialogOpen(true)
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestion des Inscriptions</h1>
            <p className="text-muted-foreground mt-1">
              {inscriptions.length} inscription{inscriptions.length > 1 ? "s" : ""} enregistrée
              {inscriptions.length > 1 ? "s" : ""}
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm()
              setIsDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle inscription
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par étudiant ou cours..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredInscriptions}
          loading={loading}
          emptyMessage="Aucune inscription trouvée"
        />

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Nouvelle inscription</DialogTitle>
              <DialogDescription>Inscrire un étudiant à un cours</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="etudiant">Étudiant</Label>
                  <Select
                    value={formData.etudiantId}
                    onValueChange={(value) => setFormData({ ...formData, etudiantId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un étudiant" />
                    </SelectTrigger>
                    <SelectContent>
                      {etudiants.map((etudiant) => (
                        <SelectItem key={etudiant.id} value={etudiant.id.toString()}>
                          {etudiant.prenom} {etudiant.nom} ({etudiant.matricule})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                  <Label htmlFor="date">Date d'inscription</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.dateInscription}
                    onChange={(e) => setFormData({ ...formData, dateInscription: e.target.value })}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">Inscrire</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la désinscription</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir désinscrire{" "}
                <strong>
                  {selectedInscription?.etudiant.prenom} {selectedInscription?.etudiant.nom}
                </strong>{" "}
                du cours <strong>{selectedInscription?.cours.titre}</strong> ? Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Désinscrire
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  )
}
