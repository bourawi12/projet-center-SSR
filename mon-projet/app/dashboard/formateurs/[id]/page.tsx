"use client"

import { useEffect, useState, use } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { ArrowLeft, Mail, BookOpen, GraduationCap } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface Formateur {
  id: number
  nom: string
  prenom: string
  email: string
  specialite: string
}

interface Cours {
  id: number
  code: string
  titre: string
  actif: boolean
}

export default function FormateurDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [formateur, setFormateur] = useState<Formateur | null>(null)
  const [cours, setCours] = useState<Cours[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [formateurRes, coursRes] = await Promise.all([
          api.get(`/api/formateurs/${id}`),
          api.get(`/api/cours/formateur/${id}`).catch(() => ({ data: [] })),
        ])

        setFormateur(formateurRes.data)
        setCours(coursRes.data)
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

  if (!formateur) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Formateur non trouvé</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/formateurs">Retour à la liste</Link>
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
            <Link href="/dashboard/formateurs">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {formateur.prenom} {formateur.nom}
            </h1>
            <p className="text-muted-foreground">Formateur</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{formateur.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <GraduationCap className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Spécialité</p>
                  <p className="font-medium">{formateur.specialite}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cours enseignés</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cours.length}</div>
              <p className="text-xs text-muted-foreground">cours actifs</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Cours enseignés</CardTitle>
            <CardDescription>Liste des cours dispensés par ce formateur</CardDescription>
          </CardHeader>
          <CardContent>
            {cours.length > 0 ? (
              <div className="space-y-3">
                {cours.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{c.titre}</p>
                      <p className="text-sm text-muted-foreground">Code: {c.code}</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/cours/${c.id}`}>Voir le cours</Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Aucun cours assigné</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
