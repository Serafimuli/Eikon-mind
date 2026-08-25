import { notFound } from "next/navigation"
import { cancelOwnAppointment } from "@/app/[locale]/actions"
import { ActionForm } from "@/components/ActionForm"
import { findAppointmentForClient } from "@/lib/db/repositories"
import { requireClient } from "@/lib/session"
import type { Locale } from "@/lib/site-content"

export default async function AppointmentDetail({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>
}) {
  const { locale, id } = await params
  const user = await requireClient(locale)
  const row = await findAppointmentForClient(id, user.id)
  if (!row) notFound()
  return (
    <main className="private-shell">
      <p className="eyebrow">{row.status}</p>
      <h1>{locale === "ro" ? "Programare" : "Appointment"}</h1>
      <div className="card">
        <p>
          {row.startsAt.toLocaleString(locale === "ro" ? "ro-RO" : "en-GB", {
            timeZone: "Europe/Bucharest",
          })}
        </p>
        <p>
          {locale === "ro" ? "Se termină" : "Ends"}{" "}
          {row.endsAt.toLocaleTimeString(locale === "ro" ? "ro-RO" : "en-GB", {
            timeZone: "Europe/Bucharest",
            timeStyle: "short",
          })}
        </p>
        <p>
          {locale === "ro"
            ? "Această înregistrare nu conține note sau date despre sănătate."
            : "This record contains no notes or health information."}
        </p>
        {!["COMPLETED", "CANCELLED"].includes(row.status) && (
          <ActionForm
            action={cancelOwnAppointment.bind(null, locale, row.id)}
            errorMessage={
              locale === "ro"
                ? "Programarea nu a putut fi anulată."
                : "The appointment could not be cancelled."
            }
          >
            <button className="button" type="submit">
              {locale === "ro" ? "Anulează programarea" : "Cancel appointment"}
            </button>
          </ActionForm>
        )}
      </div>
    </main>
  )
}
