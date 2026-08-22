import { Link } from "react-router"
import { useApp } from "@/contexts/AppContext"

export default function NotFound() {
  const { tr } = useApp()
  return (
    <div className="not-found-page">
      <div className="text-center">
        <p className="font-display text-7xl font-semibold text-primary/20 mb-4">
          404
        </p>
        <h1 className="font-display text-2xl font-semibold text-foreground mb-3">
          Page not found
        </h1>
        <p className="text-muted-foreground mb-8">
          The page you were looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          {tr.nav.home}
        </Link>
      </div>
    </div>
  )
}
