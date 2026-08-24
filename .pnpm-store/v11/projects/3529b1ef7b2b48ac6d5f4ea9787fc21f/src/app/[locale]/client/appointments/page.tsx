import Link from "next/link"
import { desc, eq } from "drizzle-orm"
import { getDb } from "@/lib/db"
import { appointments } from "@/lib/db/schema"
import { requireUser } from "@/lib/session"
import type { Locale } from "@/lib/site-content"
export default async function ClientAppointments({params}:{params:Promise<{locale:Locale}>}){const {locale}=await params;const user=await requireUser(locale);const rows=await getDb().select().from(appointments).where(eq(appointments.clientId,user.id)).orderBy(desc(appointments.startsAt));return <main className="private-shell"><h1>{locale==="ro"?"Programările mele":"My appointments"}</h1><div className="appointment-list">{rows.map(a=><Link className="appointment" href={`/${locale}/client/appointments/${a.id}`} key={a.id}><strong>{a.service}</strong><br/>{a.startsAt.toLocaleString("ro-RO",{timeZone:"Europe/Bucharest"})} · {a.status}</Link>)}</div></main>}
