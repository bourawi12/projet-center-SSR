"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { seancesApi, type Seance } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Clock, MapPin, BookOpen } from "lucide-react"

export default function EmploiDuTempsPage() {
  const [seances, setSeances] = useState<Seance[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await seancesApi.getMySchedule()
        setSeances(data.sort((a, b) => new Date(a.dateSeance).getTime() - new Date(b.dateSeance).getTime()))
      } catch (error) {
        toast({ title: "Erreur", description: "Impossible de charger l'emploi du temps", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
  }

  const groupByDate = (seances: Seance[]) => {
    const groups: { [key: string]: Seance[] } = {}
    seances.forEach((seance) => {
      const date = seance.dateSeance
      if (!groups[date]) groups[date] = []
      groups[date].push(seance)
    })
    return groups
  }

  const groupedSeances = groupByDate(seances)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Mon Emploi du Temps</h1>
          <p className="text-muted-foreground">Vos séances à venir</p>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : seances.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="py-8 text-center text-muted-foreground">Aucune séance programmée</CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedSeances).map(([date, daySeances]) => (
              <div key={date}>
                <h2 className="text-lg font-semibold mb-3 capitalize">{formatDate(date)}</h2>
                <div className="space-y-3">
                  {daySeances.map((seance) => (
                    <Card key={seance.id} className="bg-card border-border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-primary" />
                              <span className="font-medium">{seance.cours?.titre}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {seance.heureDebut} - {seance.heureFin}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {seance.salle}
                              </div>
                            </div>
                            {seance.groupe && (
                              <span className="text-sm text-muted-foreground">Groupe: {seance.groupe.nom}</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
