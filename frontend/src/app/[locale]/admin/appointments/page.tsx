import { desc, eq } from "drizzle-orm"
import { updateAppointmentStatus } from "@/app/[locale]/actions"
import { getDb } from "@/lib/db"
import { appointments, users } from "@/lib/db/schema"
import { requireStaff } from "@/lib/session"
import type { Locale } from "@/lib/site-content"

export default async function StaffAppointments({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  const staff = await requireStaff(locale)
  const db = getDb()
  const filters = staff.role === "ADMIN" ? undefined : eq(appointments.therapistId, staff.id)
  const rows = await (filters
    ? db.select({ appointment: appointments, user: users }).from(appointments).leftJoin(users, eq(appointments.clientId, users.id)).where(filters).orderBy(desc(appointments.startsAt))
    : db.select({ appointment: appointments, user: users }).from(appointments).leftJoin(users, eq(appointments.clientId, users.id)).orderBy(desc(appointments.startsAt)))
  return <main className="private-shell"><h1>{locale === "ro" ? "Programări" : "Appointments"}</h1><div className="appointment-list">{rows.map(({ appointment, user }) => <div className="appointment" key={appointment.id}><strong>{user?.firstName ?? "Deleted user"} — Appointment</strong><br/>{appointment.startsAt.toLocaleString("ro-RO", { timeZone: "Europe/Bucharest" })} · {appointment.status}{appointment.status === "REQUESTED" && <form action={updateAppointmentStatus.bind(null, locale, appointment.id, "CONFIRMED")}><button className="icon-button">Confirm</button></form>}{appointment.status === "CONFIRMED" && <form action={updateAppointmentStatus.bind(null, locale, appointment.id, "COMPLETED")}><button className="icon-button">Complete</button></form>}{!["COMPLETED", "CANCELLED"].includes(appointment.status) && <form action={updateAppointmentStatus.bind(null, locale, appointment.id, "CANCELLED")}><button className="icon-button">Cancel</button></form>}</div>)}</div></main>
}
