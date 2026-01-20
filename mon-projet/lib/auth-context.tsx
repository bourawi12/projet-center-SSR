"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { authApi } from "./api"

interface AuthUser {
  username: string
  role: string
}

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  signup: (data: {
    email: string
    password: string
    role: "ETUDIANT" | "FORMATEUR"
    nom: string
    prenom: string
    specialite?: string
  }) => Promise<void>
  logout: () => void
  isAdmin: boolean
  isEtudiant: boolean
  isFormateur: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem("token") ?? localStorage.getItem("JWT")
    const savedUser = localStorage.getItem("user")

    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    const response = await authApi.login(username, password)
    localStorage.setItem("token", response.token)
    localStorage.setItem("JWT", response.token)
    localStorage.setItem("user", JSON.stringify({ username: response.username, role: response.role }))
    setToken(response.token)
    setUser({ username: response.username, role: response.role })
  }

  const signup = async (data: {
    email: string
    password: string
    role: "ETUDIANT" | "FORMATEUR"
    nom: string
    prenom: string
    specialite?: string
  }) => {
    const response = await authApi.signup(data)
    localStorage.setItem("token", response.token)
    localStorage.setItem("JWT", response.token)
    localStorage.setItem("user", JSON.stringify({ username: response.username, role: response.role }))
    setToken(response.token)
    setUser({ username: response.username, role: response.role })
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("JWT")
    localStorage.removeItem("user")
    setToken(null)
    setUser(null)
  }

  const normalizeRole = (role: string) => {
    if (!role) return ""
    const trimmed = role.trim()
    const normalized = trimmed.startsWith("ROLE_") ? trimmed.substring(5) : trimmed
    return normalized.toUpperCase()
  }

  const isAdmin = user ? normalizeRole(user.role) === "ADMIN" : false
  const isEtudiant = user ? normalizeRole(user.role) === "ETUDIANT" : false
  const isFormateur = user ? normalizeRole(user.role) === "FORMATEUR" : false

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signup, logout, isAdmin, isEtudiant, isFormateur }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
