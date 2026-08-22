import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { useApp } from "@/contexts/AppContext"
import { TIME_SLOTS } from "@/data/mockData"
import type { TherapyMode } from "@/data/mockData"
import { THERAPIST_NAME } from "@/data/appConfig"
import type { BookingStep } from "./BookAppointment.types"
import {
  getDaysInMonth,
  getFirstDayOfMonth,
  isUnavailableDate,
} from "./BookAppointment.utils"

export default function BookAppointment() {
  const { tr, lang, user, addAppointment, appointments } = useApp()
  const bk = tr.booking
  const navigate = useNavigate()

  const today = new Date()
  const [step, setStep] = useState<BookingStep>(1)
  const [service, setService] = useState("")
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [therapyMode, setTherapyMode] = useState<TherapyMode>("individual")
  const [reason, setReason] = useState("")
  const [notes, setNotes] = useState("")

  const SERVICES = bk.services
  const steps = [bk.step1, bk.step2, bk.step3, bk.step4, bk.step5]

  const bookedSlots = appointments
    .filter((a) => a.date === selectedDate && a.status !== "cancelled")
    .map((a) => a.time)

  const locale = lang === "ro" ? "ro-RO" : "en-GB"
  const monthName = new Date(calYear, calMonth, 1).toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  })
  const daysInMonth = getDaysInMonth(calYear, calMonth)
  const firstDay = (getFirstDayOfMonth(calYear, calMonth) + 6) % 7 // Mon-based

  const formatDate = (d: string) => {
    if (!d) return ""
    return new Date(d + "T12:00:00").toLocaleDateString(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const handleConfirm = () => {
    addAppointment({
      clientId: user!.id,
      clientName: `${user!.firstName} ${user!.lastName}`,
      service,
      date: selectedDate,
      time: selectedTime,
      therapyMode,
      status: "pending",
      therapist: THERAPIST_NAME,
      notes: [reason, notes].filter(Boolean).join(" · ") || undefined,
    })
    setStep(6)
  }

  const StepBar = () => (
    <div className="flex items-center gap-1 mb-8">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-1 flex-1">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
              step > i + 1
                ? "bg-primary text-primary-foreground"
                : step === i + 1
                  ? "bg-primary/20 text-primary ring-2 ring-primary"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {step > i + 1 ? "✓" : i + 1}
          </div>
          {i < steps.length - 1 && (
            <div
              className={`h-0.5 flex-1 ${
                step > i + 1 ? "bg-primary" : "bg-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )

  if (step === 6) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-12 text-center max-w-sm mx-auto space-y-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary text-3xl flex items-center justify-center">
          ✓
        </div>
        <h1 className="font-display text-2xl font-semibold text-foreground">
          {bk.successTitle}
        </h1>
        <p className="text-muted-foreground text-sm">{bk.successSub}</p>
        <div className="surface-card surface-card--compact p-4 w-full text-left space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{tr.client.service}</span>
            <span className="font-medium">{service}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{tr.client.date}</span>
            <span className="font-medium">{formatDate(selectedDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{tr.client.time}</span>
            <span className="font-medium">{selectedTime}</span>
          </div>
        </div>
        <Link
          to="/client/appointments"
          className="w-full text-center bg-primary text-primary-foreground py-3 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          {bk.viewAppointments}
        </Link>
      </div>
    )
  }

  return (
    <div className="animate-fade-in max-w-lg space-y-6">
      <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">
        {bk.title}
      </h1>
      <StepBar />

      {/* Step 1 — Service */}
      {step === 1 && (
        <div className="space-y-3">
          <p className="font-display text-lg font-semibold text-foreground">
            {bk.selectService}
          </p>
          <div className="flex flex-col gap-2">
            {SERVICES.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setService(s)
                  setStep(2)
                }}
                className={`flex items-center justify-between px-5 py-3.5 rounded-xl border text-sm font-medium text-left transition-all ${
                  service === s
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-card text-foreground hover:border-primary/40"
                }`}
              >
                {s}
                <span className="text-muted-foreground">→</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2 — Date */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="font-display text-lg font-semibold text-foreground">
            {bk.selectDate}
          </p>
          <div className="surface-card p-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => {
                  const d = new Date(calYear, calMonth - 1, 1)
                  setCalMonth(d.getMonth())
                  setCalYear(d.getFullYear())
                }}
                className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"
              >
                ←
              </button>
              <span className="font-display text-sm font-semibold text-foreground">
                {monthName}
              </span>
              <button
                onClick={() => {
                  const d = new Date(calYear, calMonth + 1, 1)
                  setCalMonth(d.getMonth())
                  setCalYear(d.getFullYear())
                }}
                className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"
              >
                →
              </button>
            </div>
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {bk.weekdaysCompact.map((d, i) => (
                <div
                  key={i}
                  className="text-center text-xs font-semibold text-muted-foreground py-1"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`e${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                (day) => {
                  const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                  const unavail = isUnavailableDate(
                    calYear,
                    calMonth,
                    day,
                    today,
                  )
                  const isSelected = selectedDate === dateStr
                  const isToday = dateStr === today.toISOString().split("T")[0]
                  return (
                    <button
                      key={day}
                      disabled={unavail}
                      onClick={() => {
                        setSelectedDate(dateStr)
                        setSelectedTime("")
                        setStep(3)
                      }}
                      className={`aspect-square flex items-center justify-center text-sm rounded-lg transition-all ${
                        isSelected
                          ? "bg-primary text-primary-foreground font-semibold"
                          : unavail
                            ? "text-muted-foreground/40 cursor-not-allowed"
                            : isToday
                              ? "ring-1 ring-primary text-primary font-semibold hover:bg-primary/10"
                              : "text-foreground hover:bg-muted"
                      }`}
                    >
                      {day}
                    </button>
                  )
                },
              )}
            </div>
          </div>
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-primary inline-block" />
              {bk.selected}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded ring-1 ring-primary inline-block" />
              {bk.today}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-muted inline-block opacity-40" />
              {bk.unavailable}
            </span>
          </div>
          <NavButtons step={step} setStep={setStep} />
        </div>
      )}

      {/* Step 3 — Time */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="font-display text-lg font-semibold text-foreground">
            {bk.selectTime}
          </p>
          <p className="text-sm text-muted-foreground">
            {formatDate(selectedDate)}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {TIME_SLOTS.map((slot) => {
              const taken = bookedSlots.includes(slot)
              return (
                <button
                  key={slot}
                  disabled={taken}
                  onClick={() => {
                    setSelectedTime(slot)
                    setStep(4)
                  }}
                  className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                    selectedTime === slot
                      ? "border-primary bg-primary/10 text-primary"
                      : taken
                        ? "border-border text-muted-foreground/40 cursor-not-allowed bg-muted/30"
                        : "border-border bg-card text-foreground hover:border-primary/40"
                  }`}
                >
                  {slot}
                  {taken && (
                    <span className="block text-xs mt-0.5 text-muted-foreground/60">
                      {bk.unavailable}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          <NavButtons step={step} setStep={setStep} />
        </div>
      )}

      {/* Step 4 — Details */}
      {step === 4 && (
        <div className="space-y-4">
          <p className="font-display text-lg font-semibold text-foreground">
            {bk.step4}
          </p>
          <div>
            <label className="form-label" htmlFor="therapyMode">
              {bk.therapyMode}
            </label>
            <select
              id="therapyMode"
              value={therapyMode}
              onChange={(e) => setTherapyMode(e.target.value as TherapyMode)}
              className="form-control"
            >
              {(Object.keys(bk.therapyModes) as TherapyMode[]).map((mode) => (
                <option key={mode} value={mode}>
                  {bk.therapyModes[mode]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label" htmlFor="reason">
              {bk.reason}
            </label>
            <textarea
              id="reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={bk.reasonPlaceholder}
              className="form-control"
            />
          </div>
          <div>
            <label className="form-label" htmlFor="notes">
              {bk.therapistNotes}
            </label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={bk.notesPlaceholder}
              className="form-control"
            />
          </div>
          <NavButtons step={step} setStep={setStep} onNext={() => setStep(5)} />
        </div>
      )}

      {/* Step 5 — Review */}
      {step === 5 && (
        <div className="space-y-4">
          <p className="font-display text-lg font-semibold text-foreground">
            {bk.reviewHeading}
          </p>
          <div className="surface-card divide-y divide-border overflow-hidden text-sm">
            {[
              { label: tr.client.service, value: service },
              { label: tr.client.date, value: formatDate(selectedDate) },
              { label: tr.client.time, value: selectedTime },
              { label: bk.therapyMode, value: bk.therapyModes[therapyMode] },
              { label: tr.client.therapist, value: THERAPIST_NAME },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between px-5 py-3.5"
              >
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium text-foreground text-right">
                  {value}
                </span>
              </div>
            ))}
            {(reason || notes) && (
              <div className="px-5 py-3.5">
                <p className="text-muted-foreground mb-1">{tr.client.notes}</p>
                <p className="text-foreground">
                  {[reason, notes].filter(Boolean).join(" — ")}
                </p>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStep(4)}
              className="flex-1 border border-border text-foreground py-3 rounded-full text-sm font-medium hover:bg-muted transition-colors"
            >
              {bk.back}
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 bg-primary text-primary-foreground py-3 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              {bk.confirm}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function NavButtons({
  step,
  setStep,
  onNext,
}: {
  step: number
  setStep: (s: any) => void
  onNext?: () => void
}) {
  const { tr } = useApp()
  return (
    <div className="flex gap-3 pt-2">
      <button
        onClick={() => setStep((s: number) => (s - 1) as any)}
        className="flex-1 button-secondary"
      >
        {tr.booking.back}
      </button>
      {onNext && (
        <button
          onClick={onNext}
          className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          {tr.booking.next}
        </button>
      )}
    </div>
  )
}
