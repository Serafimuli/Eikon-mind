import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { updateAppointmentStatus } from "@/app/[locale]/actions";
import { ActionForm } from "@/components/ActionForm";
import { ConfirmActionForm } from "@/components/ConfirmActionForm";
import { getDb } from "@/lib/db";
import { appointments, users } from "@/lib/db/schema";
import { appointmentStatusLabel, formatDateTime } from "@/lib/presentation";
import { getProtectedCopy } from "@/lib/protected-content";
import { requireStaff } from "@/lib/session";
import type { Locale } from "@/lib/site-content";

export default async function StaffAppointments({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const staff = await requireStaff(locale);
  const db = getDb();
  const client = alias(users, "client");
  const therapist = alias(users, "therapist");
  const filters = staff.role === "ADMIN" ? undefined : eq(appointments.therapistId, staff.id);
  const select = db
    .select({
      appointment: appointments,
      clientFirstName: client.firstName,
      clientLastName: client.lastName,
      therapistFirstName: therapist.firstName,
      therapistLastName: therapist.lastName,
    })
    .from(appointments)
    .leftJoin(client, eq(appointments.clientId, client.id))
    .leftJoin(therapist, eq(appointments.therapistId, therapist.id));
  const rows = await (filters
    ? select.where(filters).orderBy(desc(appointments.startsAt))
    : select.orderBy(desc(appointments.startsAt)));
  const copy = getProtectedCopy(locale).appointments;

  return (
    <main className="private-shell">
      <h1>{copy.staffTitle}</h1>
      <div className="appointment-list">
        {rows.length === 0 && (
          <div className="empty-state">
            <p>{copy.emptyStaff}</p>
          </div>
        )}
        {rows.map(
          ({
            appointment,
            clientFirstName,
            clientLastName,
            therapistFirstName,
            therapistLastName,
          }) => (
            <article
              className="appointment"
              data-appointment-id={appointment.id}
              key={appointment.id}
            >
              <div className="appointment-meta">
                <strong>
                  {[clientFirstName, clientLastName].filter(Boolean).join(" ") || copy.deletedUser}{" "}
                  — {copy.appointment}
                </strong>
                <span>
                  {formatDateTime(appointment.startsAt, locale)} ·{" "}
                  {appointmentStatusLabel(appointment.status, locale)}
                </span>
                {staff.role === "ADMIN" && (
                  <span>
                    {copy.therapist}: {therapistFirstName} {therapistLastName}
                  </span>
                )}
              </div>
              <div className="appointment-actions">
                {appointment.status === "REQUESTED" && (
                  <ActionForm
                    locale={locale}
                    action={updateAppointmentStatus.bind(null, locale, appointment.id, "CONFIRMED")}
                    errorMessage={copy.statusError}
                  >
                    <button className="button button--secondary button--small" type="submit">
                      {copy.confirm}
                    </button>
                  </ActionForm>
                )}
                {appointment.status === "CONFIRMED" && (
                  <ActionForm
                    locale={locale}
                    action={updateAppointmentStatus.bind(null, locale, appointment.id, "COMPLETED")}
                    errorMessage={copy.statusError}
                  >
                    <button className="button button--secondary button--small" type="submit">
                      {copy.complete}
                    </button>
                  </ActionForm>
                )}
                {!["COMPLETED", "CANCELLED"].includes(appointment.status) && (
                  <ConfirmActionForm
                    locale={locale}
                    action={updateAppointmentStatus.bind(null, locale, appointment.id, "CANCELLED")}
                    triggerLabel={copy.cancel}
                    confirmationMessage={copy.confirmCancel}
                    confirmLabel={copy.confirmCancelAction}
                    errorMessage={copy.statusError}
                  />
                )}
              </div>
            </article>
          ),
        )}
      </div>
    </main>
  );
}
