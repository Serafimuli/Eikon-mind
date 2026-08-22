import { useState } from "react"
import { useApp } from "@/contexts/AppContext"

export default function Profile() {
  const { user, tr, lang, setLang, isDark, toggleDark } = useApp()
  const p = tr.profile
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="page-enter page-stack page-container">
      <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">
        {p.title}
      </h1>

      {/* Personal info */}
      <section className="surface-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-display text-base font-semibold text-foreground">
            {p.personalInfo}
          </h2>
        </div>
        <div className="divide-y divide-border">
          {[
            { label: tr.auth.firstName, value: user!.firstName },
            { label: tr.auth.lastName, value: user!.lastName },
            { label: tr.auth.email, value: user!.email },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex items-center justify-between px-5 py-3.5"
            >
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className="text-sm font-medium text-foreground">
                {value}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Preferences */}
      <section className="surface-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-display text-base font-semibold text-foreground">
            {p.preferences}
          </h2>
        </div>
        <div className="divide-y divide-border">
          {/* Language */}
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-sm text-muted-foreground">
              {p.preferredLanguage}
            </span>
            <div className="segmented-control">
              <button
                onClick={() => setLang("en")}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  lang === "en"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang("ro")}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  lang === "ro"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                RO
              </button>
            </div>
          </div>
          {/* Theme */}
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-sm text-muted-foreground">
              {p.themePreference}
            </span>
            <div className="segmented-control">
              <button
                onClick={() => !isDark || toggleDark()}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  !isDark
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                {p.light}
              </button>
              <button
                onClick={() => isDark || toggleDark()}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  isDark
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                {p.dark}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          {p.save}
        </button>
        {saved && (
          <span className="text-sm text-primary font-medium animate-fade-in">
            ✓ {p.saved}
          </span>
        )}
      </div>
    </div>
  )
}
