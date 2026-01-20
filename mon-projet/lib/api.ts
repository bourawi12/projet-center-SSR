// lib/api.ts - Using /api prefix for Next.js API routes

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000"

// Helper function to get auth token
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token") || localStorage.getItem("JWT")
}

// Generic API request function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken()
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  
  // Add Authorization header if token exists
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  // Merge with any additional headers from options
  if (options.headers) {
    Object.assign(headers, options.headers)
  }

  // Use /api prefix to route through Next.js API proxy
  const url = `http://127.0.0.1:8080${endpoint}`
  
  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "")
    throw new Error(errorText || `HTTP error! status: ${response.status}`)
  }

  if (response.status === 204) {
    return null as T
  }

  const text = await response.text()
  if (!text) {
    return null as T
  }

  return JSON.parse(text) as T
}

// Types
export interface Etudiant {
  id: number
  matricule: string
  nom: string
  prenom: string
  email: string
  actif: boolean
  dateInscription?: string
}

export interface Formateur {
  id: number
  nom: string
  prenom: string
  email: string
  specialite: string
}

export interface Cours {
  code: string
  titre: string
  description?: string
  formateur?: Formateur
  actif?: boolean
}

export interface Inscription {
  id: number
  dateInscription?: string
  etudiant: Etudiant
  cours: Cours
}

export interface Note {
  id: number
  valeur: number
  noteExamen: number
  noteDs: number
  noteOral: number
  etudiant: Etudiant
  cours: Cours
}

export interface SessionPedagogique {
  id: number
  semestre: string
  anneeScolaire: string
}

export interface Specialite {
  id: number
  nom: string
  description?: string
}

export interface Groupe {
  id: number
  nom: string
  session?: SessionPedagogique
  specialite?: Specialite
  cours: Cours[]
  etudiants: Etudiant[]
}

export interface GroupeRequest {
  nom: string
  sessionId?: number
  specialiteId?: number
  coursCodes?: string[]
  etudiantIds?: number[]
}

export interface Seance {
  id: number
  dateSeance: string
  heureDebut: string
  heureFin: string
  salle: string
  cours?: Cours
  groupe?: Groupe
}

