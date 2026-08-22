import { Link } from "react-router"
import { useApp } from "@/contexts/AppContext"
import { SERVICE_CATALOG } from "@/data/mockData"

export default function Footer() {
  const { tr, lang, setLang } = useApp()
  const year = new Date().getFullYear()

  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="site-container py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <img
                src="/assets/eikon-mind-mark.png"
                alt="Eikon Mind"
                className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold font-display"
              />
              <span className="font-display font-semibold text-foreground">
                Eikon Mind
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              {tr.footer.tagline}
            </p>
          </div>

          {/* Nav */}
          <div>
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">
              {tr.footer.links}
            </h3>
            <ul className="flex flex-col gap-2.5">
              {[
                { to: "/", label: tr.nav.home },
                { to: "/about", label: tr.nav.about },
                { to: "/services", label: tr.nav.services },
                { to: "/therapy", label: tr.nav.therapyTypes },
              ].map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">
              {tr.footer.servicesHeading}
            </h3>
            <ul className="flex flex-col gap-2.5">
              {SERVICE_CATALOG.map((service, i) => (
                <li key={service.id}>
                  <Link
                    to={`/services#${service.id}`}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {tr.services.items[i].title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">
              {tr.footer.contact}
            </h3>
            <ul className="flex flex-col gap-2.5">
              <li className="text-sm text-muted-foreground">
                {tr.footer.address}
              </li>
              <li>
                <a
                  href={`mailto:${tr.footer.email}`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {tr.footer.email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${tr.footer.phone}`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {tr.footer.phone}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {year} Eikon Mind. {tr.footer.rights}
          </p>
          <div className="flex items-center gap-4">
            <Link
              to="/privacy"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {tr.footer.privacy}
            </Link>
            <Link
              to="/terms"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {tr.footer.terms}
            </Link>
            {/* Lang switcher */}
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
          </div>
        </div>
      </div>
    </footer>
  )
}
