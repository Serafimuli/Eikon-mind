import { useState } from "react"
import { Link } from "react-router"
import { useApp } from "@/contexts/AppContext"
import { THERAPY_TYPES_EN, THERAPY_TYPES_RO } from "@/data/mockData"

export default function TherapyTypes() {
  const { tr, lang } = useApp()
  const tp = tr.therapyPage
  const therapyTypes = lang === "ro" ? THERAPY_TYPES_RO : THERAPY_TYPES_EN
  const [open, setOpen] = useState<string | null>(therapyTypes[0].id)

  return (
    <div className="animate-fade-in">
      <section className="public-page-header">
        <div className="site-container">
          <span className="inline-block text-xs font-semibold text-primary uppercase tracking-widest mb-3">
            {tp.title}
          </span>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground whitespace-pre-line">
            {tp.heading}
          </h1>
          <p className="text-base text-muted-foreground mt-4 max-w-2xl">
            {tp.sub}
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3">
            {therapyTypes.map((therapy) => (
              <div
                key={therapy.id}
                className="border border-border rounded-2xl overflow-hidden bg-card transition-all duration-200"
              >
                <button
                  onClick={() =>
                    setOpen(open === therapy.id ? null : therapy.id)
                  }
                  className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-muted/50 transition-colors"
                  aria-expanded={open === therapy.id}
                >
                  <div>
                    <h2 className="font-display text-lg font-semibold text-foreground">
                      {therapy.name}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {therapy.short}
                    </p>
                  </div>
                  <span
                    className={`text-muted-foreground transition-transform duration-200 ml-4 shrink-0 ${
                      open === therapy.id ? "rotate-180" : ""
                    }`}
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
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </span>
                </button>

                {open === therapy.id && (
                  <div className="px-6 pb-6 animate-fade-in border-t border-border">
                    <p className="text-base text-muted-foreground leading-relaxed mt-5 mb-6">
                      {therapy.description}
                    </p>
                    <div className="grid sm:grid-cols-3 gap-4 mb-6">
                      <div className="bg-background border border-border rounded-xl p-4">
                        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                          {tp.goals}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {therapy.goals}
                        </p>
                      </div>
                      <div className="bg-background border border-border rounded-xl p-4">
                        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                          {tp.howItWorks}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {therapy.howItWorks}
                        </p>
                      </div>
                      <div className="bg-background border border-border rounded-xl p-4">
                        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                          {tp.suitableFor}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {therapy.suitableFor}
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/client/book"
                      className="inline-flex items-center gap-2 button-primary"
                    >
                      {tp.bookCta}
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
