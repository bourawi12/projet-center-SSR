"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DataTable } from "@/components/data-table"
import { notesApi, type Note } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function EtudiantNotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await notesApi.getAll()
        setNotes(data)
      } catch (error) {
        toast({ title: "Erreur", description: "Impossible de charger les notes", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const calculateAverage = (n: Note) => (n.noteExamen + n.noteDs + n.noteOral) / 3
  const getGradeBadge = (avg: number) => {
    if (avg >= 16) return <Badge className="bg-success">Très bien</Badge>
    if (avg >= 14) return <Badge className="bg-primary">Bien</Badge>
    if (avg >= 12) return <Badge className="bg-warning">Assez bien</Badge>
    if (avg >= 10) return <Badge variant="secondary">Passable</Badge>
    return <Badge variant="destructive">Insuffisant</Badge>
  }

  const columns = [
    { key: "cours", header: "Cours", render: (item: Note) => item.cours?.titre || "-" },
    { key: "noteExamen", header: "Examen", render: (item: Note) => item.noteExamen.toFixed(2) },
    { key: "noteDs", header: "DS", render: (item: Note) => item.noteDs.toFixed(2) },
    { key: "noteOral", header: "Oral", render: (item: Note) => item.noteOral.toFixed(2) },
    {
      key: "moyenne",
      header: "Moyenne",
      render: (item: Note) => <span className="font-semibold">{calculateAverage(item).toFixed(2)}</span>,
    },
    { key: "mention", header: "Mention", render: (item: Note) => getGradeBadge(calculateAverage(item)) },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Mes Notes</h1>
          <p className="text-muted-foreground">Consultez vos résultats</p>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <DataTable data={notes} columns={columns} />
        )}
      </div>
    </DashboardLayout>
  )
}
