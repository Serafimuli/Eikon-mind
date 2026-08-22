import { useState, SubmitEvent } from "react"
import { Link, useNavigate } from "react-router"
import { useApp } from "@/contexts/AppContext"
import { SERVICES_EN, SERVICES_RO, TIME_SLOTS } from "@/data/mockData"
import type { AppointmentStatus } from "@/data/mockData"
import type { TherapyMode } from "@/data/mockData"
import { THERAPIST_NAME } from "@/data/appConfig"
import type { AddAppointmentForm } from "./AddAppointment.types"
import { validateAppointmentForm } from "./AddAppointment.utils"

export default function AddAppointment() {
  const { tr, lang, addAppointment, users } = useApp()
  const a = tr.admin
  const navigate = useNavigate()

  const clients = users.filter((u) => u.role === "client")
  const statuses: AppointmentStatus[] = ["pending", "confirmed"]

  const [form, setForm] = useState<AddAppointmentForm>({
    clientId: "",
    date: "",
    time: "",
    service: "",
    therapyMode: "individual" as TherapyMode,
    status: "pending" as AppointmentStatus,
    notes: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const set =
    (field: string) =>
    (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) => {
      setForm((p) => ({ ...p, [field]: e.target.value }))
      setErrors((p) => {
        const n = { ...p }
        delete n[field]
        return n
      })
    }

  const handleSubmit = async (ev: SubmitEvent) => {
    ev.preventDefault()
    const e = validateAppointmentForm(form, tr.auth.errors.required)
    if (Object.keys(e).length) {
      setErrors(e)
      return
    }
    setLoading(true)
    await new Promise((r) => setTimeout(r, 500))
    const client = clients.find((c) => c.id === form.clientId)!
    addAppointment({
      clientId: form.clientId,
      clientName: `${client.firstName} ${client.lastName}`,
      service: form.service,
      date: form.date,
      time: form.time,
      therapyMode: form.therapyMode,
      status: form.status,
      therapist: THERAPIST_NAME,
      notes: form.notes || undefined,
    })
    setLoading(false)
    setSuccess(true)
    setTimeout(() => navigate("/admin/appointments"), 1500)
  }

  const field = (label: string, id: string, required = true) => ({
    label,
    id,
    error: errors[id],
    required,
  })

  if (success) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-primary/10 text-primary text-2xl flex items-center justify-center">
          ✓
        </div>
        <h2 className="font-display text-xl font-semibold text-foreground">
          {a.addSuccess}
        </h2>
        <p className="text-sm text-muted-foreground">{a.redirecting}</p>
      </div>
    )
  }

  return (
    <div className="page-enter page-stack page-container">
      <div>
        <Link
          to="/admin/appointments"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          ← {a.appointments}
        </Link>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">
          {a.addTitle}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{a.addSub}</p>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="surface-card p-6 space-y-5"
      >
        {/* Client */}
        <div>
          <label className="form-label" htmlFor="clientId">
            {a.client}
          </label>
          <select
            id="clientId"
            value={form.clientId}
            onChange={set("clientId")}
            className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all ${
              errors.clientId ? "border-red-400" : "border-border"
            }`}
          >
            <option value="">{a.selectClient}</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName}
              </option>
            ))}
          </select>
          {errors.clientId && (
            <p className="text-xs text-red-500 mt-1">{errors.clientId}</p>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="form-label" htmlFor="date">
            {tr.client.date}
          </label>
          <input
            id="date"
            type="date"
            value={form.date}
            onChange={set("date")}
            min={new Date().toISOString().split("T")[0]}
            className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all ${
              errors.date ? "border-red-400" : "border-border"
            }`}
          />
          {errors.date && (
            <p className="text-xs text-red-500 mt-1">{errors.date}</p>
          )}
        </div>

        {/* Time */}
        <div>
          <label className="form-label" htmlFor="time">
            {tr.client.time}
          </label>
          <select
            id="time"
            value={form.time}
            onChange={set("time")}
            className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all ${
              errors.time ? "border-red-400" : "border-border"
            }`}
          >
            <option value="">{a.timePlaceholder}</option>
            {TIME_SLOTS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {errors.time && (
            <p className="text-xs text-red-500 mt-1">{errors.time}</p>
          )}
        </div>

        {/* Service */}
        <div>
          <label className="form-label" htmlFor="service">
            {tr.client.service}
          </label>
          <select
            id="service"
            value={form.service}
            onChange={set("service")}
            className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all ${
              errors.service ? "border-red-400" : "border-border"
            }`}
          >
            <option value="">{a.selectService}</option>
            {SERVICES_EN.map((s, i) => (
              <option key={s} value={s}>
                {lang === "ro" ? SERVICES_RO[i] : s}
              </option>
            ))}
          </select>
          {errors.service && (
            <p className="text-xs text-red-500 mt-1">{errors.service}</p>
          )}
        </div>

        <div>
          <label className="form-label" htmlFor="therapyMode">
            {tr.client.therapyMode}
          </label>
          <select
            id="therapyMode"
            value={form.therapyMode}
            onChange={set("therapyMode")}
            className="form-control"
          >
            {(Object.keys(tr.booking.therapyModes) as TherapyMode[]).map(
              (mode) => (
                <option key={mode} value={mode}>
                  {tr.booking.therapyModes[mode]}
                </option>
              ),
            )}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="form-label" htmlFor="status">
            {tr.client.status}
          </label>
          <select
            id="status"
            value={form.status}
            onChange={set("status")}
            className="form-control"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {tr.status[s]}
              </option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="form-label" htmlFor="notes">
            {tr.client.notes}
          </label>
          <textarea
            id="notes"
            rows={3}
            value={form.notes}
            onChange={set("notes")}
            placeholder={a.optionalNotes}
            className="form-control"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Link
            to="/admin/appointments"
            className="flex-1 text-center border border-border text-foreground py-3 rounded-full text-sm font-medium hover:bg-muted transition-colors"
          >
            {a.cancel}
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-primary text-primary-foreground py-3 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && (
              <span className="inline-block w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
            )}
            {a.addBtn}
          </button>
        </div>
      </form>
    </div>
  )
}
