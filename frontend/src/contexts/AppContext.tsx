import { createContext, useContext, useEffect, useState } from "react"
import t, { type Lang, type Translations } from "@/i18n/translations"
import {
  MOCK_USERS,
  INITIAL_APPOINTMENTS,
  type Appointment,
  type User,
} from "@/data/mockData"
import type { AppContextType, AppProviderProps } from "./AppContext.types"

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: AppProviderProps) {
  const [lang, setLangState] = useState<Lang>(() => {
    return localStorage.getItem("lang") as Lang || "ro"
  })
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") === "dark"
  })
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("user")
    return stored ? JSON.parse(stored) : null
  })
  const [appointments, setAppointments] =
    useState<Appointment[]>(INITIAL_APPOINTMENTS)
  const [users, setUsers] = useState<User[]>(MOCK_USERS)

  const tr = t[lang] as Translations

  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem("lang", l)
  }

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      root.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }, [isDark])

  const toggleDark = () => setIsDark((d) => !d)

  const login = (email: string, password: string) => {
    const found = users.find(
      (u) => u.email === email && u.password === password,
    )
    if (!found)
      return { success: false, error: tr.auth.errors.invalidCredentials }
    setUser(found)
    localStorage.setItem("user", JSON.stringify(found))
    return { success: true, user: found }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
  }

  const register = (data: {
    firstName: string
    lastName: string
    email: string
    password: string
  }) => {
    if (users.find((u) => u.email === data.email)) {
      return { success: false, error: tr.auth.errors.emailExists }
    }
    const newUser: User = {
      id: `u${Date.now()}`,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      role: "client",
    }
    setUsers((prev) => [...prev, newUser])
    return { success: true }
  }

  const addAppointment = (a: Omit<Appointment, "id">) => {
    setAppointments((prev) => [...prev, { ...a, id: `a${Date.now()}` }])
  }

  const deleteAppointment = (id: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id))
  }

  const updateAppointmentStatus = (
    id: string,
    status: Appointment["status"],
  ) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a)),
    )
  }

  const updateAppointment = (
    id: string,
    changes: Partial<Pick<Appointment, "date" | "time">>,
  ) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...changes } : a)),
    )
  }

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        tr,
        isDark,
        toggleDark,
        user,
        login,
        logout,
        register,
        appointments,
        addAppointment,
        deleteAppointment,
        updateAppointmentStatus,
        updateAppointment,
        users,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be used inside AppProvider")
  return ctx
}
