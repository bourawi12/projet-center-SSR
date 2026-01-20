"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { StatCard } from "@/components/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formateursApi, type Formateur, type Cours, type Seance, type Groupe } from "@/lib/api"
import { BookOpen, Calendar, Users, Loader2 } from "lucide-react"

export default function FormateurDashboard() {
  const [formateur, setFormateur] = useState<Formateur | null>(null)
  const [cours, setCours] = useState<Cours[]>([])
  const [seances, setSeances] = useState<Seance[]>([])
  const [groupes, setGroupes] = useState<Groupe[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [formateurData, coursData, seancesData, groupesData] = await Promise.all([
          formateursApi.getMe(),
          formateursApi.getMyCours(),
          formateursApi.getMySeances(),
          formateursApi.getMyGroupes(),
        ])
        setFormateur(formateurData)
        setCours(coursData)
        setSeances(seancesData)
        setGroupes(groupesData)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading)
    return (
      <DashboardLayout>
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">
            Bienvenue, {formateur?.prenom} {formateur?.nom}
          </h1>
          <p className="text-muted-foreground">Spécialité: {formateur?.specialite}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Mes cours"
            value={cours.length}
            icon={<BookOpen className="h-5 w-5" />}
            description="Cours assignés"
          />
          <StatCard
            title="Séances à venir"
            value={seances.length}
            icon={<Calendar className="h-5 w-5" />}
            description="Programmées"
          />
          <StatCard
            title="Groupes"
            value={groupes.length}
            icon={<Users className="h-5 w-5" />}
            description="Groupes d'étudiants"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Mes cours</CardTitle>
            </CardHeader>
            <CardContent>
              {cours.length === 0 ? (
                <p className="text-muted-foreground">Aucun cours assigné</p>
              ) : (
                <div className="space-y-3">
                  {cours.map((c) => (
                    <div key={c.code} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                      <div>
                        <p className="font-medium">{c.titre}</p>
                        <p className="text-sm text-muted-foreground">{c.code}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Prochaines séances</CardTitle>
            </CardHeader>
            <CardContent>
              {seances.length === 0 ? (
                <p className="text-muted-foreground">Aucune séance programmée</p>
              ) : (
                <div className="space-y-3">
                  {seances.slice(0, 5).map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                      <div>
                        <p className="font-medium">{s.cours?.titre}</p>
                        <p className="text-sm text-muted-foreground">
                          {s.dateSeance} | {s.heureDebut} - {s.heureFin}
                        </p>
                      </div>
                      <span className="text-sm">{s.salle}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
