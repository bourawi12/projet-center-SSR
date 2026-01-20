"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { reportsApi, coursApi, etudiantsApi, type Cours, type Etudiant } from "@/lib/api"
import { BarChart3, Download, Loader2, TrendingUp, Award, Users } from "lucide-react"

export default function RapportsPage() {
  const [cours, setCours] = useState<Cours[]>([])
  const [etudiants, setEtudiants] = useState<Etudiant[]>([])
  const [topCourses, setTopCourses] = useState<{ code: string; titre: string; inscriptions: number }[]>([])
  const [selectedCours, setSelectedCours] = useState("")
  const [selectedEtudiant, setSelectedEtudiant] = useState("")
  const [successRate, setSuccessRate] = useState<number | null>(null)
  const [studentAverage, setStudentAverage] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursData, etudiantsData, topCoursesData] = await Promise.all([
          coursApi.getAll(),
          etudiantsApi.getAll(),
          reportsApi.getTopCourses(10),
        ])
        setCours(coursData)
        setEtudiants(etudiantsData)
        setTopCourses(topCoursesData)
      } catch (error) {
        toast({ title: "Erreur", description: "Impossible de charger les données", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleGetSuccessRate = async () => {
    if (!selectedCours) return
    try {
      const data = await reportsApi.getSuccessRate(selectedCours)
      setSuccessRate(data.tauxReussite)
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de calculer", variant: "destructive" })
    }
  }

  const handleGetStudentAverage = async () => {
    if (!selectedEtudiant) return
    try {
      const data = await reportsApi.getAverageByStudent(Number.parseInt(selectedEtudiant))
      setStudentAverage(data.moyenne)
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de calculer", variant: "destructive" })
    }
  }

  const handleExportPdf = (coursCode?: string) => {
    reportsApi.exportNotesPdf(coursCode)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Rapports et Statistiques</h1>
          <p className="text-muted-foreground">Consultez les statistiques et exportez les données</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Taux de réussite par cours
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={selectedCours}
                onValueChange={(v) => {
                  setSelectedCours(v)
                  setSuccessRate(null)
                }}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Sélectionner un cours" />
                </SelectTrigger>
                <SelectContent>
                  {cours.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.titre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleGetSuccessRate} disabled={!selectedCours} className="w-full">
                Calculer le taux
              </Button>
              {successRate !== null && (
                <div className="p-4 rounded-lg bg-muted text-center">
                  <p className="text-3xl font-bold text-primary">{successRate.toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">Taux de réussite</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Moyenne par étudiant
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={selectedEtudiant}
                onValueChange={(v) => {
                  setSelectedEtudiant(v)
                  setStudentAverage(null)
                }}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Sélectionner un étudiant" />
                </SelectTrigger>
                <SelectContent>
                  {etudiants.map((e) => (
                    <SelectItem key={e.id} value={e.id.toString()}>
                      {e.prenom} {e.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleGetStudentAverage} disabled={!selectedEtudiant} className="w-full">
                Calculer la moyenne
              </Button>
              {studentAverage !== null && (
                <div className="p-4 rounded-lg bg-muted text-center">
                  <p className="text-3xl font-bold text-primary">{studentAverage.toFixed(2)}/20</p>
                  <p className="text-sm text-muted-foreground">Moyenne générale</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top 10 cours par inscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCourses.map((course, index) => (
                <div key={course.code} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-semibold">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium">{course.titre}</p>
                      <p className="text-sm text-muted-foreground">{course.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{course.inscriptions}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export PDF
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => handleExportPdf()}>
                <Download className="h-4 w-4 mr-2" />
                Exporter toutes les notes
              </Button>
              {selectedCours && (
                <Button variant="outline" onClick={() => handleExportPdf(selectedCours)}>
                  <Download className="h-4 w-4 mr-2" />
                  Exporter notes - {cours.find((c) => c.code === selectedCours)?.titre}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
