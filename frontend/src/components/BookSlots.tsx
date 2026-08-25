"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import type { Locale } from "@/lib/site-content"

type Slot = { id: string; startsAt: Date; endsAt: Date }

export function BookSlots({ locale, slots, verified }: { locale: Locale; slots: Slot[]; verified: boolean }) {
  const router = useRouter()
  const [slotId, setSlotId] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const book = async () => {
    setBusy(true); setError("")
    const response = await fetch("/api/appointments/book", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slotId }),
    })
    const body = await response.json().catch(() => ({})) as { appointmentId?: string; error?: string }
    setBusy(false)
    if (!response.ok || !body.appointmentId) return setError(body.error ?? "Booking was not completed")
    router.push(`/${locale}/client/appointments/${body.appointmentId}`)
    router.refresh()
  }
  return <section className="form-card"><p className="eyebrow">Eikon Mind</p><h1>{locale === "ro" ? "Alege o oră disponibilă" : "Choose an available time"}</h1>{!verified ? <p className="error">Verify your email address before booking.</p> : slots.length === 0 ? <p>No appointment times are currently available.</p> : <><label>Available time<select value={slotId} onChange={(event)=>setSlotId(event.target.value)} required><option value="">Select a time</option>{slots.map((slot)=><option key={slot.id} value={slot.id}>{slot.startsAt.toLocaleString(locale === "ro" ? "ro-RO" : "en-GB", { timeZone: "Europe/Bucharest", dateStyle: "medium", timeStyle: "short" })} – {slot.endsAt.toLocaleTimeString(locale === "ro" ? "ro-RO" : "en-GB", { timeZone: "Europe/Bucharest", timeStyle: "short" })}</option>)}</select></label><p className="muted">Only the appointment time is collected. Do not send health or clinical information through this form.</p><button type="button" className="button" disabled={busy || !slotId} onClick={book}>{busy ? "…" : (locale === "ro" ? "Rezervă" : "Book")}</button></>}{error && <p className="error">{error}</p>}</section>
}
