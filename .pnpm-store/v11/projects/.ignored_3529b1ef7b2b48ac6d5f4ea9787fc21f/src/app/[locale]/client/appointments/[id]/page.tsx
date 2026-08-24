import { notFound } from "next/navigation"
import { eq } from "drizzle-orm"
import { getDb } from "@/lib/db"
import { appointments } from "@/lib/db/schema"
import { requireUser } from "@/lib/session"
import type { Locale } from "@/lib/site-content"
export default async function AppointmentDetail({params}:{params:Promise<{locale:Locale;id:string}>}){const {locale,id}=await params;const user=await requireUser(locale);const row=await getDb().query.appointments.findFirst({where:eq(appointments.id,id)});if(!row||row.clientId!==user.id)notFound();return <main className="private-shell"><p className="eyebrow">{row.status}</p><h1>{row.service}</h1><div className="card"><p>{row.startsAt.toLocaleString("ro-RO",{timeZone:"Europe/Bucharest"})}</p><p>{row.therapist} · {row.therapyMode}</p>{row.notes&&<p>{row.notes}</p>}</div></main>}
