import Link from "next/link"
import { and, count, eq, gte } from "drizzle-orm"
import { getDb } from "@/lib/db"
import { appointments } from "@/lib/db/schema"
import { requireStaff } from "@/lib/session"
import type { Locale } from "@/lib/site-content"

export default async function StaffDashboard({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  const user = await requireStaff(locale)
  const db = getDb()
  const scope = user.role === "ADMIN" ? undefined : eq(appointments.therapistId, user.id)
  const [all] = await (scope ? db.select({ count: count() }).from(appointments).where(scope) : db.select({ count: count() }).from(appointments))
  const [upcoming] = await (scope ? db.select({ count: count() }).from(appointments).where(and(eq(appointments.therapistId, user.id), gte(appointments.startsAt, new Date()))) : db.select({ count: count() }).from(appointments).where(gte(appointments.startsAt, new Date())))
  return <main className="private-shell"><div className="private-head"><div><p className="eyebrow">Eikon Mind</p><h1>{user.role === "ADMIN" ? "Administration" : "Therapist workspace"}</h1></div><Link className="button" href={`/${locale}/admin/appointments/new`}>Add availability</Link></div><div className="card-grid"><div className="card"><h3>Appointments</h3><p>{all.count}</p></div><div className="card"><h3>Upcoming</h3><p>{upcoming.count}</p></div><div className="card"><h3>Actions</h3><Link href={`/${locale}/admin/appointments`}>View appointments</Link>{user.role === "ADMIN" && <><br/><Link href={`/${locale}/admin/staff`}>Manage staff</Link></>}</div></div></main>
}
