"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { StatCard } from "@/components/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  etudiantsApi,
  inscriptionsApi,
  notesApi,
  reportsApi,
  type Etudiant,
  type Inscription,
  type Note,
} from "@/lib/api"
import { BookOpen, FileText, Award, Calendar, Loader2 } from "lucide-react"

export default function EtudiantDashboard() {
  const [etudiant, setEtudiant] = useState<Etudiant | null>(null)
  const [inscriptions, setInscriptions] = useState<Inscription[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [moyenne, setMoyenne] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [etudiantData, inscriptionsData, notesData, moyenneData] = await Promise.all([
          etudiantsApi.getMe(),
          inscriptionsApi.getAll(),
          notesApi.getAll(),
          reportsApi.getMyAverage().catch(() => null),
        ])
        setEtudiant(etudiantData)
        setInscriptions(inscriptionsData)
        setNotes(notesData)
        if (moyenneData) setMoyenne(moyenneData.moyenne)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

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
          <h1 className="text-2xl font-bold">
            Bienvenue, {etudiant?.prenom} {etudiant?.nom}
          </h1>
          <p className="text-muted-foreground">Matricule: {etudiant?.matricule}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Mes cours"
            value={inscriptions.length}
            icon={<BookOpen className="h-5 w-5" />}
            description="Cours inscrits"
          />
          <StatCard
            title="Notes reçues"
            value={notes.length}
            icon={<FileText className="h-5 w-5" />}
            description="Évaluations"
          />
          <StatCard
            title="Moyenne générale"
            value={moyenne !== null ? `${moyenne.toFixed(2)}/20` : "-"}
            icon={<Award className="h-5 w-5" />}
            description="Toutes matières"
          />
          <StatCard
            title="Statut"
            value={etudiant?.actif ? "Actif" : "Inactif"}
            icon={<Calendar className="h-5 w-5" />}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Mes cours</CardTitle>
            </CardHeader>
            <CardContent>
              {inscriptions.length === 0 ? (
                <p className="text-muted-foreground">Aucun cours inscrit</p>
              ) : (
                <div className="space-y-3">
                  {inscriptions.slice(0, 5).map((insc) => (
                    <div key={insc.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                      <div>
                        <p className="font-medium">{insc.cours?.titre}</p>
                        <p className="text-sm text-muted-foreground">
                          {insc.cours?.formateur ? `${insc.cours.formateur.prenom} ${insc.cours.formateur.nom}` : ""}
                        </p>
                      </div>
                      <span className="text-sm text-muted-foreground">{insc.cours?.code}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Dernières notes</CardTitle>
            </CardHeader>
            <CardContent>
              {notes.length === 0 ? (
                <p className="text-muted-foreground">Aucune note disponible</p>
              ) : (
                <div className="space-y-3">
                  {notes.slice(0, 5).map((note) => (
                    <div key={note.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                      <div>
                        <p className="font-medium">{note.cours?.titre}</p>
                        <p className="text-sm text-muted-foreground">
                          Examen: {note.noteExamen} | DS: {note.noteDs} | Oral: {note.noteOral}
                        </p>
                      </div>
                      <span className="font-semibold text-primary">
                        {((note.noteExamen + note.noteDs + note.noteOral) / 3).toFixed(2)}
                      </span>
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
