"use client"

import { type ReactNode, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
  GraduationCap,
  Users,
  UserCog,
  BookOpen,
  FileText,
  ClipboardList,
  Calendar,
  Layers,
  Tag,
  BarChart3,
  LogOut,
  Menu,
  X,
  User,
  Home,
} from "lucide-react"
import { useState } from "react"

interface NavItem {
  title: string
  href: string
  icon: ReactNode
}

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout, isLoading, isAdmin, isEtudiant, isFormateur } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!user) return null

  const adminNavItems: NavItem[] = [
    { title: "Tableau de bord", href: "/admin", icon: <Home className="h-4 w-4" /> },
    { title: "Étudiants", href: "/admin/etudiants", icon: <Users className="h-4 w-4" /> },
    { title: "Formateurs", href: "/admin/formateurs", icon: <UserCog className="h-4 w-4" /> },
    { title: "Cours", href: "/admin/cours", icon: <BookOpen className="h-4 w-4" /> },
    { title: "Inscriptions", href: "/admin/inscriptions", icon: <ClipboardList className="h-4 w-4" /> },
    { title: "Notes", href: "/admin/notes", icon: <FileText className="h-4 w-4" /> },
    { title: "Groupes", href: "/admin/groupes", icon: <Layers className="h-4 w-4" /> },
    { title: "Sessions", href: "/admin/sessions", icon: <Calendar className="h-4 w-4" /> },
    { title: "Spécialités", href: "/admin/specialites", icon: <Tag className="h-4 w-4" /> },
    { title: "Séances", href: "/admin/seances", icon: <Calendar className="h-4 w-4" /> },
    { title: "Rapports", href: "/admin/rapports", icon: <BarChart3 className="h-4 w-4" /> },
  ]

  const etudiantNavItems: NavItem[] = [
    { title: "Tableau de bord", href: "/etudiant", icon: <Home className="h-4 w-4" /> },
    { title: "Mes cours", href: "/etudiant/cours", icon: <BookOpen className="h-4 w-4" /> },
    { title: "Mes notes", href: "/etudiant/notes", icon: <FileText className="h-4 w-4" /> },
    { title: "Mon emploi du temps", href: "/etudiant/emploi-du-temps", icon: <Calendar className="h-4 w-4" /> },
    { title: "Mon profil", href: "/etudiant/profil", icon: <User className="h-4 w-4" /> },
  ]

  const formateurNavItems: NavItem[] = [
    { title: "Tableau de bord", href: "/formateur", icon: <Home className="h-4 w-4" /> },
    { title: "Mes cours", href: "/formateur/cours", icon: <BookOpen className="h-4 w-4" /> },
    { title: "Notes", href: "/formateur/notes", icon: <FileText className="h-4 w-4" /> },
    { title: "Mes séances", href: "/formateur/seances", icon: <Calendar className="h-4 w-4" /> },
    { title: "Mon profil", href: "/formateur/profil", icon: <User className="h-4 w-4" /> },
  ]

  let navItems: NavItem[] = []
  if (isAdmin) navItems = adminNavItems
  else if (isEtudiant) navItems = etudiantNavItems
  else if (isFormateur) navItems = formateurNavItems

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b border-border z-50 flex items-center px-4">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2 ml-4">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="font-semibold">EduManager</span>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-50" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-50 transition-transform duration-300",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between h-14 px-4 border-b border-border">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="font-semibold">EduManager</span>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-3.5rem-4rem)]">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {item.icon}
                {item.title}
              </Link>
            ))}
          </nav>
        </ScrollArea>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3 px-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.username}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role.replace("ROLE_", "").toLowerCase()}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:pl-64 pt-14 lg:pt-0 min-h-screen">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
