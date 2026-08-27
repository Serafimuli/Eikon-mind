import Link from "next/link";
import { listUserAppointments } from "@/lib/db/repositories";
import { requireClient } from "@/lib/session";
import type { Locale } from "@/lib/site-content";

export default async function ClientDashboard({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const user = await requireClient(locale);
  const rows = (await listUserAppointments(user.id)).slice(0, 3);
  return (
    <main className="private-shell">
      <div className="private-head">
        <div>
          <p className="eyebrow">{locale === "ro" ? "Contul meu" : "My account"}</p>
          <h1>
            {locale === "ro"
              ? `Bine ai venit, ${user.firstName || user.name}`
              : `Welcome, ${user.firstName || user.name}`}
          </h1>
        </div>
        <Link className="button" href={`/${locale}/client/book`}>
          {locale === "ro" ? "Rezervă o întâlnire" : "Book a session"}
        </Link>
      </div>
      <div className="card-grid">
        <div className="card">
          <h3>Appointments</h3>
          <p>{rows.length}</p>
        </div>
        <div className="card">
          <h3>Data minimisation</h3>
          <p>We only keep scheduling information necessary for this service.</p>
        </div>
        <div className="card">
          <h3>Profile</h3>
          <p>{user.email}</p>
        </div>
      </div>
      <section className="section">
        <h2>{locale === "ro" ? "Programări recente" : "Recent appointments"}</h2>
        <div className="appointment-list">
          {rows.length ? (
            rows.map((appointment) => (
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
            ))
          ) : (
            <p>
              {locale === "ro" ? "Nu ai programări încă." : "You do not have appointments yet."}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
