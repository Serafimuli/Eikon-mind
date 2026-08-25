import Link from "next/link"
import { listUserAppointments } from "@/lib/db/repositories"
import { requireClient } from "@/lib/session"
import type { Locale } from "@/lib/site-content"

export default async function ClientAppointments({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const user = await requireClient(locale)
  const rows = await listUserAppointments(user.id)
  return (
    <main className="private-shell">
      <h1>{locale === "ro" ? "Programările mele" : "My appointments"}</h1>
      <div className="appointment-list">
        {rows.map((appointment) => (
          <Link
            className="appointment"
            href={`/${locale}/client/appointments/${appointment.id}`}
            key={appointment.id}
          >
            <strong>Appointment</strong>
            <br />
            {appointment.startsAt.toLocaleString("ro-RO", {
              timeZone: "Europe/Bucharest",
            })}{" "}
            · {appointment.status}
          </Link>
        ))}
      </div>
    </main>
  )
}
