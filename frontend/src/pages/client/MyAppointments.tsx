import { useState } from "react"
import { Link } from "react-router"
import { useApp } from "@/contexts/AppContext"
import StatusBadge from "@/components/StatusBadge"
import { getServiceLabel } from "@/data/mockData"
import {
  getClientAppointments,
  splitClientAppointments,
} from "@/utils/appointments"
import { formatAppointmentDate } from "@/utils/date"

export default function MyAppointments() {
  const { user, appointments, tr, lang } = useApp()
  const c = tr.client
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming")

  const { upcoming, past } = splitClientAppointments(
    getClientAppointments(appointments, user!.id),
  )
  const list = tab === "upcoming" ? upcoming : past

  const formatDate = (date: string) => formatAppointmentDate(date, lang)

  return (
    <div className="page-enter page-stack">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">
          {c.myAppointments}
        </h1>
        <Link to="/client/book" className="button-primary">
          {c.bookNew}
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {(["upcoming", "past"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "upcoming" ? c.upcoming : c.past}{" "}
            <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">
              {(t === "upcoming" ? upcoming : past).length}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      {list.length === 0 ? (
        <div className="empty-state">
          <p className="text-muted-foreground mb-4">{c.noUpcoming}</p>
          {tab === "upcoming" && (
            <Link to="/client/book" className="inline-block button-primary">
              {c.bookFirst}
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Table — desktop */}
          <div className="table-shell desktop-only">
            <table className="data-table">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {c.date}
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {c.time}
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {c.service}
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {c.therapyMode}
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {c.status}
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.map((a) => (
                  <tr
                    key={a.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-5 py-4 text-foreground">
                      {formatDate(a.date)}
                    </td>
                    <td className="px-5 py-4 text-foreground">{a.time}</td>
                    <td className="px-5 py-4 text-foreground">
                      {getServiceLabel(a.service, lang)}
                    </td>
                    <td className="px-5 py-4 text-foreground">
                      {tr.booking.therapyModes[a.therapyMode]}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        to={`/client/appointments/${a.id}`}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        {c.viewDetails}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards — mobile */}
          <div className="mobile-only mobile-list flex-col gap-3">
            {list.map((a) => (
              <Link
                key={a.id}
                to={`/client/appointments/${a.id}`}
                className="surface-card surface-card--compact p-4 block hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {getServiceLabel(a.service, lang)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(a.date)} · {a.time} ·{" "}
                      {tr.booking.therapyModes[a.therapyMode]}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
