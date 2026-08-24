import { desc, eq } from "drizzle-orm"
import { getDb } from "@/lib/db"
import { appointments, users } from "@/lib/db/schema"
import { updateAppointmentStatus } from "@/app/[locale]/actions"
import type { Locale } from "@/lib/site-content"
export default async function AdminAppointments({params}:{params:Promise<{locale:Locale}>}){const {locale}=await params;const rows=await getDb().select({appointment:appointments,user:users}).from(appointments).innerJoin(users,eq(appointments.clientId,users.id)).orderBy(desc(appointments.startsAt));return <main className="private-shell"><h1>{locale==="ro"?"Programări":"Appointments"}</h1><div className="appointment-list">{rows.map(({appointment:a,user})=><div className="appointment" key={a.id}><strong>{user.firstName||user.name} — {a.service}</strong><br/>{a.startsAt.toLocaleString("ro-RO",{timeZone:"Europe/Bucharest"})} · {a.therapist}<form action={updateAppointmentStatus.bind(null,locale,a.id,a.status==="confirmed"?"completed":"confirmed")}><button className="icon-button">{a.status==="confirmed"?(locale==="ro"?"Finalizează":"Complete"):(locale==="ro"?"Confirmă":"Confirm")}</button></form></div>)}</div></main>}
