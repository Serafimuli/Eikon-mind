import Link from "next/link";
import { listUserAppointments } from "@/lib/db/repositories";
import { appointmentStatusLabel, formatDateTime } from "@/lib/presentation";
import { getProtectedCopy } from "@/lib/protected-content";
import { requireClient } from "@/lib/session";
import type { Locale } from "@/lib/site-content";

export default async function ClientDashboard({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const { locale } = await params;
  const { notice } = await searchParams;
  const user = await requireClient(locale);
  const appointments = await listUserAppointments(user.id);
  const rows = appointments.slice(0, 3);
  const copy = getProtectedCopy(locale);
  return (
    <main className="private-shell">
      {notice === "access-denied" && (
        <p className="notice" role="status">
          {copy.common.accessDenied}
        </p>
      )}
      <div className="private-head">
        <div>
          <p className="eyebrow">{copy.clientDashboard.eyebrow}</p>
          <h1>{copy.clientDashboard.welcome(user.firstName || user.name)}</h1>
        </div>
        <Link className="button" href={`/${locale}/client/book`}>
          {copy.clientDashboard.book}
        </Link>
      </div>
      <div className="card-grid">
        <div className="card">
          <h2>{copy.clientDashboard.appointments}</h2>
          <p>{appointments.length}</p>
        </div>
        <div className="card">
          <h2>{copy.clientDashboard.privacy}</h2>
          <p>{copy.clientDashboard.privacyBody}</p>
        </div>
        <div className="card">
          <h2>{copy.clientDashboard.profile}</h2>
          <p>{user.email}</p>
        </div>
      </div>
      <section className="section">
        <h2>{copy.clientDashboard.recent}</h2>
        <div className="appointment-list">
          {rows.length ? (
            rows.map((appointment) => (
              <Link
                className="appointment"
                href={`/${locale}/client/appointments/${appointment.id}`}
                key={appointment.id}
              >
                <strong>{copy.clientDashboard.appointment}</strong>
                <br />
                {formatDateTime(appointment.startsAt, locale)} ·{" "}
                {appointmentStatusLabel(appointment.status, locale)}
              </Link>
            ))
          ) : (
            <div className="empty-state">
              <p>{copy.clientDashboard.empty}</p>
              <Link className="button button--secondary" href={`/${locale}/client/book`}>
                {copy.clientDashboard.book}
              </Link>
            </div>
          )}
        </div>
        {appointments.length > 0 && (
          <Link className="dashboard-action-link" href={`/${locale}/client/appointments`}>
            {copy.clientDashboard.viewAll}
          </Link>
        )}
      </section>
    </main>
  );
}
