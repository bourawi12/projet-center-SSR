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
import { Plus, Pencil, Trash2, Search, Eye, Users } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface SessionPedagogique {
  id: number
  semestre: string
  anneeScolaire: string
}

interface Specialite {
  id: number
  nom: string
}

interface Cours {
  id: number
  titre: string
  code: string
}

interface Groupe {
  id: number
  nom: string
  session?: SessionPedagogique
  specialite?: Specialite
  cours: Cours[]
  etudiants: { id: number }[]
}

export default function GroupesPage() {
  const [groupes, setGroupes] = useState<Groupe[]>([])
  const [sessions, setSessions] = useState<SessionPedagogique[]>([])
  const [specialites, setSpecialites] = useState<Specialite[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedGroupe, setSelectedGroupe] = useState<Groupe | null>(null)
  const [formData, setFormData] = useState({
    nom: "",
    sessionId: "",
    specialiteId: "",
  })

  useEffect(() => {
    fetchGroupes()
    fetchSessions()
    fetchSpecialites()
  }, [])

  const fetchGroupes = async () => {
    try {
      const response = await api.get("/api/groupes")
      setGroupes(response.data)
    } catch (error) {
      toast.error("Erreur lors du chargement des groupes")
    } finally {
      setLoading(false)
    }
  }

  const fetchSessions = async () => {
    try {
      const response = await api.get("/api/sessions")
      setSessions(response.data)
    } catch (error) {
      console.error("Error fetching sessions:", error)
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
        nom: formData.nom,
        session: formData.sessionId ? { id: Number.parseInt(formData.sessionId) } : null,
        specialite: formData.specialiteId ? { id: Number.parseInt(formData.specialiteId) } : null,
      }

      if (selectedGroupe) {
        await api.put(`/api/groupes/${selectedGroupe.id}`, payload)
        toast.success("Groupe modifié avec succès")
      } else {
        await api.post("/api/groupes", payload)
        toast.success("Groupe créé avec succès")
      }
      setIsDialogOpen(false)
      fetchGroupes()
      resetForm()
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement")
    }
  }

  const handleEdit = (groupe: Groupe) => {
    setSelectedGroupe(groupe)
    setFormData({
      nom: groupe.nom,
      sessionId: groupe.session?.id?.toString() || "",
      specialiteId: groupe.specialite?.id?.toString() || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedGroupe) return
    try {
      await api.delete(`/api/groupes/${selectedGroupe.id}`)
      toast.success("Groupe supprimé avec succès")
      setIsDeleteDialogOpen(false)
      fetchGroupes()
    } catch (error) {
      toast.error("Erreur lors de la suppression")
    }
  }

  const resetForm = () => {
    setSelectedGroupe(null)
    setFormData({
      nom: "",
      sessionId: "",
      specialiteId: "",
    })
  }

  const filteredGroupes = groupes.filter((g) => g.nom.toLowerCase().includes(searchTerm.toLowerCase()))

  const columns = [
    { key: "nom", label: "Nom", sortable: true },
    {
      key: "session",
      label: "Session",
      render: (groupe: Groupe) =>
        groupe.session ? `${groupe.session.semestre} - ${groupe.session.anneeScolaire}` : "-",
    },
    {
      key: "specialite",
      label: "Spécialité",
      render: (groupe: Groupe) => groupe.specialite?.nom || "-",
    },
    {
      key: "etudiants",
      label: "Étudiants",
      render: (groupe: Groupe) => (
        <Badge variant="secondary">
          <Users className="h-3 w-3 mr-1" />
          {groupe.etudiants?.length || 0}
        </Badge>
      ),
    },
    {
      key: "cours",
      label: "Cours",
      render: (groupe: Groupe) => <Badge variant="outline">{groupe.cours?.length || 0} cours</Badge>,
    },
    {
      key: "actions",
      label: "Actions",
      render: (groupe: Groupe) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/groupes/${groupe.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleEdit(groupe)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedGroupe(groupe)
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
            <h1 className="text-3xl font-bold text-foreground">Gestion des Groupes</h1>
            <p className="text-muted-foreground mt-1">
              {groupes.length} groupe{groupes.length > 1 ? "s" : ""} enregistré{groupes.length > 1 ? "s" : ""}
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm()
              setIsDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nouveau groupe
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un groupe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <DataTable columns={columns} data={filteredGroupes} loading={loading} emptyMessage="Aucun groupe trouvé" />

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{selectedGroupe ? "Modifier le groupe" : "Nouveau groupe"}</DialogTitle>
              <DialogDescription>
                {selectedGroupe
                  ? "Modifiez les informations du groupe"
                  : "Remplissez les informations du nouveau groupe"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nom">Nom du groupe</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    placeholder="ex: Groupe A"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="session">Session pédagogique</Label>
                  <Select
                    value={formData.sessionId}
                    onValueChange={(value) => setFormData({ ...formData, sessionId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une session" />
                    </SelectTrigger>
                    <SelectContent>
                      {sessions.map((session) => (
                        <SelectItem key={session.id} value={session.id.toString()}>
                          {session.semestre} - {session.anneeScolaire}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">{selectedGroupe ? "Enregistrer" : "Créer"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer le groupe <strong>{selectedGroupe?.nom}</strong> ? Cette action est
                irréversible.
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
