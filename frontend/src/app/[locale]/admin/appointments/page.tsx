import { desc, eq } from "drizzle-orm";
import { ActionForm } from "@/components/ActionForm";
import { updateAppointmentStatus } from "@/app/[locale]/actions";
import { getDb } from "@/lib/db";
import { appointments, users } from "@/lib/db/schema";
import { requireStaff } from "@/lib/session";
import type { Locale } from "@/lib/site-content";
import { appointmentStatusLabel, formatDateTime } from "@/lib/presentation";

export default async function StaffAppointments({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const staff = await requireStaff(locale);
  const db = getDb();
  const filters = staff.role === "ADMIN" ? undefined : eq(appointments.therapistId, staff.id);
  const rows = await (filters
    ? db
        .select({ appointment: appointments, user: users })
        .from(appointments)
        .leftJoin(users, eq(appointments.clientId, users.id))
        .where(filters)
        .orderBy(desc(appointments.startsAt))
    : db
        .select({ appointment: appointments, user: users })
        .from(appointments)
        .leftJoin(users, eq(appointments.clientId, users.id))
        .orderBy(desc(appointments.startsAt)));
  const errorMessage =
    locale === "ro"
      ? "Starea programării nu a putut fi schimbată."
      : "The appointment status could not be changed.";
  return (
    <main className="private-shell">
      <h1>{locale === "ro" ? "Programări" : "Appointments"}</h1>
      <div className="appointment-list">
        {rows.length === 0 && (
          <p className="card">
            {locale === "ro"
              ? "Nu există programări alocate momentan."
              : "There are no assigned appointments yet."}
          </p>
        )}
        {rows.map(({ appointment, user }) => (
          <div className="appointment" key={appointment.id}>
            <strong>
              {user?.firstName ?? (locale === "ro" ? "Utilizator șters" : "Deleted user")} —{" "}
              {locale === "ro" ? "Programare" : "Appointment"}
            </strong>
            <br />
            {formatDateTime(appointment.startsAt, locale)} ·{" "}
            {appointmentStatusLabel(appointment.status, locale)}
            {appointment.status === "REQUESTED" && (
              <ActionForm
                action={updateAppointmentStatus.bind(null, locale, appointment.id, "CONFIRMED")}
                errorMessage={errorMessage}
              >
                <button className="icon-button" type="submit">
                  {locale === "ro" ? "Confirmă" : "Confirm"}
                </button>
              </ActionForm>
            )}
            {appointment.status === "CONFIRMED" && (
              <ActionForm
                action={updateAppointmentStatus.bind(null, locale, appointment.id, "COMPLETED")}
                errorMessage={errorMessage}
              >
                <button className="icon-button" type="submit">
                  {locale === "ro" ? "Finalizează" : "Complete"}
                </button>
              </ActionForm>
            )}
            {!["COMPLETED", "CANCELLED"].includes(appointment.status) && (
              <ActionForm
                action={updateAppointmentStatus.bind(null, locale, appointment.id, "CANCELLED")}
                errorMessage={errorMessage}
              >
                <button className="icon-button" type="submit">
                  {locale === "ro" ? "Anulează" : "Cancel"}
                </button>
              </ActionForm>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