// API endpoints - Note: Spring Boot expects trailing slashes
export const etudiantsApi = {
  getAll: () => apiRequest<Etudiant[]>("/etudiants/"),
  getMe: () => apiRequest<Etudiant>("/etudiants/me"),
  updateMe: (data: { nom?: string; prenom?: string; email?: string; password?: string }) =>
    apiRequest<Etudiant>("/etudiants/me", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  getById: (id: number) => apiRequest<Etudiant>(`/etudiants/${id}`),
  create: (data: Partial<Etudiant>) => 
    apiRequest<Etudiant>("/etudiants/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (data: Partial<Etudiant> & { id: number }) =>
    apiRequest<Etudiant>("/etudiants/", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    apiRequest<void>(`/etudiants/${id}`, {
      method: "DELETE",
    }),
}

export const formateursApi = {
  getAll: () => apiRequest<Formateur[]>("/formateurs/"),
  getMe: () => apiRequest<Formateur>("/formateurs/me"),
  updateMe: (data: { nom?: string; prenom?: string; email?: string; password?: string }) =>
    apiRequest<Formateur>("/formateurs/me", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  getMyCours: () => apiRequest<Cours[]>("/formateurs/me/cours"),
  getMySeances: () => apiRequest<Seance[]>("/formateurs/me/seances"),
  getMyGroupes: () => apiRequest<Groupe[]>("/formateurs/me/groupes"),
  getById: (id: number) => apiRequest<Formateur>(`/formateurs/${id}`),
  create: (data: Partial<Formateur>) =>
    apiRequest<Formateur>("/formateurs/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<Formateur>) =>
    apiRequest<Formateur>(`/formateurs/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    apiRequest<void>(`/formateurs/${id}`, {
      method: "DELETE",
    }),
}

export const coursApi = {
  getAll: () => apiRequest<Cours[]>("/cours/"),
  getById: (id: number) => apiRequest<Cours>(`/cours/${id}`),
  create: (data: Partial<Cours>) =>
    apiRequest<Cours>("/cours/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<Cours>) =>
    apiRequest<Cours>(`/cours/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    apiRequest<void>(`/cours/${id}`, {
      method: "DELETE",
    }),
}

export const inscriptionsApi = {
  getAll: () => apiRequest<Inscription[]>("/inscriptions/"),
  getByCourse: (code: string) => apiRequest<Inscription[]>(`/inscriptions/by-course/${code}`),
  create: (data: { etudiant?: { id: number }; cours: { code: string } }) =>
    apiRequest<Inscription>("/inscriptions/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    apiRequest<void>(`/inscriptions/${id}`, {
      method: "DELETE",
    }),
}

export const notesApi = {
  getAll: () => apiRequest<Note[]>("/notes/"),
  getById: (id: number) => apiRequest<Note>(`/notes/${id}`),
  getByCourse: (code: string) => apiRequest<Note[]>(`/notes/by-course/${code}`),
  create: (data: Partial<Note>) =>
    apiRequest<Note>("/notes/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<Note>) =>
    apiRequest<Note>(`/notes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    apiRequest<void>(`/notes/${id}`, {
      method: "DELETE",
    }),
}

export const sessionsApi = {
  getAll: () => apiRequest<SessionPedagogique[]>("/sessions/"),
  getById: (id: number) => apiRequest<SessionPedagogique>(`/sessions/${id}`),
  create: (data: Partial<SessionPedagogique>) =>
    apiRequest<SessionPedagogique>("/sessions/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<SessionPedagogique>) =>
    apiRequest<SessionPedagogique>(`/sessions/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    apiRequest<void>(`/sessions/${id}`, {
      method: "DELETE",
    }),
}

export const specialitesApi = {
  getAll: () => apiRequest<Specialite[]>("/specialites/"),
  getById: (id: number) => apiRequest<Specialite>(`/specialites/${id}`),
  create: (data: Partial<Specialite>) =>
    apiRequest<Specialite>("/specialites/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<Specialite>) =>
    apiRequest<Specialite>(`/specialites/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    apiRequest<void>(`/specialites/${id}`, {
      method: "DELETE",
    }),
}

export const groupesApi = {
  getAll: () => apiRequest<Groupe[]>("/groupes/"),
  getById: (id: number) => apiRequest<Groupe>(`/groupes/${id}`),
  create: (data: GroupeRequest) =>
    apiRequest<Groupe>("/groupes/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: number, data: GroupeRequest) =>
    apiRequest<Groupe>(`/groupes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    apiRequest<void>(`/groupes/${id}`, {
      method: "DELETE",
    }),
}

export const seancesApi = {
  getAll: () => apiRequest<Seance[]>("/seances/"),
  getById: (id: number) => apiRequest<Seance>(`/seances/${id}`),
  getMySchedule: () => apiRequest<Seance[]>("/seances/etudiant/me"),
  create: (data: Partial<Seance>) =>
    apiRequest<Seance>("/seances/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<Seance>) =>
    apiRequest<Seance>(`/seances/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    apiRequest<void>(`/seances/${id}`, {
      method: "DELETE",
    }),
}

export const reportsApi = {
  getTopCourses: (limit = 5) =>
    apiRequest<{ code: string; titre: string; inscriptions: number }[]>(
      `/reports/cours/top?limit=${limit}`
    ),
  getSuccessRate: (code: string) =>
    apiRequest<{ cours: string; tauxReussite: number }>(`/reports/cours/${code}/taux-reussite`),
  getMyAverage: () =>
    apiRequest<{ etudiantId: number; moyenne: number }>(`/reports/etudiant/me/moyenne`),
  getAverageByStudent: (id: number) =>
    apiRequest<{ etudiantId: number; moyenne: number }>(`/reports/etudiants/${id}/moyenne`),
  exportNotesPdf: async (coursCode?: string) => {
    const token = getAuthToken()
    const url = coursCode
      ? `http://127.0.0.1:8080/reports/notes/pdf?cours=${coursCode}`
      : "http://127.0.0.1:8080/reports/notes/pdf"

    const headers: Record<string, string> = {}
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const response = await fetch(url, { headers })
    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      throw new Error(errorText || `HTTP error! status: ${response.status}`)
    }

    const blob = await response.blob()
    const fileUrl = window.URL.createObjectURL(blob)
    const tab = window.open(fileUrl, "_blank")
    if (!tab) {
      const link = document.createElement("a")
      link.href = fileUrl
      link.download = "notes-report.pdf"
      document.body.appendChild(link)
      link.click()
      link.remove()
    }
    setTimeout(() => window.URL.revokeObjectURL(fileUrl), 1000)
  },
}

export const authApi = {
  login: (username: string, password: string) =>
    apiRequest<{ token: string; username: string; role: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  signup: (data: any) =>
    apiRequest<{ token: string; username: string; role: string }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  me: () =>
    apiRequest<{ username: string; role: string }>("/auth/me"),
}
