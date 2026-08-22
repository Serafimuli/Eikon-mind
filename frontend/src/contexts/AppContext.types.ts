import type { ReactNode } from "react"

import type { Appointment, User } from "@/data/mockData"

import type { Lang, Translations } from "@/i18n/translations"

export interface LoginResult {
  success: boolean
  error?: string
  user?: User
}

export interface RegisterResult {
  success: boolean
  error?: string
}

export interface AppContextType {
  lang: Lang

  setLang: (lang: Lang) => void

  tr: Translations

  isDark: boolean

  toggleDark: () => void

  user: User | null

  login: (
    email: string,
    password: string,
  ) => LoginResult

  logout: () => void

  register: (data: {
    firstName: string
    lastName: string
    email: string
    password: string
  }) => RegisterResult

  appointments: Appointment[]

  addAppointment: (appointment: Omit<Appointment, "id">) => void

  deleteAppointment: (id: string) => void

  updateAppointmentStatus: (id: string, status: Appointment["status"]) => void

  updateAppointment: (
    id: string,
    changes: Partial<Pick<Appointment, "date" | "time">>,
  ) => void

  users: User[]
}

export interface AppProviderProps {
  children: ReactNode
}
