import { notFound } from "next/navigation"
import { eq } from "drizzle-orm"
import { cancelOwnAppointment } from "@/app/[locale]/actions"
import { getDb } from "@/lib/db"
import { appointments } from "@/lib/db/schema"
import { requireUser } from "@/lib/session"
import type { Locale } from "@/lib/site-content"

export default async function AppointmentDetail({ params }: { params: Promise<{ locale: Locale; id: string }> }) {
  const { locale, id } = await params
  const user = await requireUser(locale)
  const row = await getDb().query.appointments.findFirst({ where: eq(appointments.id, id) })
  if (!row || row.clientId !== user.id) notFound()
  return <main className="private-shell"><p className="eyebrow">{row.status}</p><h1>Appointment</h1><div className="card"><p>{row.startsAt.toLocaleString("ro-RO", { timeZone: "Europe/Bucharest" })}</p><p>Ends {row.endsAt.toLocaleTimeString("ro-RO", { timeZone: "Europe/Bucharest", timeStyle: "short" })}</p><p>This record contains no notes or health information.</p>{!["COMPLETED", "CANCELLED"].includes(row.status) && <form action={cancelOwnAppointment.bind(null, locale, row.id)}><button className="button" type="submit">Cancel appointment</button></form>}</div></main>
}
