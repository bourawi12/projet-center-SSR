"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { StatCard } from "@/components/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { etudiantsApi, formateursApi, coursApi, reportsApi } from "@/lib/api"
import { Users, UserCog, BookOpen, TrendingUp } from "lucide-react"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    etudiants: 0,
    formateurs: 0,
    cours: 0,
    topCourses: [] as { code: string; titre: string; inscriptions: number }[],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [etudiants, formateurs, cours, topCourses] = await Promise.all([
          etudiantsApi.getAll(),
          formateursApi.getAll(),
          coursApi.getAll(),
          reportsApi.getTopCourses(5),
        ])

        setStats({
          etudiants: etudiants.length,
          formateurs: formateurs.length,
          cours: cours.length,
          topCourses,
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Tableau de bord Admin</h1>
          <p className="text-muted-foreground">Vue d'ensemble du système de gestion pédagogique</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Étudiants"
            value={loading ? "..." : stats.etudiants}
            icon={<Users className="h-5 w-5" />}
            description="Total des étudiants inscrits"
          />
          <StatCard
            title="Formateurs"
            value={loading ? "..." : stats.formateurs}
            icon={<UserCog className="h-5 w-5" />}
            description="Formateurs actifs"
          />
          <StatCard
            title="Cours"
            value={loading ? "..." : stats.cours}
            icon={<BookOpen className="h-5 w-5" />}
            description="Cours disponibles"
          />
          <StatCard
            title="Top Cours"
            value={loading ? "..." : stats.topCourses[0]?.inscriptions || 0}
            icon={<TrendingUp className="h-5 w-5" />}
            description={stats.topCourses[0]?.titre || "Inscriptions"}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Cours les plus populaires</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <p className="text-muted-foreground">Chargement...</p>
                ) : stats.topCourses.length === 0 ? (
                  <p className="text-muted-foreground">Aucune donnée disponible</p>
                ) : (
                  stats.topCourses.map((course, index) => (
                    <div key={course.code} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary text-sm font-medium">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium">{course.titre}</p>
                          <p className="text-sm text-muted-foreground">{course.code}</p>
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">{course.inscriptions} inscriptions</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Actions rapides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <a
                  href="/admin/etudiants"
                  className="p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-center"
                >
                  <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <span className="text-sm">Gérer Étudiants</span>
                </a>
                <a
                  href="/admin/formateurs"
                  className="p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-center"
                >
                  <UserCog className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <span className="text-sm">Gérer Formateurs</span>
                </a>
                <a
                  href="/admin/cours"
                  className="p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-center"
                >
                  <BookOpen className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <span className="text-sm">Gérer Cours</span>
                </a>
                <a
                  href="/admin/rapports"
                  className="p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-center"
                >
                  <TrendingUp className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <span className="text-sm">Voir Rapports</span>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
