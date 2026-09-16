import Link from "next/link";
import { listUserAppointments } from "@/lib/db/repositories";
import { requireClient } from "@/lib/session";
import type { Locale } from "@/lib/site-content";
import { appointmentStatusLabel, formatDateTime } from "@/lib/presentation";
import { getProtectedCopy } from "@/lib/protected-content";

export default async function ClientAppointments({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const user = await requireClient(locale);
  const rows = await listUserAppointments(user.id);
  const copy = getProtectedCopy(locale);
  return (
    <main className="private-shell">
      <h1>{copy.appointments.clientTitle}</h1>
      <div className="appointment-list">
        {rows.length ? (
          rows.map((appointment) => (
            <Link
              className="appointment"
              href={`/${locale}/client/appointments/${appointment.id}`}
              key={appointment.id}
            >
              <strong>{copy.appointments.appointment}</strong>
              <br />
              {formatDateTime(appointment.startsAt, locale)} ·{" "}
              {appointmentStatusLabel(appointment.status, locale)}
            </Link>
          ))
        ) : (
          <div className="empty-state">
            <p>{copy.appointments.emptyClient}</p>
            <Link className="button button--secondary" href={`/${locale}/client/book`}>
              {copy.clientDashboard.book}
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
