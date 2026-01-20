"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { StatCard } from "@/components/stat-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Users, GraduationCap, BookOpen, Calendar, TrendingUp, Award } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"

interface DashboardStats {
  totalEtudiants: number
  totalFormateurs: number
  totalCours: number
  totalInscriptions: number
  tauxReussite: number
  moyenneGenerale: number
}

interface TopCours {
  coursId: number
  titreCours: string
  nombreInscriptions: number
}

const COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalEtudiants: 0,
    totalFormateurs: 0,
    totalCours: 0,
    totalInscriptions: 0,
    tauxReussite: 0,
    moyenneGenerale: 0,
  })
  const [topCours, setTopCours] = useState<TopCours[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [etudiantsRes, formateursRes, coursRes, inscriptionsRes, tauxRes, topCoursRes] = await Promise.all([
          api.get("/api/etudiants").catch(() => ({ data: [] })),
          api.get("/api/formateurs").catch(() => ({ data: [] })),
          api.get("/api/cours").catch(() => ({ data: [] })),
          api.get("/api/inscriptions").catch(() => ({ data: [] })),
          api.get("/api/rapports/taux-reussite").catch(() => ({ data: 0 })),
          api.get("/api/rapports/top-cours?limit=5").catch(() => ({ data: [] })),
        ])

        setStats({
          totalEtudiants: etudiantsRes.data.length || 0,
          totalFormateurs: formateursRes.data.length || 0,
          totalCours: coursRes.data.length || 0,
          totalInscriptions: inscriptionsRes.data.length || 0,
          tauxReussite: tauxRes.data || 75,
          moyenneGenerale: 14.5,
        })

        setTopCours(topCoursRes.data || [])
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const chartData = [
    { name: "Jan", etudiants: 45, inscriptions: 120 },
    { name: "Fév", etudiants: 52, inscriptions: 145 },
    { name: "Mar", etudiants: 48, inscriptions: 130 },
    { name: "Avr", etudiants: 61, inscriptions: 165 },
    { name: "Mai", etudiants: 55, inscriptions: 150 },
    { name: "Juin", etudiants: 67, inscriptions: 180 },
  ]

  const pieData =
    topCours.length > 0
      ? topCours.map((c) => ({ name: c.titreCours, value: c.nombreInscriptions }))
      : [
          { name: "Informatique", value: 35 },
          { name: "Mathématiques", value: 25 },
          { name: "Physique", value: 20 },
          { name: "Chimie", value: 12 },
          { name: "Biologie", value: 8 },
        ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tableau de bord</h1>
          <p className="text-muted-foreground mt-1">
            Bienvenue, {user?.username}. Voici un aperçu de votre système de gestion.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Étudiants" value={stats.totalEtudiants} icon={Users} description="+12% ce mois" trend="up" />
          <StatCard
            title="Formateurs"
            value={stats.totalFormateurs}
            icon={GraduationCap}
            description="Actifs"
            trend="neutral"
          />
          <StatCard title="Cours" value={stats.totalCours} icon={BookOpen} description="+3 nouveaux" trend="up" />
          <StatCard
            title="Inscriptions"
            value={stats.totalInscriptions}
            icon={Calendar}
            description="Total"
            trend="up"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Taux de réussite"
            value={`${stats.tauxReussite}%`}
            icon={TrendingUp}
            description="Global"
            trend="up"
          />
          <StatCard
            title="Moyenne générale"
            value={stats.moyenneGenerale.toFixed(2)}
            icon={Award}
            description="/20"
            trend="neutral"
          />
          <StatCard title="Sessions actives" value={3} icon={Calendar} description="En cours" trend="neutral" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Évolution des inscriptions</CardTitle>
              <CardDescription>Inscriptions mensuelles sur les 6 derniers mois</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="inscriptions"
                      stroke="#0ea5e9"
                      strokeWidth={2}
                      dot={{ fill: "#0ea5e9" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Répartition par cours</CardTitle>
              <CardDescription>Top 5 des cours les plus populaires</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Statistiques mensuelles</CardTitle>
            <CardDescription>Comparaison étudiants et inscriptions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="etudiants" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="inscriptions" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
