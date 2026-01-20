"use client"

import { useEffect, useState, use } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/api"
import { ArrowLeft, Users, GraduationCap, Calendar } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface Formateur {
  id: number
  nom: string
  prenom: string
  email: string
}

interface Cours {
  id: number
  code: string
  titre: string
  actif: boolean
  formateur?: Formateur
}

interface Inscription {
  id: number
  dateInscription: string
  etudiant: { id: number; nom: string; prenom: string; matricule: string }
}

interface Seance {
  id: number
  date: string
  heureDebut: string
  heureFin: string
  salle: string
}

export default function CoursDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [cours, setCours] = useState<Cours | null>(null)
  const [inscriptions, setInscriptions] = useState<Inscription[]>([])
  const [seances, setSeances] = useState<Seance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursRes, inscriptionsRes, seancesRes] = await Promise.all([
          api.get(`/api/cours/${id}`),
          api.get(`/api/inscriptions/cours/${id}`).catch(() => ({ data: [] })),
          api.get(`/api/seances/cours/${id}`).catch(() => ({ data: [] })),
        ])

        setCours(coursRes.data)
        setInscriptions(inscriptionsRes.data)
        setSeances(seancesRes.data)
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

  if (!cours) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cours non trouvé</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/cours">Retour à la liste</Link>
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/cours">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">{cours.titre}</h1>
              <Badge variant={cours.actif ? "default" : "secondary"}>{cours.actif ? "Actif" : "Inactif"}</Badge>
            </div>
            <p className="text-muted-foreground">Code: {cours.code}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Formateur</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {cours.formateur ? (
                <div>
                  <p className="text-lg font-bold">
                    {cours.formateur.prenom} {cours.formateur.nom}
                  </p>
                  <p className="text-sm text-muted-foreground">{cours.formateur.email}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">Non assigné</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Étudiants inscrits</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inscriptions.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Séances planifiées</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{seances.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="etudiants" className="space-y-4">
          <TabsList>
            <TabsTrigger value="etudiants">Étudiants inscrits</TabsTrigger>
            <TabsTrigger value="seances">Séances</TabsTrigger>
          </TabsList>

          <TabsContent value="etudiants" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Liste des étudiants</CardTitle>
                <CardDescription>Étudiants inscrits à ce cours</CardDescription>
              </CardHeader>
              <CardContent>
                {inscriptions.length > 0 ? (
                  <div className="space-y-3">
                    {inscriptions.map((inscription) => (
                      <div key={inscription.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">
                            {inscription.etudiant.prenom} {inscription.etudiant.nom}
                          </p>
                          <p className="text-sm text-muted-foreground">Matricule: {inscription.etudiant.matricule}</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(inscription.dateInscription).toLocaleDateString("fr-FR")}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Aucun étudiant inscrit</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seances" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Planning des séances</CardTitle>
                <CardDescription>Séances programmées pour ce cours</CardDescription>
              </CardHeader>
              <CardContent>
                {seances.length > 0 ? (
                  <div className="space-y-3">
                    {seances.map((seance) => (
                      <div key={seance.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{new Date(seance.date).toLocaleDateString("fr-FR")}</p>
                          <p className="text-sm text-muted-foreground">
                            {seance.heureDebut} - {seance.heureFin}
                          </p>
                        </div>
                        <Badge variant="outline">{seance.salle}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Aucune séance programmée</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
