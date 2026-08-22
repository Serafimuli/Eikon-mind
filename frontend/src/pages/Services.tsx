import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router"
import { useApp } from "@/contexts/AppContext"
import {
  SERVICE_CATALOG,
  SERVICE_DETAIL_EN,
  SERVICE_DETAIL_RO,
} from "@/data/mockData"

const getServiceIdFromHash = (hash: string) => {
  const serviceId = hash.replace(/^#/, "")
  return SERVICE_CATALOG.some((service) => service.id === serviceId)
    ? serviceId
    : null
}

export default function Services() {
  const { tr, lang } = useApp()
  const sp = tr.services_page
  const location = useLocation()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<string | null>(
    () => getServiceIdFromHash(location.hash),
  )

  const serviceDetails = lang === "ro" ? SERVICE_DETAIL_RO : SERVICE_DETAIL_EN
  const detail = selected ? serviceDetails.find((s) => s.id === selected) : null
  const selectedImage = selected
    ? SERVICE_CATALOG.find((service) => service.id === selected)?.image
    : undefined
  const serviceItems = tr.services.items

  useEffect(() => {
    const serviceId = getServiceIdFromHash(location.hash)
    setSelected(serviceId)
  }, [location.hash])

  const selectService = (serviceId: string) => {
    navigate(
      {
        pathname: location.pathname,
        search: location.search,
        hash: `#${serviceId}`,
      },
      { replace: true },
    )
  }

  return (
    <div className="animate-fade-in">
      <section className="public-page-header">
        <div className="site-container">
          <span className="inline-block text-xs font-semibold text-primary uppercase tracking-widest mb-3">
            {sp.title}
          </span>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground whitespace-pre-line">
            {sp.heading}
          </h1>
          <p className="text-base text-muted-foreground mt-4 max-w-2xl">
            {sp.sub}
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="site-container">
          <div className="max-w-5xl mx-auto">
            {/* Service tags */}
            <div className="flex flex-wrap justify-center gap-2.5 mb-10">
              {SERVICE_CATALOG.map((service, i) => {
                const item = serviceItems[i]
                const isSelected = selected === service.id

                return (
                  <button
                    key={service.id}
                    id={service.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => selectService(service.id)}
                    className={`inline-flex scroll-mt-[5rem] items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5"
                    }`}
                  >
                    <span aria-hidden>{item.icon}</span>
                    {item.title}
                  </button>
                )
              })}
            </div>

            {/* Detail panel */}
            <div>
              {detail ? (
                <div
                  className="animate-fade-in scroll-mt-6"
                >
                  <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] gap-8 lg:gap-10 items-start mb-8">
                    <div className="flex items-start gap-4">
                      <span className="text-4xl shrink-0">{detail.icon}</span>
                      <div>
                        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-foreground mb-2">
                          {detail.heading}
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                          {detail.sub}
                        </p>
                      </div>
                    </div>
                    <div className="surface-card overflow-hidden aspect-[4/3] bg-muted">
                      <img
                        src={selectedImage}
                        alt={detail.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <div className="grid items-stretch sm:grid-cols-2 gap-6 mb-8">
                    <div className="surface-card surface-card--compact p-5">
                      <h3 className="font-display text-sm font-semibold text-foreground mb-3">
                        {sp.commonReasons}
                      </h3>
                      <ul className="flex flex-col gap-1.5">
                        {detail.reasons.map((r) => (
                          <li
                            key={r}
                            className="flex items-start gap-2 text-sm text-muted-foreground"
                          >
                            <span className="text-primary mt-0.5 shrink-0">
                              ·
                            </span>
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex h-full min-h-0 flex-col gap-4">
                      <div className="surface-card surface-card--compact flex-1 p-5">
                        <h3 className="font-display text-sm font-semibold text-foreground mb-2">
                          {sp.howTherapyHelps}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {detail.howHelps}
                        </p>
                      </div>
                      <div className="surface-card surface-card--compact flex-1 p-5">
                        <h3 className="font-display text-sm font-semibold text-foreground mb-2">
                          {sp.whatSessionsInvolve}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {detail.involves}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Link
                    to="/client/book"
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    {tr.cta.primary}
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-64 text-center text-muted-foreground">
                  <span className="text-4xl mb-4">↑</span>
                  <p className="text-base">{sp.selectPrompt}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
