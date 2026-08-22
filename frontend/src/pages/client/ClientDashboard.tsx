import { Link } from "react-router"
import { useApp } from "@/contexts/AppContext"
import StatusBadge from "@/components/StatusBadge"
import { getServiceLabel } from "@/data/mockData"
import { getClientAppointments, getToday } from "@/utils/appointments"
import { formatAppointmentDate } from "@/utils/date"

export default function ClientDashboard() {
  const { user, appointments, tr, lang } = useApp()
  const c = tr.client

  const today = getToday()
  const myAppointments = getClientAppointments(appointments, user!.id)
  const upcoming = myAppointments
    .filter((a) => a.date >= today && a.status !== "cancelled")
    .sort((a, b) => a.date.localeCompare(b.date))
  const past = myAppointments.filter(
    (a) =>
      a.date < today || a.status === "completed" || a.status === "cancelled",
  )
  const next = upcoming[0]

  const formatDate = (date: string) => formatAppointmentDate(date, lang, "long")

  return (
    <div className="page-enter page-stack">
      {/* Welcome */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{c.welcome}</p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">
            {user!.firstName} {user!.lastName}
          </h1>
        </div>
        <Link to="/client/book" className="button-primary shrink-0">
          {c.bookNew}
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="surface-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            {c.upcomingCount}
          </p>
          <p className="font-display text-3xl font-semibold text-foreground">
            {upcoming.length}
          </p>
        </div>
        <div className="surface-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            {c.pastCount}
          </p>
          <p className="font-display text-3xl font-semibold text-foreground">
            {past.length}
          </p>
        </div>
      </div>

      {/* Next appointment */}
      <div>
        <h2 className="font-display text-lg font-semibold text-foreground mb-3">
          {c.nextAppointment}
        </h2>
        {next ? (
          <div className="surface-card p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-2">
                <p className="font-semibold text-foreground">
                  {getServiceLabel(next.service, lang)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(next.date)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {next.time} · {tr.booking.therapyModes[next.therapyMode]}{" "}
                  · {next.therapist}
                </p>
              </div>
              <StatusBadge status={next.status} />
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <Link
                to={`/client/appointments/${next.id}`}
                className="text-sm font-semibold text-primary hover:underline"
              >
                {c.viewDetails} →
              </Link>
            </div>
          </div>
        ) : (
          <div className="surface-card p-8 text-center">
            <p className="text-muted-foreground mb-4">{c.noAppointmentsYet}</p>
            <Link to="/client/book" className="inline-block button-primary">
              {c.bookFirst}
            </Link>
          </div>
        )}
      </div>

      {/* Recent upcoming */}
      {upcoming.length > 1 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-semibold text-foreground">
              {c.upcoming}
            </h2>
            <Link
              to="/client/appointments"
              className="text-xs font-semibold text-primary hover:underline"
            >
              {c.myAppointments} →
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {upcoming.slice(1, 3).map((a) => (
              <Link
                key={a.id}
                to={`/client/appointments/${a.id}`}
                className="flex items-center justify-between surface-card surface-card--compact px-5 py-3.5 hover:border-primary/40 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {getServiceLabel(a.service, lang)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(a.date)} · {a.time}
                  </p>
                </div>
                <StatusBadge status={a.status} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
