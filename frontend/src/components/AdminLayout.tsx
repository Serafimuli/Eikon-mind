import { useState } from "react"
import { Outlet, Link, useLocation, useNavigate, Navigate } from "react-router"
import { useApp } from "@/contexts/AppContext"
import ScrollManager from "@/components/ScrollManager"

export default function AdminLayout() {
  const { user, logout, tr, lang, setLang, isDark, toggleDark } = useApp()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!user) return <Navigate to="/login" replace />
  if (user.role !== "admin") return <Navigate to="/client" replace />

  const isActive = (path: string) => location.pathname === path

  const navItems = [
    { to: "/", label: tr.admin.home, icon: "⌂" },
    { to: "/admin", label: tr.admin.dashboard, icon: "⊞" },
    { to: "/admin/appointments", label: tr.admin.appointments, icon: "◷" },
    { to: "/admin/add", label: tr.admin.addAppointment, icon: "+" },
  ]

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  return (
    <div className="app-shell">
      <ScrollManager />
      {/* Sidebar */}
      <aside className={`app-sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="app-sidebar__brand">
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src="/assets/eikon-mind-mark.png"
              alt="Eikon Mind"
              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold font-display"
            />
            <span className="font-display font-semibold text-foreground text-sm">
              Eikon Mind
            </span>
          </Link>
          <div className="mt-2">
            <span className="text-xs text-accent font-semibold uppercase tracking-wider">
              Admin
            </span>
          </div>
        </div>
        <nav className="app-sidebar__nav">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={`app-sidebar__nav-link ${
                isActive(item.to) ? "is-active" : ""
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="app-sidebar__footer">
          <div className="app-sidebar__controls">
            <div className="segmented-control">
              <button
                onClick={() => setLang("en")}
                className={`px-2 py-0.5 rounded-full text-xs font-semibold transition-all ${
                  lang === "en"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang("ro")}
                className={`px-2 py-0.5 rounded-full text-xs font-semibold transition-all ${
                  lang === "ro"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                RO
              </button>
            </div>
            <button
              onClick={toggleDark}
              className="w-7 h-7 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              {isDark ? (
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>
          </div>
          <button onClick={handleLogout} className="app-sidebar__logout">
            <span>→</span> {tr.admin.logout}
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="app-main">
        <div className="mobile-toolbar">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <span className="font-display font-semibold text-sm">
            Admin — {user.firstName}
          </span>
          <div className="w-8" />
        </div>
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
