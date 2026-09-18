import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cancelOwnAppointment, deleteOwnAppointment } from "@/app/[locale]/actions";
import { ActionForm } from "@/components/ActionForm";
import { ConfirmActionForm } from "@/components/ConfirmActionForm";
import { isFutureAppointment } from "@/lib/appointment-types";
import { clientBookingDateBounds } from "@/lib/calendar-scheduling";
import { findAppointmentForClient } from "@/lib/db/repositories";
import { appointmentStatusLabel, formatDateTime, formatTime } from "@/lib/presentation";
import { getProtectedCopy } from "@/lib/protected-content";
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
  const copy = getProtectedCopy(locale).appointments;

  const active = row.status === "REQUESTED" || row.status === "CONFIRMED";
  const { earliest } = clientBookingDateBounds();
  const canReschedule =
    active && isFutureAppointment(row.startsAt) && row.startsAt.getTime() >= earliest.getTime();
  const canCancel = canReschedule;

  return (
    <main className="private-shell">
      <p className="eyebrow">{appointmentStatusLabel(row.status, locale)}</p>
      <h1>{copy.appointment}</h1>
      <div className="card">
        <p>{formatDateTime(row.startsAt, locale)}</p>
        <p>
          {copy.ends} {formatTime(row.endsAt, locale)}
        </p>
        <p>{copy.privacyNote}</p>
        <div className="appointment-actions">
          {canReschedule && (
            <Link
              className="button button--secondary"
              href={`/${locale}/client/appointments/${row.id}/reschedule` as Route}
            >
              {copy.reschedule}
            </Link>
          )}
          {canCancel && (
            <ConfirmActionForm
              locale={locale}
              triggerLabel={copy.ownCancel}
              confirmationMessage={copy.confirmOwnCancel}
              confirmLabel={copy.ownCancel}
              action={cancelOwnAppointment.bind(null, locale, row.id)}
              errorMessage={copy.ownCancelError}
            />
          )}
        </div>
      </div>

      <section className="danger-zone">
        <h2>{copy.deleteTitle}</h2>
        <p>{active ? copy.deleteActive : copy.deletePast}</p>
        <ActionForm
          locale={locale}
          className="destructive-form"
          action={deleteOwnAppointment.bind(null, locale, row.id)}
          errorMessage={copy.deleteError}
        >
          <label className="confirmation-check">
            <input type="checkbox" name="confirmation" value="DELETE" required />
            <span>{copy.deleteConfirmation}</span>
          </label>
          <button className="button button--danger" type="submit">
            {copy.deleteAction}
          </button>
        </ActionForm>
      </section>
    </main>
  );
}
