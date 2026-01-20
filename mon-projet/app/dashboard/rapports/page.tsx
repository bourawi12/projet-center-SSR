"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api"
import { FileText, TrendingUp, BookOpen, Download, Search, Users } from "lucide-react"
import { toast } from "sonner"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

interface Etudiant {
  id: number
  matricule: string
  nom: string
  prenom: string
}

interface TopCours {
  coursId: number
  titreCours: string
  nombreInscriptions: number
}

interface MoyenneResult {
  etudiantId: number
  nom: string
  prenom: string
  moyenne: number
}

const COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

export default function RapportsPage() {
  const [etudiants, setEtudiants] = useState<Etudiant[]>([])
  const [selectedEtudiantId, setSelectedEtudiantId] = useState("")
  const [moyenneEtudiant, setMoyenneEtudiant] = useState<number | null>(null)
  const [tauxReussite, setTauxReussite] = useState<number | null>(null)
  const [topCours, setTopCours] = useState<TopCours[]>([])
  const [topLimit, setTopLimit] = useState("5")
  const [loading, setLoading] = useState(true)
  const [moyennes, setMoyennes] = useState<MoyenneResult[]>([])

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      const [etudiantsRes, tauxRes, topCoursRes] = await Promise.all([
        api.get("/api/etudiants"),
        api.get("/api/rapports/taux-reussite").catch(() => ({ data: 75 })),
        api.get("/api/rapports/top-cours?limit=5").catch(() => ({ data: [] })),
      ])

      setEtudiants(etudiantsRes.data)
      setTauxReussite(tauxRes.data)
      setTopCours(topCoursRes.data)

      // Fetch moyennes for all students with notes
      const moyennesData: MoyenneResult[] = []
      for (const etudiant of etudiantsRes.data.slice(0, 10)) {
        try {
          const moyenneRes = await api.get(`/api/rapports/moyenne-etudiant/${etudiant.id}`)
          if (moyenneRes.data !== null) {
            moyennesData.push({
              etudiantId: etudiant.id,
              nom: etudiant.nom,
              prenom: etudiant.prenom,
              moyenne: moyenneRes.data,
            })
          }
        } catch {
          // Skip students without notes
        }
      }
      setMoyennes(moyennesData)
    } catch (error) {
      console.error("Error fetching initial data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMoyenneEtudiant = async () => {
    if (!selectedEtudiantId) return
    try {
      const response = await api.get(`/api/rapports/moyenne-etudiant/${selectedEtudiantId}`)
      setMoyenneEtudiant(response.data)
    } catch (error) {
      toast.error("Erreur lors du calcul de la moyenne")
      setMoyenneEtudiant(null)
    }
  }

  const fetchTopCours = async () => {
    try {
      const response = await api.get(`/api/rapports/top-cours?limit=${topLimit}`)
      setTopCours(response.data)
    } catch (error) {
      toast.error("Erreur lors du chargement des cours populaires")
    }
  }

  const handleExportPdf = async () => {
    if (!selectedEtudiantId) {
      toast.error("Veuillez sélectionner un étudiant")
      return
    }
    try {
      const response = await api.get(`/api/rapports/bulletin/${selectedEtudiantId}`, {
        responseType: "blob",
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      const etudiant = etudiants.find((e) => e.id.toString() === selectedEtudiantId)
      link.setAttribute("download", `bulletin_${etudiant?.nom}_${etudiant?.prenom}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success("Bulletin téléchargé avec succès")
    } catch (error) {
      toast.error("Erreur lors de l'export du bulletin")
    }
  }

  const selectedEtudiant = etudiants.find((e) => e.id.toString() === selectedEtudiantId)

  const moyennesChartData = moyennes.map((m) => ({
    name: `${m.prenom.charAt(0)}. ${m.nom}`,
    moyenne: m.moyenne,
  }))

  const topCoursChartData = topCours.map((c) => ({
    name: c.titreCours.length > 15 ? c.titreCours.substring(0, 15) + "..." : c.titreCours,
    inscriptions: c.nombreInscriptions,
  }))

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Rapports et Statistiques</h1>
          <p className="text-muted-foreground mt-1">Analysez les performances et générez des rapports détaillés</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux de réussite global</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {tauxReussite !== null ? `${tauxReussite}%` : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Étudiants avec moyenne {"≥"} 10/20</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cours les plus populaires</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{topCours.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Cours avec le plus d'inscriptions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Étudiants évalués</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{moyennes.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Avec notes enregistrées</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="moyenne" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="moyenne">Moyenne étudiant</TabsTrigger>
            <TabsTrigger value="top-cours">Top cours</TabsTrigger>
            <TabsTrigger value="bulletin">Bulletin PDF</TabsTrigger>
          </TabsList>

          <TabsContent value="moyenne" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Calculer la moyenne d'un étudiant</CardTitle>
                <CardDescription>Sélectionnez un étudiant pour voir sa moyenne générale</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4 items-end">
                  <div className="flex-1 max-w-sm">
                    <Label htmlFor="etudiant">Étudiant</Label>
                    <Select value={selectedEtudiantId} onValueChange={setSelectedEtudiantId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un étudiant" />
                      </SelectTrigger>
                      <SelectContent>
                        {etudiants.map((etudiant) => (
                          <SelectItem key={etudiant.id} value={etudiant.id.toString()}>
                            {etudiant.prenom} {etudiant.nom} ({etudiant.matricule})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={fetchMoyenneEtudiant}>
                    <Search className="h-4 w-4 mr-2" />
                    Calculer
                  </Button>
                </div>

                {moyenneEtudiant !== null && selectedEtudiant && (
                  <div className="p-6 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Moyenne de</p>
                        <p className="text-xl font-semibold">
                          {selectedEtudiant.prenom} {selectedEtudiant.nom}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            moyenneEtudiant >= 14 ? "default" : moyenneEtudiant >= 10 ? "secondary" : "destructive"
                          }
                          className="text-2xl px-4 py-2"
                        >
                          {moyenneEtudiant.toFixed(2)}/20
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          {moyenneEtudiant >= 14
                            ? "Très bien"
                            : moyenneEtudiant >= 12
                              ? "Bien"
                              : moyenneEtudiant >= 10
                                ? "Passable"
                                : "Insuffisant"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Comparaison des moyennes</CardTitle>
                <CardDescription>Moyennes des étudiants évalués</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={moyennesChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" domain={[0, 20]} stroke="hsl(var(--muted-foreground))" />
                      <YAxis dataKey="name" type="category" width={100} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [`${value.toFixed(2)}/20`, "Moyenne"]}
                      />
                      <Bar dataKey="moyenne" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="top-cours" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cours les plus populaires</CardTitle>
                <CardDescription>Classement par nombre d'inscriptions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4 items-end">
                  <div className="w-32">
                    <Label htmlFor="limit">Nombre de cours</Label>
                    <Select value={topLimit} onValueChange={setTopLimit}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">Top 3</SelectItem>
                        <SelectItem value="5">Top 5</SelectItem>
                        <SelectItem value="10">Top 10</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={fetchTopCours}>
                    <Search className="h-4 w-4 mr-2" />
                    Actualiser
                  </Button>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-3">
                    {topCours.map((cours, index) => (
                      <div key={cours.coursId} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        >
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{cours.titreCours}</p>
                          <p className="text-sm text-muted-foreground">{cours.nombreInscriptions} inscriptions</p>
                        </div>
                        <Badge variant="outline">{cours.nombreInscriptions}</Badge>
                      </div>
                    ))}
                  </div>

                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={topCoursChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="inscriptions"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {topCoursChartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulletin" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Génération de bulletin</CardTitle>
                <CardDescription>Téléchargez le bulletin de notes au format PDF</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4 items-end">
                  <div className="flex-1 max-w-sm">
                    <Label htmlFor="etudiant-bulletin">Étudiant</Label>
                    <Select value={selectedEtudiantId} onValueChange={setSelectedEtudiantId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un étudiant" />
                      </SelectTrigger>
                      <SelectContent>
                        {etudiants.map((etudiant) => (
                          <SelectItem key={etudiant.id} value={etudiant.id.toString()}>
                            {etudiant.prenom} {etudiant.nom} ({etudiant.matricule})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleExportPdf} disabled={!selectedEtudiantId}>
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger PDF
                  </Button>
                </div>

                {selectedEtudiant && (
                  <div className="p-6 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <FileText className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">
                          Bulletin de {selectedEtudiant.prenom} {selectedEtudiant.nom}
                        </p>
                        <p className="text-sm text-muted-foreground">Matricule: {selectedEtudiant.matricule}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Le bulletin contiendra toutes les notes et la moyenne générale
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
