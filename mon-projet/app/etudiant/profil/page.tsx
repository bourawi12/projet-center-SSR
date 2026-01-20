"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { etudiantsApi, type Etudiant } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Loader2, User, Mail, Hash, Calendar } from "lucide-react"

export default function EtudiantProfilPage() {
  const [etudiant, setEtudiant] = useState<Etudiant | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({ nom: "", prenom: "", email: "", password: "" })
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await etudiantsApi.getMe()
        setEtudiant(data)
        setFormData({ nom: data.nom, prenom: data.prenom, email: data.email, password: "" })
      } catch (error) {
        toast({ title: "Erreur", description: "Impossible de charger le profil", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleUpdate = async () => {
    setSubmitting(true)
    try {
      const updateData: { nom?: string; prenom?: string; email?: string; password?: string } = {}
      if (formData.nom !== etudiant?.nom) updateData.nom = formData.nom
      if (formData.prenom !== etudiant?.prenom) updateData.prenom = formData.prenom
      if (formData.email !== etudiant?.email) updateData.email = formData.email
      if (formData.password) updateData.password = formData.password

      await etudiantsApi.updateMe(updateData)
      toast({ title: "Succès", description: "Profil mis à jour" })
      setEditing(false)
      const updated = await etudiantsApi.getMe()
      setEtudiant(updated)
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Mise à jour échouée",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

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
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold">Mon Profil</h1>
          <p className="text-muted-foreground">Gérez vos informations personnelles</p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Informations personnelles</CardTitle>
            <Button variant="outline" onClick={() => setEditing(!editing)}>
              {editing ? "Annuler" : "Modifier"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {!editing ? (
              <>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                  <Hash className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Matricule</p>
                    <p className="font-medium">{etudiant?.matricule}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Nom complet</p>
                    <p className="font-medium">
                      {etudiant?.prenom} {etudiant?.nom}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{etudiant?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date d'inscription</p>
                    <p className="font-medium">
                      {etudiant?.dateInscription ? new Date(etudiant.dateInscription).toLocaleDateString("fr-FR") : "-"}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Prénom</Label>
                    <Input
                      value={formData.prenom}
                      onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nom</Label>
                    <Input
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nouveau mot de passe (laisser vide si inchangé)</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                <Button onClick={handleUpdate} disabled={submitting} className="w-full">
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Mise à jour...
                    </>
                  ) : (
                    "Enregistrer"
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
