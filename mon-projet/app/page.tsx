"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"

export default function Home() {
  const { user, isLoading, isAdmin, isEtudiant, isFormateur } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace("/login")
      } else if (isAdmin) {
        router.replace("/admin")
      } else if (isEtudiant) {
        router.replace("/etudiant")
      } else if (isFormateur) {
        router.replace("/formateur")
      }
    }
  }, [user, isLoading, isAdmin, isEtudiant, isFormateur, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}
