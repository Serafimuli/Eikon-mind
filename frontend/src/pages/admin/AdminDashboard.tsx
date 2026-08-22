import { Link } from "react-router"
import { useApp } from "@/contexts/AppContext"
import StatusBadge from "@/components/StatusBadge"
import { getServiceLabel } from "@/data/mockData"
import {
  getToday,
  getUpcomingAppointments,
  sortAppointments,
} from "@/utils/appointments"
import { formatAppointmentDate } from "@/utils/date"

export default function AdminDashboard() {
  const { appointments, tr, lang } = useApp()
  const a = tr.admin

  const today = getToday()
  const todayAppts = sortAppointments(
    appointments.filter((appointment) => appointment.date === today),
  )
  const upcoming = getUpcomingAppointments(appointments, today)

  return (
    <div className="page-enter page-stack">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">
          {a.dashboard}
        </h1>
        <Link to="/admin/add" className="button-primary">
          + {a.addAppointment}
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="surface-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            {a.todayAppointments}
          </p>
          <p className="font-display text-3xl font-semibold text-foreground">
            {todayAppts.length}
          </p>
        </div>
        <div className="surface-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            {a.totalUpcoming}
          </p>
          <p className="font-display text-3xl font-semibold text-foreground">
            {upcoming.length}
          </p>
        </div>
        <div className="surface-card p-5 col-span-2 sm:col-span-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            {a.total}
          </p>
          <p className="font-display text-3xl font-semibold text-foreground">
            {appointments.length}
          </p>
        </div>
      </div>

      {/* Today's schedule */}
      <div>
        <h2 className="font-display text-lg font-semibold text-foreground mb-3">
          {a.todayAppointments}
        </h2>
        {todayAppts.length === 0 ? (
          <div className="surface-card p-8 text-center text-muted-foreground">
            {a.noToday}
          </div>
        ) : (
          <div className="surface-card overflow-hidden">
            <div className="divide-y divide-border">
              {todayAppts.map((ap) => (
                <div key={ap.id} className="flex items-center gap-4 px-5 py-4">
                  <span className="font-mono text-sm text-muted-foreground w-14 shrink-0">
                    {ap.time}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {ap.clientName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getServiceLabel(ap.service, lang)} ·{" "}
                      {tr.booking.therapyModes[ap.therapyMode]}
                    </p>
                  </div>
                  <StatusBadge status={ap.status} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Upcoming */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-semibold text-foreground">
            {a.upcomingAppointments}
          </h2>
          <Link
            to="/admin/appointments"
            className="text-xs font-semibold text-primary hover:underline"
          >
            {a.appointments} →
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <div className="surface-card p-8 text-center text-muted-foreground">
            {a.noResults}
          </div>
        ) : (
          <div className="surface-card overflow-hidden">
            <div className="divide-y divide-border">
              {upcoming.slice(0, 6).map((ap) => (
                <div
                  key={ap.id}
                  className="flex items-center gap-4 px-5 py-3.5"
                >
                  <span className="text-xs text-muted-foreground w-20 shrink-0">
                    {formatAppointmentDate(ap.date, lang)} · {ap.time}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {ap.clientName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getServiceLabel(ap.service, lang)} ·{" "}
                      {tr.booking.therapyModes[ap.therapyMode]}
                    </p>
                  </div>
                  <StatusBadge status={ap.status} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
