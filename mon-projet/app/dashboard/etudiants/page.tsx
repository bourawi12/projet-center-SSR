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
import { Plus, Pencil, Trash2, Search, UserCheck, UserX } from "lucide-react"
import { toast } from "sonner"

interface Specialite {
  id: number
  nom: string
}

interface Etudiant {
  id: number
  matricule: string
  nom: string
  prenom: string
  email: string
  actif: boolean
  specialite?: Specialite
}

export default function EtudiantsPage() {
  const [etudiants, setEtudiants] = useState<Etudiant[]>([])
  const [specialites, setSpecialites] = useState<Specialite[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedEtudiant, setSelectedEtudiant] = useState<Etudiant | null>(null)
  const [formData, setFormData] = useState({
    matricule: "",
    nom: "",
    prenom: "",
    email: "",
    actif: true,
    specialiteId: "",
  })

  useEffect(() => {
    fetchEtudiants()
    fetchSpecialites()
  }, [])

  const fetchEtudiants = async () => {
    try {
      const response = await api.get("/api/etudiants")
      setEtudiants(response.data)
    } catch (error) {
      toast.error("Erreur lors du chargement des étudiants")
    } finally {
      setLoading(false)
    }
  }

  const fetchSpecialites = async () => {
    try {
      const response = await api.get("/api/specialites")
      setSpecialites(response.data)
    } catch (error) {
      console.error("Error fetching specialites:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        specialite: formData.specialiteId ? { id: Number.parseInt(formData.specialiteId) } : null,
      }

      if (selectedEtudiant) {
        await api.put(`/api/etudiants/${selectedEtudiant.id}`, payload)
        toast.success("Étudiant modifié avec succès")
      } else {
        await api.post("/api/etudiants", payload)
        toast.success("Étudiant créé avec succès")
      }
      setIsDialogOpen(false)
      fetchEtudiants()
      resetForm()
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement")
    }
  }

  const handleEdit = (etudiant: Etudiant) => {
    setSelectedEtudiant(etudiant)
    setFormData({
      matricule: etudiant.matricule,
      nom: etudiant.nom,
      prenom: etudiant.prenom,
      email: etudiant.email,
      actif: etudiant.actif,
      specialiteId: etudiant.specialite?.id?.toString() || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedEtudiant) return
    try {
      await api.delete(`/api/etudiants/${selectedEtudiant.id}`)
      toast.success("Étudiant supprimé avec succès")
      setIsDeleteDialogOpen(false)
      fetchEtudiants()
    } catch (error) {
      toast.error("Erreur lors de la suppression")
    }
  }

  const toggleActif = async (etudiant: Etudiant) => {
    try {
      await api.put(`/api/etudiants/${etudiant.id}`, {
        ...etudiant,
        actif: !etudiant.actif,
        specialite: etudiant.specialite,
      })
      toast.success(`Étudiant ${etudiant.actif ? "désactivé" : "activé"}`)
      fetchEtudiants()
    } catch (error) {
      toast.error("Erreur lors de la mise à jour")
    }
  }

  const resetForm = () => {
    setSelectedEtudiant(null)
    setFormData({
      matricule: "",
      nom: "",
      prenom: "",
      email: "",
      actif: true,
      specialiteId: "",
    })
  }

  const filteredEtudiants = etudiants.filter(
    (e) =>
      e.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const columns = [
    { key: "matricule", label: "Matricule", sortable: true },
    { key: "nom", label: "Nom", sortable: true },
    { key: "prenom", label: "Prénom", sortable: true },
    { key: "email", label: "Email", sortable: true },
    {
      key: "specialite",
      label: "Spécialité",
      render: (etudiant: Etudiant) => etudiant.specialite?.nom || "-",
    },
    {
      key: "actif",
      label: "Statut",
      render: (etudiant: Etudiant) => (
        <Badge variant={etudiant.actif ? "default" : "secondary"}>{etudiant.actif ? "Actif" : "Inactif"}</Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (etudiant: Etudiant) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleActif(etudiant)}
            title={etudiant.actif ? "Désactiver" : "Activer"}
          >
            {etudiant.actif ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleEdit(etudiant)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedEtudiant(etudiant)
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
            <h1 className="text-3xl font-bold text-foreground">Gestion des Étudiants</h1>
            <p className="text-muted-foreground mt-1">
              {etudiants.length} étudiant{etudiants.length > 1 ? "s" : ""} enregistré{etudiants.length > 1 ? "s" : ""}
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm()
              setIsDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nouvel étudiant
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un étudiant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <DataTable columns={columns} data={filteredEtudiants} loading={loading} emptyMessage="Aucun étudiant trouvé" />

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{selectedEtudiant ? "Modifier l'étudiant" : "Nouvel étudiant"}</DialogTitle>
              <DialogDescription>
                {selectedEtudiant
                  ? "Modifiez les informations de l'étudiant"
                  : "Remplissez les informations du nouvel étudiant"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="matricule">Matricule</Label>
                  <Input
                    id="matricule"
                    value={formData.matricule}
                    onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
                    required
                  />
                </div>
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
                  <Select
                    value={formData.specialiteId}
                    onValueChange={(value) => setFormData({ ...formData, specialiteId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une spécialité" />
                    </SelectTrigger>
                    <SelectContent>
                      {specialites.map((specialite) => (
                        <SelectItem key={specialite.id} value={specialite.id.toString()}>
                          {specialite.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="actif"
                    checked={formData.actif}
                    onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                    className="h-4 w-4 rounded border-input"
                  />
                  <Label htmlFor="actif">Étudiant actif</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">{selectedEtudiant ? "Enregistrer" : "Créer"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer l'étudiant{" "}
                <strong>
                  {selectedEtudiant?.prenom} {selectedEtudiant?.nom}
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
