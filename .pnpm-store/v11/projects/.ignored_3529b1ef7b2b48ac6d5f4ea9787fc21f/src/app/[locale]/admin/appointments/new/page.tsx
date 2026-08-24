import { createAppointment } from "@/app/[locale]/actions"
import type { Locale } from "@/lib/site-content"
export default async function NewAppointment({params}:{params:Promise<{locale:Locale}>}){const {locale}=await params;return <main className="private-shell"><p>{locale==="ro"?"Adăugarea pentru un client se realizează din rezervarea clientului; administratorul poate confirma sau modifica ulterior solicitarea.":"Appointments are initiated from client bookings; administrators can then confirm or amend them."}</p></main>}
