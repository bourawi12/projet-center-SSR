"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DataTable } from "@/components/data-table"
import { inscriptionsApi, type Inscription } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export default function EtudiantCoursPage() {
  const [inscriptions, setInscriptions] = useState<Inscription[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await inscriptionsApi.getAll()
        setInscriptions(data)
      } catch (error) {
        toast({ title: "Erreur", description: "Impossible de charger les cours", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const formatDate = (dateString: string) => (dateString ? new Date(dateString).toLocaleDateString("fr-FR") : "-")

  const columns = [
    { key: "code", header: "Code", render: (item: Inscription) => item.cours?.code || "-" },
    { key: "titre", header: "Titre", render: (item: Inscription) => item.cours?.titre || "-" },
    {
      key: "formateur",
      header: "Formateur",
      render: (item: Inscription) =>
        item.cours?.formateur ? `${item.cours.formateur.prenom} ${item.cours.formateur.nom}` : "-",
    },
    {
      key: "dateInscription",
      header: "Date d'inscription",
      render: (item: Inscription) => formatDate(item.dateInscription),
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Mes Cours</h1>
          <p className="text-muted-foreground">Liste des cours auxquels vous êtes inscrit</p>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <DataTable data={inscriptions} columns={columns} />
        )}
      </div>
    </DashboardLayout>
  )
}
