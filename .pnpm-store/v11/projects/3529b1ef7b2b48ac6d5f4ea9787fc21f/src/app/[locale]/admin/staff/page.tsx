import { asc } from "drizzle-orm"
import { changeStaffRole } from "@/app/[locale]/actions"
import { getDb } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { requireAdmin } from "@/lib/session"
import type { Locale } from "@/lib/site-content"

export default async function StaffManagement({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  const admin = await requireAdmin(locale)
  const rows = await getDb().select().from(users).orderBy(asc(users.email))
  return <main className="private-shell"><h1>Staff management</h1><p>Only verified users with enrolled TOTP can become therapists or administrators.</p><div className="appointment-list">{rows.filter((user) => user.id !== admin.id).map((user) => <div className="appointment" key={user.id}><strong>{user.firstName} {user.lastName}</strong><br/>{user.email} · {user.role} · {user.twoFactorEnabled ? "TOTP enabled" : "TOTP not enrolled"}<form action={changeStaffRole.bind(null, locale, user.id, "THERAPIST")}><button className="icon-button" disabled={!user.emailVerified || !user.twoFactorEnabled}>Make therapist</button></form><form action={changeStaffRole.bind(null, locale, user.id, "ADMIN")}><button className="icon-button" disabled={!user.emailVerified || !user.twoFactorEnabled}>Make admin</button></form><form action={changeStaffRole.bind(null, locale, user.id, "USER")}><button className="icon-button">Remove staff role</button></form></div>)}</div></main>
}
