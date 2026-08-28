import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cancelOwnAppointment, deleteOwnAppointment } from "@/app/[locale]/actions";
import { ActionForm } from "@/components/ActionForm";
import { isFutureAppointment } from "@/lib/appointment-types";
import { findAppointmentForClient } from "@/lib/db/repositories";
import { appointmentStatusLabel, formatDateTime, formatTime } from "@/lib/presentation";
import { requireClient } from "@/lib/session";
import type { Locale } from "@/lib/site-content";

export default async function AppointmentDetail({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>;
}) {
  const { locale, id } = await params;
  const user = await requireClient(locale);
  const row = await findAppointmentForClient(id, user.id);
  if (!row) notFound();

  const active = row.status === "REQUESTED" || row.status === "CONFIRMED";
  const canReschedule = active && isFutureAppointment(row.startsAt);

  return (
    <main className="private-shell">
      <p className="eyebrow">{appointmentStatusLabel(row.status, locale)}</p>
      <h1>{locale === "ro" ? "Programare" : "Appointment"}</h1>
      <div className="card">
        <p>{formatDateTime(row.startsAt, locale)}</p>
        <p>
          {locale === "ro" ? "Se termină" : "Ends"} {formatTime(row.endsAt, locale)}
        </p>
        <p>
          {locale === "ro"
            ? "Această înregistrare nu conține note sau date despre sănătate."
            : "This record contains no notes or health information."}
        </p>
        {canReschedule && (
          <Link
            className="button button--secondary"
            href={`/${locale}/client/appointments/${row.id}/reschedule` as Route}
          >
            {locale === "ro" ? "Reprogramează" : "Reschedule"}
          </Link>
        )}
        {active && (
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

      <section className="danger-zone">
        <h2>{locale === "ro" ? "Șterge programarea" : "Delete appointment"}</h2>
        <p>
          {locale === "ro"
            ? active
              ? "Programarea va fi anulată și ascunsă din contul tău. Intervalul viitor va redeveni disponibil."
              : "Programarea va fi ascunsă din contul tău."
            : active
              ? "The appointment will be cancelled and hidden from your account. Its future time will become available again."
              : "The appointment will be hidden from your account."}
        </p>
        <ActionForm
          action={deleteOwnAppointment.bind(null, locale, row.id)}
          errorMessage={
            locale === "ro"
              ? "Programarea nu a putut fi ștearsă."
              : "The appointment could not be deleted."
          }
        >
          <label className="confirmation-check">
            <input type="checkbox" name="confirmation" value="DELETE" required />
            <span>
              {locale === "ro"
                ? "Confirm că vreau să șterg această programare."
                : "I confirm that I want to delete this appointment."}
            </span>
          </label>
          <button className="button button--danger" type="submit">
            {locale === "ro" ? "Șterge programarea" : "Delete appointment"}
          </button>
        </ActionForm>
      </section>
    </main>
  );
}
