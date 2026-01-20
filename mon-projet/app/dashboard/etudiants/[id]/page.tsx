"use client"

import { useEffect, useState, use } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/api"
import { ArrowLeft, Mail, BookOpen, Award, Calendar } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface Etudiant {
  id: number
  matricule: string
  nom: string
  prenom: string
  email: string
  actif: boolean
  specialite?: { id: number; nom: string }
}

interface Note {
  id: number
  examen: number
  ds: number
  oral: number
  cours: { id: number; titre: string }
}

interface Inscription {
  id: number
  dateInscription: string
  cours: { id: number; titre: string; code: string }
}

export default function EtudiantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [etudiant, setEtudiant] = useState<Etudiant | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [inscriptions, setInscriptions] = useState<Inscription[]>([])
  const [moyenne, setMoyenne] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [etudiantRes, notesRes, inscriptionsRes, moyenneRes] = await Promise.all([
          api.get(`/api/etudiants/${id}`),
          api.get(`/api/notes/etudiant/${id}`).catch(() => ({ data: [] })),
          api.get(`/api/inscriptions/etudiant/${id}`).catch(() => ({ data: [] })),
          api.get(`/api/rapports/moyenne-etudiant/${id}`).catch(() => ({ data: null })),
        ])

        setEtudiant(etudiantRes.data)
        setNotes(notesRes.data)
        setInscriptions(inscriptionsRes.data)
        setMoyenne(moyenneRes.data)
      } catch (error) {
        toast.error("Erreur lors du chargement des données")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!etudiant) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Étudiant non trouvé</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/etudiants">Retour à la liste</Link>
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  const calculateNoteAverage = (note: Note) => {
    return (note.examen * 0.5 + note.ds * 0.3 + note.oral * 0.2).toFixed(2)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/etudiants">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {etudiant.prenom} {etudiant.nom}
            </h1>
            <p className="text-muted-foreground">Matricule: {etudiant.matricule}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Statut</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={etudiant.actif ? "default" : "secondary"} className="text-lg px-3 py-1">
                {etudiant.actif ? "Actif" : "Inactif"}
              </Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Moyenne générale</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{moyenne !== null ? `${moyenne.toFixed(2)}/20` : "N/A"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cours inscrits</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inscriptions.length}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{etudiant.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Spécialité</p>
                <p className="font-medium">{etudiant.specialite?.nom || "Non assignée"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="notes" className="space-y-4">
          <TabsList>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="inscriptions">Inscriptions</TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notes par cours</CardTitle>
                <CardDescription>Détail des notes obtenues</CardDescription>
              </CardHeader>
              <CardContent>
                {notes.length > 0 ? (
                  <div className="space-y-4">
                    {notes.map((note) => (
                      <div key={note.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{note.cours.titre}</p>
                          <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                            <span>Examen: {note.examen}/20</span>
                            <span>DS: {note.ds}/20</span>
                            <span>Oral: {note.oral}/20</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Moyenne</p>
                          <p className="text-xl font-bold">{calculateNoteAverage(note)}/20</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Aucune note enregistrée</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inscriptions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cours inscrits</CardTitle>
                <CardDescription>Liste des inscriptions aux cours</CardDescription>
              </CardHeader>
              <CardContent>
                {inscriptions.length > 0 ? (
                  <div className="space-y-3">
                    {inscriptions.map((inscription) => (
                      <div key={inscription.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{inscription.cours.titre}</p>
                          <p className="text-sm text-muted-foreground">Code: {inscription.cours.code}</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(inscription.dateInscription).toLocaleDateString("fr-FR")}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Aucune inscription</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
