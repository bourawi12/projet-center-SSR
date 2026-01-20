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
import { Plus, Pencil, Trash2, Search } from "lucide-react"
import { toast } from "sonner"

interface SessionPedagogique {
  id: number
  semestre: string
  anneeScolaire: string
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionPedagogique[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedSession, setSelectedSession] = useState<SessionPedagogique | null>(null)
  const [formData, setFormData] = useState({
    semestre: "",
    anneeScolaire: "",
  })

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const response = await api.get("/api/sessions")
      setSessions(response.data)
    } catch (error) {
      toast.error("Erreur lors du chargement des sessions")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (selectedSession) {
        await api.put(`/api/sessions/${selectedSession.id}`, formData)
        toast.success("Session modifiée avec succès")
      } else {
        await api.post("/api/sessions", formData)
        toast.success("Session créée avec succès")
      }
      setIsDialogOpen(false)
      fetchSessions()
      resetForm()
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement")
    }
  }

  const handleEdit = (session: SessionPedagogique) => {
    setSelectedSession(session)
    setFormData({
      semestre: session.semestre,
      anneeScolaire: session.anneeScolaire,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedSession) return
    try {
      await api.delete(`/api/sessions/${selectedSession.id}`)
      toast.success("Session supprimée avec succès")
      setIsDeleteDialogOpen(false)
      fetchSessions()
    } catch (error) {
      toast.error("Erreur lors de la suppression")
    }
  }

  const resetForm = () => {
    setSelectedSession(null)
    setFormData({
      semestre: "",
      anneeScolaire: "",
    })
  }

  const filteredSessions = sessions.filter(
    (s) =>
      s.semestre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.anneeScolaire.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const columns = [
    { key: "semestre", label: "Semestre", sortable: true },
    { key: "anneeScolaire", label: "Année scolaire", sortable: true },
    {
      key: "actions",
      label: "Actions",
      render: (session: SessionPedagogique) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(session)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedSession(session)
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
            <h1 className="text-3xl font-bold text-foreground">Sessions Pédagogiques</h1>
            <p className="text-muted-foreground mt-1">
              {sessions.length} session{sessions.length > 1 ? "s" : ""} enregistrée{sessions.length > 1 ? "s" : ""}
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm()
              setIsDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle session
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher une session..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <DataTable columns={columns} data={filteredSessions} loading={loading} emptyMessage="Aucune session trouvée" />

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{selectedSession ? "Modifier la session" : "Nouvelle session"}</DialogTitle>
              <DialogDescription>
                {selectedSession
                  ? "Modifiez les informations de la session"
                  : "Remplissez les informations de la nouvelle session"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="semestre">Semestre</Label>
                  <Input
                    id="semestre"
                    value={formData.semestre}
                    onChange={(e) => setFormData({ ...formData, semestre: e.target.value })}
                    placeholder="ex: Semestre 1"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="anneeScolaire">Année scolaire</Label>
                  <Input
                    id="anneeScolaire"
                    value={formData.anneeScolaire}
                    onChange={(e) => setFormData({ ...formData, anneeScolaire: e.target.value })}
                    placeholder="ex: 2024-2025"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">{selectedSession ? "Enregistrer" : "Créer"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer la session{" "}
                <strong>
                  {selectedSession?.semestre} - {selectedSession?.anneeScolaire}
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
