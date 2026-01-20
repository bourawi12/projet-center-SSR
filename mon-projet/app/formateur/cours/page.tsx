"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formateursApi, inscriptionsApi, type Cours } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Users, FileText } from "lucide-react"
import Link from "next/link"

export default function FormateurCoursPage() {
  const [cours, setCours] = useState<Cours[]>([])
  const [inscriptionsCounts, setInscriptionsCounts] = useState<{ [key: string]: number }>({})
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const coursData = await formateursApi.getMyCours()
        setCours(coursData)

        const counts: { [key: string]: number } = {}
        for (const c of coursData) {
          try {
            const inscriptions = await inscriptionsApi.getByCourse(c.code)
            counts[c.code] = inscriptions.length
          } catch {
            counts[c.code] = 0
          }
        }
        setInscriptionsCounts(counts)
      } catch (error) {
        toast({ title: "Erreur", description: "Impossible de charger les cours", variant: "destructive" })
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
          <h1 className="text-2xl font-bold">Mes Cours</h1>
          <p className="text-muted-foreground">Gérez vos cours et étudiants</p>
        </div>

        {cours.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="py-8 text-center text-muted-foreground">Aucun cours assigné</CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {cours.map((c) => (
              <Card key={c.code} className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{c.titre}</CardTitle>
                      <p className="text-sm text-muted-foreground">{c.code}</p>
                    </div>
                    <Badge variant={c.actif ? "default" : "secondary"}>{c.actif ? "Actif" : "Inactif"}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{inscriptionsCounts[c.code] || 0} étudiants</span>
                    </div>
                  </div>
                  <Link href={`/formateur/notes?cours=${c.code}`}>
                    <Button variant="outline" className="w-full bg-transparent">
                      <FileText className="h-4 w-4 mr-2" />
                      Gérer les notes
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
