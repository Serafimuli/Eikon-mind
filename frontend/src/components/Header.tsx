import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router"
import { useApp } from "@/contexts/AppContext"

export default function Header() {
  const { tr, lang, setLang, isDark, toggleDark, user, logout } = useApp()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path: string) => location.pathname === path

  const navLinks = [
    { to: "/", label: tr.nav.home },
    { to: "/about", label: tr.nav.about },
    { to: "/services", label: tr.nav.services },
    { to: "/therapy", label: tr.nav.therapyTypes },
  ]

  const handleLogout = () => {
    logout()
    navigate("/")
    setMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="site-container">
        <div className="flex items-center justify-between h-16 lg:h-18">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <img
              src="/assets/eikon-mind-mark.png"
              alt="Eikon Mind"
              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold font-display"
            />
            <span className="font-display font-semibold text-foreground text-lg hidden sm:block">
              Eikon Mind
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`text-sm font-medium transition-colors duration-150 ${
                  isActive(l.to)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-2 lg:gap-3">
            {/* Lang switcher */}
            <div className="hidden sm:flex items-center bg-muted rounded-full p-0.5">
              <button
                onClick={() => setLang("en")}
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                  lang === "en"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang("ro")}
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                  lang === "ro"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                RO
              </button>
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleDark}
              aria-label="Toggle theme"
              className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150"
            >
              {isDark ? (
                <svg
                  className="w-4 h-4"
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
                  className="w-4 h-4"
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

            {/* Auth buttons */}
            {user ? (
              <div className="hidden lg:flex items-center gap-2">
                <Link
                  to={user.role === "admin" ? "/admin" : "/client"}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {user.firstName}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {tr.nav.logout}
                </button>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
                >
                  {tr.nav.login}
                </Link>
                <Link
                  to="/client/book"
                  className="text-sm font-semibold bg-primary text-primary-foreground px-4 py-1.5 rounded-full hover:opacity-90 transition-opacity"
                >
                  {tr.nav.bookAppointment}
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle menu"
              className="lg:hidden w-8 h-8 flex flex-col items-center justify-center gap-1.5 text-foreground"
            >
              <span
                className={`block w-5 h-0.5 bg-current transition-all duration-200 ${
                  menuOpen ? "rotate-45 translate-y-2" : ""
                }`}
              />
              <span
                className={`block w-5 h-0.5 bg-current transition-all duration-200 ${
                  menuOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`block w-5 h-0.5 bg-current transition-all duration-200 ${
                  menuOpen ? "-rotate-45 -translate-y-2" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden border-t border-border bg-background">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMenuOpen(false)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(l.to)
                    ? "bg-muted text-primary"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <div className="border-t border-border mt-2 pt-3 flex flex-col gap-1">
              {/* Lang switcher mobile */}
              <div className="flex items-center gap-1 px-3 py-1">
                <button
                  onClick={() => {
                    setLang("en")
                    setMenuOpen(false)
                  }}
                  className={`text-sm font-semibold px-3 py-1 rounded-full ${
                    lang === "en"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => {
                    setLang("ro")
                    setMenuOpen(false)
                  }}
                  className={`text-sm font-semibold px-3 py-1 rounded-full ${
                    lang === "ro"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  RO
                </button>
              </div>
              {user ? (
                <>
                  <Link
                    to={user.role === "admin" ? "/admin" : "/client"}
                    onClick={() => setMenuOpen(false)}
                    className="px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted"
                  >
                    {user.firstName} —{" "}
                    {user.role === "admin" ? "Admin" : tr.client.overview}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 rounded-lg text-sm font-medium text-left text-foreground hover:bg-muted"
                  >
                    {tr.nav.logout}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted"
                  >
                    {tr.nav.login}
                  </Link>
                  <Link
                    to="/client/book"
                    onClick={() => setMenuOpen(false)}
                    className="mx-3 mt-1 text-center text-sm font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-full"
                  >
                    {tr.nav.bookAppointment}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
