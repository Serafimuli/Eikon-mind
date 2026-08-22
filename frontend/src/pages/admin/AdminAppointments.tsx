import { useState } from "react"
import { useApp } from "@/contexts/AppContext"
import StatusBadge from "@/components/StatusBadge"
import Modal from "@/components/Modal"
import {
  type Appointment,
  SERVICES_EN,
  SERVICES_RO,
  getServiceLabel,
  TIME_SLOTS,
} from "@/data/mockData"
import type { AppointmentStatus } from "@/data/mockData"
import { filterAppointments } from "./AdminAppointments.utils"
import type { AppointmentFilterStatus } from "./AdminAppointments.types"
import CalendarView from "./CalendarView"

export default function AdminAppointments() {
  const {
    appointments,
    deleteAppointment,
    updateAppointmentStatus,
    updateAppointment,
    tr,
    lang,
  } = useApp()
  const a = tr.admin
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list")
  const [filterStatus, setFilterStatus] =
    useState<AppointmentFilterStatus>("all")
  const [filterService, setFilterService] = useState("all")
  const [detailsTarget, setDetailsTarget] = useState<Appointment | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Appointment | null>(null)
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(
    null,
  )
  const [rescheduleDate, setRescheduleDate] = useState("")
  const [rescheduleTime, setRescheduleTime] = useState("")

  const filtered = filterAppointments(appointments, filterStatus, filterService)

  const formatDate = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString(
      lang === "ro" ? "ro-RO" : "en-GB",
      { weekday: "short", day: "numeric", month: "short", year: "numeric" },
    )

  const handleDelete = () => {
    if (deleteTarget) {
      deleteAppointment(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  const openReschedule = (appointment: Appointment) => {
    setRescheduleTarget(appointment)
    setRescheduleDate(appointment.date)
    setRescheduleTime(appointment.time)
  }

  const closeReschedule = () => {
    setRescheduleTarget(null)
    setRescheduleDate("")
    setRescheduleTime("")
  }

  const handleReschedule = () => {
    if (!rescheduleTarget || !rescheduleDate || !rescheduleTime) return
    updateAppointment(rescheduleTarget.id, {
      date: rescheduleDate,
      time: rescheduleTime,
    })
    closeReschedule()
  }

  const actionButtons = (appointment: Appointment) => (
    <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:flex-col sm:items-start sm:justify-start">
      <button
        onClick={(event) => {
          event.stopPropagation()
          setDeleteTarget(appointment)
        }}
        className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-500 transition-colors hover:bg-red-50"
      >
        {a.delete}
      </button>
      {appointment.status === "pending" && (
        <button
          onClick={(event) => {
            event.stopPropagation()
            updateAppointmentStatus(appointment.id, "confirmed")
          }}
          className="rounded-full border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition-colors hover:bg-emerald-50"
        >
          {a.accept}
        </button>
      )}
      {appointment.status === "confirmed" && (
        <button
          onClick={(event) => {
            event.stopPropagation()
            openReschedule(appointment)
          }}
          className="rounded-full border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/5"
        >
          {a.reschedule}
        </button>
      )}
    </div>
  )

  const statuses: AppointmentStatus[] = [
    "pending",
    "confirmed",
    "completed",
    "cancelled",
  ]

  return (
    <div className="page-enter page-stack">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">
          {a.appointments}
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "list"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {a.listView}
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "calendar"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {a.calendarView}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">
            {a.all} {a.filterStatus}
          </option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {tr.status[s]}
            </option>
          ))}
        </select>
        <select
          value={filterService}
          onChange={(e) => setFilterService(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">
            {a.all} {a.filterService.toLowerCase()}
          </option>
          {SERVICES_EN.map((s, i) => (
            <option key={s} value={s}>
              {lang === "ro" ? SERVICES_RO[i] : s}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="surface-card p-12 text-center text-muted-foreground">
          {a.noResults}
        </div>
      ) : viewMode === "list" ? (
        <>
          {/* Table desktop */}
          <div className="table-shell desktop-only">
            <table className="data-table">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {[
                    a.filterDate,
                    tr.client.time,
                    a.client,
                    tr.client.service,
                    tr.client.therapyMode,
                    a.filterStatus,
                    a.actions,
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((ap) => (
                  <tr
                    key={ap.id}
                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setDetailsTarget(ap)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        setDetailsTarget(ap)
                      }
                    }}
                    tabIndex={0}
                  >
                    <td className="px-4 py-3 text-foreground whitespace-nowrap">
                      {formatDate(ap.date)}
                    </td>
                    <td className="px-4 py-3 text-foreground font-mono">
                      {ap.time}
                    </td>
                    <td className="px-4 py-3 text-foreground font-medium">
                      {ap.clientName}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {getServiceLabel(ap.service, lang)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {tr.booking.therapyModes[ap.therapyMode]}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={ap.status} />
                    </td>
                    <td className="px-4 py-3">{actionButtons(ap)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards mobile */}
          <div className="mobile-only mobile-list flex-col gap-3">
            {filtered.map((ap) => (
              <div
                key={ap.id}
                className="surface-card surface-card--compact cursor-pointer p-4 transition-colors hover:border-primary/40"
                onClick={() => setDetailsTarget(ap)}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {ap.clientName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getServiceLabel(ap.service, lang)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(ap.date)} · {ap.time} ·{" "}
                      {tr.booking.therapyModes[ap.therapyMode]}
                    </p>
                  </div>
                  <StatusBadge status={ap.status} />
                </div>
                {actionButtons(ap)}
              </div>
            ))}
          </div>
        </>
      ) : (
        <CalendarView
          appointments={filtered}
          weekdays={a.calendarWeekdays}
          monthLocale={lang === "ro" ? "ro-RO" : "en-GB"}
        />
      )}

      {/* Appointment details */}
      <Modal
        open={!!detailsTarget}
        onClose={() => setDetailsTarget(null)}
        title={tr.client.appointmentDetails}
      >
        {detailsTarget && (
          <div className="space-y-3 text-sm">
            <p>
              <span className="text-muted-foreground">{a.client}:</span>{" "}
              <span className="font-medium">{detailsTarget.clientName}</span>
            </p>
            <p>
              <span className="text-muted-foreground">{tr.client.date}:</span>{" "}
              <span className="font-medium">{formatDate(detailsTarget.date)}</span>
            </p>
            <p>
              <span className="text-muted-foreground">{tr.client.time}:</span>{" "}
              <span className="font-medium">{detailsTarget.time}</span>
            </p>
            <p>
              <span className="text-muted-foreground">{tr.client.service}:</span>{" "}
              <span className="font-medium">
                {getServiceLabel(detailsTarget.service, lang)}
              </span>
            </p>
            <p>
              <span className="text-muted-foreground">{tr.client.therapyMode}:</span>{" "}
              <span className="font-medium">
                {tr.booking.therapyModes[detailsTarget.therapyMode]}
              </span>
            </p>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{a.filterStatus}:</span>
              <StatusBadge status={detailsTarget.status} />
            </div>
            {detailsTarget.notes && (
              <p>
                <span className="text-muted-foreground">{tr.client.notes}:</span>{" "}
                <span className="font-medium">{detailsTarget.notes}</span>
              </p>
            )}
          </div>
        )}
      </Modal>

      {/* Delete modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={a.deleteTitle}
      >
        <p className="text-sm text-muted-foreground mb-6">{a.deleteMessage}</p>
        {deleteTarget && (
          <div className="bg-muted rounded-lg p-3 text-sm mb-6 space-y-1">
            <p>
              <span className="text-muted-foreground">{a.client}:</span>{" "}
              <span className="font-medium">{deleteTarget.clientName}</span>
            </p>
            <p>
              <span className="text-muted-foreground">{tr.client.date}:</span>{" "}
              <span className="font-medium">
                {formatDate(deleteTarget.date)} · {deleteTarget.time}
              </span>
            </p>
            <p>
              <span className="text-muted-foreground">
                {tr.client.service}:
              </span>{" "}
              <span className="font-medium">
                {getServiceLabel(deleteTarget.service, lang)}
              </span>
            </p>
            <p>
              <span className="text-muted-foreground">
                {tr.client.therapyMode}:
              </span>{" "}
              <span className="font-medium">
                {tr.booking.therapyModes[deleteTarget.therapyMode]}
              </span>
            </p>
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={() => setDeleteTarget(null)}
            className="flex-1 button-secondary"
          >
            {a.cancel}
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 bg-red-500 text-white py-2.5 rounded-full text-sm font-semibold hover:bg-red-600 transition-colors"
          >
            {a.deleteConfirm}
          </button>
        </div>
      </Modal>

      <Modal
        open={!!rescheduleTarget}
        onClose={closeReschedule}
        title={a.rescheduleTitle}
      >
        <p className="text-sm text-muted-foreground mb-6">
          {a.rescheduleMessage}
        </p>
        <div className="space-y-4 mb-6">
          <div>
            <label htmlFor="reschedule-date" className="form-label">
              {tr.client.date}
            </label>
            <input
              id="reschedule-date"
              type="date"
              value={rescheduleDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setRescheduleDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label htmlFor="reschedule-time" className="form-label">
              {tr.client.time}
            </label>
            <select
              id="reschedule-time"
              value={rescheduleTime}
              onChange={(e) => setRescheduleTime(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {TIME_SLOTS.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={closeReschedule} className="flex-1 button-secondary">
            {a.cancel}
          </button>
          <button
            onClick={handleReschedule}
            disabled={!rescheduleDate || !rescheduleTime}
            className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {a.saveReschedule}
          </button>
        </div>
      </Modal>
    </div>
  )
}
