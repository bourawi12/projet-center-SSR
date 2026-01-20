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
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  groupesApi,
  sessionsApi,
  specialitesApi,
  coursApi,
  etudiantsApi,
  type Groupe,
  type SessionPedagogique,
  type Specialite,
  type Cours,
  type Etudiant,
  type GroupeRequest,
} from "@/lib/api"
import { Plus, Pencil, Trash2, Loader2, Users } from "lucide-react"

export default function GroupesPage() {
  const [groupes, setGroupes] = useState<Groupe[]>([])
  const [sessions, setSessions] = useState<SessionPedagogique[]>([])
  const [specialites, setSpecialites] = useState<Specialite[]>([])
  const [cours, setCours] = useState<Cours[]>([])
  const [etudiants, setEtudiants] = useState<Etudiant[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedGroupe, setSelectedGroupe] = useState<Groupe | null>(null)
  const [formData, setFormData] = useState<GroupeRequest>({
    nom: "",
    sessionId: undefined,
    specialiteId: undefined,
    coursCodes: [],
    etudiantIds: [],
  })
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const fetchData = async () => {
    try {
      const [groupesData, sessionsData, specialitesData, coursData, etudiantsData] = await Promise.all([
        groupesApi.getAll(),
        sessionsApi.getAll(),
        specialitesApi.getAll(),
        coursApi.getAll(),
        etudiantsApi.getAll(),
      ])
      setGroupes(groupesData)
      setSessions(sessionsData)
      setSpecialites(specialitesData)
      setCours(coursData)
      setEtudiants(etudiantsData)
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
      if (selectedGroupe) {
        await groupesApi.update(selectedGroupe.id, formData)
        toast({ title: "Succès", description: "Groupe mis à jour" })
      } else {
        await groupesApi.create(formData)
        toast({ title: "Succès", description: "Groupe créé" })
      }
      setDialogOpen(false)
      setSelectedGroupe(null)
      setFormData({ nom: "", sessionId: undefined, specialiteId: undefined, coursCodes: [], etudiantIds: [] })
      fetchData()
    } catch (error) {
      toast({ title: "Erreur", description: "Opération échouée", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedGroupe) return
    try {
      await groupesApi.delete(selectedGroupe.id)
      toast({ title: "Succès", description: "Groupe supprimé" })
      setDeleteDialogOpen(false)
      setSelectedGroupe(null)
      fetchData()
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" })
    }
  }

  const openEditDialog = (groupe: Groupe) => {
    setSelectedGroupe(groupe)
    setFormData({
      nom: groupe.nom,
      sessionId: groupe.session?.id,
      specialiteId: groupe.specialite?.id,
      coursCodes: groupe.cours?.map((c) => c.code) || [],
      etudiantIds: groupe.etudiants?.map((e) => e.id) || [],
    })
    setDialogOpen(true)
  }

  const columns = [
    { key: "id", header: "ID" },
    { key: "nom", header: "Nom" },
    {
      key: "session",
      header: "Session",
      render: (item: Groupe) => (item.session ? `${item.session.semestre} ${item.session.anneeScolaire}` : "-"),
    },
    { key: "specialite", header: "Spécialité", render: (item: Groupe) => item.specialite?.nom || "-" },
    {
      key: "cours",
      header: "Cours",
      render: (item: Groupe) => <Badge variant="secondary">{item.cours?.length || 0} cours</Badge>,
    },
    {
      key: "etudiants",
      header: "Étudiants",
      render: (item: Groupe) => (
        <Badge variant="secondary">
          <Users className="h-3 w-3 mr-1" />
          {item.etudiants?.length || 0}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (item: Groupe) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedGroupe(item)
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
            <h1 className="text-2xl font-bold">Groupes</h1>
            <p className="text-muted-foreground">Gérez les groupes d'étudiants</p>
          </div>
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open)
              if (!open) {
                setSelectedGroupe(null)
                setFormData({ nom: "", sessionId: undefined, specialiteId: undefined, coursCodes: [], etudiantIds: [] })
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau groupe
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-2xl">
              <DialogHeader>
                <DialogTitle>{selectedGroupe ? "Modifier" : "Créer"} un groupe</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Session</Label>
                    <Select
                      value={formData.sessionId?.toString() || ""}
                      onValueChange={(v) => setFormData({ ...formData, sessionId: v ? Number.parseInt(v) : undefined })}
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {sessions.map((s) => (
                          <SelectItem key={s.id} value={s.id.toString()}>
                            {s.semestre} {s.anneeScolaire}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Spécialité</Label>
                    <Select
                      value={formData.specialiteId?.toString() || ""}
                      onValueChange={(v) =>
                        setFormData({ ...formData, specialiteId: v ? Number.parseInt(v) : undefined })
                      }
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {specialites.map((s) => (
                          <SelectItem key={s.id} value={s.id.toString()}>
                            {s.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Cours (cliquez pour ajouter/retirer)</Label>
                  <div className="flex flex-wrap gap-2 p-3 bg-secondary rounded-md min-h-[60px]">
                    {cours.map((c) => (
                      <Badge
                        key={c.code}
                        variant={formData.coursCodes?.includes(c.code) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          const codes = formData.coursCodes || []
                          setFormData({
                            ...formData,
                            coursCodes: codes.includes(c.code)
                              ? codes.filter((code) => code !== c.code)
                              : [...codes, c.code],
                          })
                        }}
                      >
                        {c.titre}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Étudiants (cliquez pour ajouter/retirer)</Label>
                  <div className="flex flex-wrap gap-2 p-3 bg-secondary rounded-md min-h-[60px] max-h-[150px] overflow-y-auto">
                    {etudiants.map((e) => (
                      <Badge
                        key={e.id}
                        variant={formData.etudiantIds?.includes(e.id) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          const ids = formData.etudiantIds || []
                          setFormData({
                            ...formData,
                            etudiantIds: ids.includes(e.id) ? ids.filter((id) => id !== e.id) : [...ids, e.id],
                          })
                        }}
                      >
                        {e.prenom} {e.nom}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {selectedGroupe ? "Mettre à jour" : "Créer"}
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
          <DataTable data={groupes} columns={columns} searchKey="nom" />
        )}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer</AlertDialogTitle>
              <AlertDialogDescription>Supprimer ce groupe ?</AlertDialogDescription>
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
