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
import { useToast } from "@/hooks/use-toast"
import { sessionsApi, type SessionPedagogique } from "@/lib/api"
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react"

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionPedagogique[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedSession, setSelectedSession] = useState<SessionPedagogique | null>(null)
  const [formData, setFormData] = useState({ semestre: "", anneeScolaire: "" })
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const fetchData = async () => {
    try {
      const data = await sessionsApi.getAll()
      setSessions(data)
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de charger les sessions", variant: "destructive" })
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
      if (selectedSession) {
        await sessionsApi.update(selectedSession.id, formData)
        toast({ title: "Succès", description: "Session mise à jour" })
      } else {
        await sessionsApi.create(formData)
        toast({ title: "Succès", description: "Session créée" })
      }
      setDialogOpen(false)
      setSelectedSession(null)
      setFormData({ semestre: "", anneeScolaire: "" })
      fetchData()
    } catch (error) {
      toast({ title: "Erreur", description: "Opération échouée", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedSession) return
    try {
      await sessionsApi.delete(selectedSession.id)
      toast({ title: "Succès", description: "Session supprimée" })
      setDeleteDialogOpen(false)
      setSelectedSession(null)
      fetchData()
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de supprimer", variant: "destructive" })
    }
  }

  const columns = [
    { key: "id", header: "ID" },
    { key: "semestre", header: "Semestre" },
    { key: "anneeScolaire", header: "Année Scolaire" },
    {
      key: "actions",
      header: "Actions",
      render: (item: SessionPedagogique) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedSession(item)
              setFormData({ semestre: item.semestre, anneeScolaire: item.anneeScolaire })
              setDialogOpen(true)
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedSession(item)
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
            <h1 className="text-2xl font-bold">Sessions Pédagogiques</h1>
            <p className="text-muted-foreground">Gérez les sessions</p>
          </div>
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open)
              if (!open) {
                setSelectedSession(null)
                setFormData({ semestre: "", anneeScolaire: "" })
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle session
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>{selectedSession ? "Modifier" : "Créer"} une session</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Semestre</Label>
                  <Input
                    value={formData.semestre}
                    onChange={(e) => setFormData({ ...formData, semestre: e.target.value })}
                    placeholder="S1, S2..."
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Année Scolaire</Label>
                  <Input
                    value={formData.anneeScolaire}
                    onChange={(e) => setFormData({ ...formData, anneeScolaire: e.target.value })}
                    placeholder="2024-2025"
                    className="bg-secondary border-border"
                  />
                </div>
                <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {selectedSession ? "Mettre à jour" : "Créer"}
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
          <DataTable data={sessions} columns={columns} />
        )}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer</AlertDialogTitle>
              <AlertDialogDescription>Supprimer cette session ?</AlertDialogDescription>
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
