"use client"

import { useEffect, useState, use } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { api } from "@/lib/api"
import { ArrowLeft, Users, BookOpen, Plus, X } from "lucide-react"
import Link from "next/link"
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

interface Groupe {
  id: number
  nom: string
  session?: { id: number; semestre: string; anneeScolaire: string }
  specialite?: { id: number; nom: string }
  etudiants: Etudiant[]
  cours: Cours[]
}

export default function GroupeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [groupe, setGroupe] = useState<Groupe | null>(null)
  const [allEtudiants, setAllEtudiants] = useState<Etudiant[]>([])
  const [allCours, setAllCours] = useState<Cours[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddEtudiantOpen, setIsAddEtudiantOpen] = useState(false)
  const [isAddCoursOpen, setIsAddCoursOpen] = useState(false)
  const [selectedEtudiantId, setSelectedEtudiantId] = useState("")
  const [selectedCoursId, setSelectedCoursId] = useState("")

  useEffect(() => {
    fetchGroupe()
    fetchAllEtudiants()
    fetchAllCours()
  }, [id])

  const fetchGroupe = async () => {
    try {
      const response = await api.get(`/api/groupes/${id}`)
      setGroupe(response.data)
    } catch (error) {
      toast.error("Erreur lors du chargement du groupe")
    } finally {
      setLoading(false)
    }
  }

  const fetchAllEtudiants = async () => {
    try {
      const response = await api.get("/api/etudiants")
      setAllEtudiants(response.data)
    } catch (error) {
      console.error("Error fetching etudiants:", error)
    }
  }

  const fetchAllCours = async () => {
    try {
      const response = await api.get("/api/cours")
      setAllCours(response.data)
    } catch (error) {
      console.error("Error fetching cours:", error)
    }
  }

  const handleAddEtudiant = async () => {
    if (!selectedEtudiantId) return
    try {
      await api.post(`/api/groupes/${id}/etudiants/${selectedEtudiantId}`)
      toast.success("Étudiant ajouté au groupe")
      fetchGroupe()
      setIsAddEtudiantOpen(false)
      setSelectedEtudiantId("")
    } catch (error) {
      toast.error("Erreur lors de l'ajout")
    }
  }

  const handleRemoveEtudiant = async (etudiantId: number) => {
    try {
      await api.delete(`/api/groupes/${id}/etudiants/${etudiantId}`)
      toast.success("Étudiant retiré du groupe")
      fetchGroupe()
    } catch (error) {
      toast.error("Erreur lors du retrait")
    }
  }

  const handleAddCours = async () => {
    if (!selectedCoursId) return
    try {
      await api.post(`/api/groupes/${id}/cours/${selectedCoursId}`)
      toast.success("Cours ajouté au groupe")
      fetchGroupe()
      setIsAddCoursOpen(false)
      setSelectedCoursId("")
    } catch (error) {
      toast.error("Erreur lors de l'ajout")
    }
  }

  const handleRemoveCours = async (coursId: number) => {
    try {
      await api.delete(`/api/groupes/${id}/cours/${coursId}`)
      toast.success("Cours retiré du groupe")
      fetchGroupe()
    } catch (error) {
      toast.error("Erreur lors du retrait")
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!groupe) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Groupe non trouvé</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/groupes">Retour à la liste</Link>
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  const availableEtudiants = allEtudiants.filter((e) => !groupe.etudiants.some((ge) => ge.id === e.id))
  const availableCours = allCours.filter((c) => !groupe.cours.some((gc) => gc.id === c.id))

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/groupes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{groupe.nom}</h1>
            <p className="text-muted-foreground">
              {groupe.session ? `${groupe.session.semestre} - ${groupe.session.anneeScolaire}` : "Session non définie"}
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Spécialité</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="text-lg px-3 py-1">
                {groupe.specialite?.nom || "Non définie"}
              </Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Étudiants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{groupe.etudiants?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cours</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{groupe.cours?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="etudiants" className="space-y-4">
          <TabsList>
            <TabsTrigger value="etudiants">Étudiants</TabsTrigger>
            <TabsTrigger value="cours">Cours</TabsTrigger>
          </TabsList>

          <TabsContent value="etudiants" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Étudiants du groupe</CardTitle>
                  <CardDescription>Gérez les étudiants de ce groupe</CardDescription>
                </div>
                <Button onClick={() => setIsAddEtudiantOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </CardHeader>
              <CardContent>
                {groupe.etudiants?.length > 0 ? (
                  <div className="space-y-3">
                    {groupe.etudiants.map((etudiant) => (
                      <div key={etudiant.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">
                            {etudiant.prenom} {etudiant.nom}
                          </p>
                          <p className="text-sm text-muted-foreground">{etudiant.matricule}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveEtudiant(etudiant.id)}>
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Aucun étudiant dans ce groupe</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cours" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Cours du groupe</CardTitle>
                  <CardDescription>Gérez les cours assignés à ce groupe</CardDescription>
                </div>
                <Button onClick={() => setIsAddCoursOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </CardHeader>
              <CardContent>
                {groupe.cours?.length > 0 ? (
                  <div className="space-y-3">
                    {groupe.cours.map((cours) => (
                      <div key={cours.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{cours.titre}</p>
                          <p className="text-sm text-muted-foreground">{cours.code}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveCours(cours.id)}>
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Aucun cours assigné à ce groupe</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isAddEtudiantOpen} onOpenChange={setIsAddEtudiantOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un étudiant</DialogTitle>
            </DialogHeader>
            <Select value={selectedEtudiantId} onValueChange={setSelectedEtudiantId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un étudiant" />
              </SelectTrigger>
              <SelectContent>
                {availableEtudiants.map((etudiant) => (
                  <SelectItem key={etudiant.id} value={etudiant.id.toString()}>
                    {etudiant.prenom} {etudiant.nom} ({etudiant.matricule})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddEtudiantOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleAddEtudiant}>Ajouter</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isAddCoursOpen} onOpenChange={setIsAddCoursOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un cours</DialogTitle>
            </DialogHeader>
            <Select value={selectedCoursId} onValueChange={setSelectedCoursId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un cours" />
              </SelectTrigger>
              <SelectContent>
                {availableCours.map((cours) => (
                  <SelectItem key={cours.id} value={cours.id.toString()}>
                    {cours.titre} ({cours.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddCoursOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleAddCours}>Ajouter</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
