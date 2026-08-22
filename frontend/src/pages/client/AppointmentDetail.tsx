import { useParams, Link, Navigate } from "react-router"
import { useApp } from "@/contexts/AppContext"
import StatusBadge from "@/components/StatusBadge"
import { getServiceLabel } from "@/data/mockData"
import { formatAppointmentDate } from "@/utils/date"

export default function AppointmentDetail() {
  const { id } = useParams()
  const { appointments, user, tr, lang } = useApp()
  const c = tr.client

  const appt = appointments.find((a) => a.id === id && a.clientId === user!.id)
  if (!appt) return <Navigate to="/client/appointments" replace />

  return (
    <div className="page-enter page-stack page-container">
      <div>
        <Link
          to="/client/appointments"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          ← {c.backToAppointments}
        </Link>
        <h1 className="font-display text-2xl font-semibold text-foreground">
          {c.appointmentDetails}
        </h1>
      </div>

      <div className="surface-card divide-y divide-border overflow-hidden">
        {[
          { label: c.service, value: getServiceLabel(appt.service, lang) },
          {
            label: c.date,
            value: formatAppointmentDate(appt.date, lang, "long"),
          },
          { label: c.time, value: appt.time },
          {
            label: c.therapyMode,
            value: tr.booking.therapyModes[appt.therapyMode],
          },
          { label: c.therapist, value: appt.therapist },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="flex items-start justify-between px-5 py-4 gap-4"
          >
            <span className="text-sm text-muted-foreground shrink-0">
              {label}
            </span>
            <span className="text-sm font-medium text-foreground text-right">
              {value}
            </span>
          </div>
        ))}
        <div className="flex items-start justify-between px-5 py-4 gap-4">
          <span className="text-sm text-muted-foreground shrink-0">
            {c.status}
          </span>
          <StatusBadge status={appt.status} />
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-muted-foreground mb-1">{c.notes}</p>
          <p className="text-sm text-foreground">{appt.notes || c.noNotes}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Link
          to="/client/appointments"
          className="flex-1 text-center button-secondary"
        >
          {c.backToAppointments}
        </Link>
        <Link
          to="/client/book"
          className="flex-1 text-center bg-primary text-primary-foreground py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          {c.bookNew}
        </Link>
      </div>
    </div>
  )
}
