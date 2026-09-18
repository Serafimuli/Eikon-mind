import Link from "next/link";
import { and, count, eq, gte, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { appointments } from "@/lib/db/schema";
import { getProtectedCopy } from "@/lib/protected-content";
import { requireStaff } from "@/lib/session";
import type { Locale } from "@/lib/site-content";

export default async function StaffDashboard({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const { locale } = await params;
  const { notice } = await searchParams;
  const user = await requireStaff(locale);
  const copy = getProtectedCopy(locale);
  const db = getDb();
  const scope = user.role === "ADMIN" ? undefined : eq(appointments.therapistId, user.id);
  const [all] = await (scope
    ? db.select({ count: count() }).from(appointments).where(scope)
    : db.select({ count: count() }).from(appointments));
  const [upcoming] = await (scope
    ? db
        .select({ count: count() })
        .from(appointments)
        .where(
          and(
            eq(appointments.therapistId, user.id),
            gte(appointments.startsAt, new Date()),
            inArray(appointments.status, ["REQUESTED", "CONFIRMED"]),
          ),
        )
    : db
        .select({ count: count() })
        .from(appointments)
        .where(
          and(
            gte(appointments.startsAt, new Date()),
            inArray(appointments.status, ["REQUESTED", "CONFIRMED"]),
          ),
        ));
  return (
    <main className="private-shell">
      {notice === "access-denied" && (
        <p className="notice" role="status">
          {copy.common.accessDenied}
        </p>
      )}
      <div className="private-head">
        <div>
          <p className="eyebrow">Eikon Mind</p>
          <h1>
            {user.role === "ADMIN"
              ? copy.staffDashboard.adminTitle
              : copy.staffDashboard.therapistTitle}
          </h1>
        </div>
        <Link className="button" href={`/${locale}/admin/appointments`}>
          {copy.staffDashboard.openCalendar}
        </Link>
      </div>
      <div className="card-grid">
        <div className="card">
          <h2>{copy.staffDashboard.appointments}</h2>
          <p>{all.count}</p>
        </div>
        <div className="card">
          <h2>{copy.staffDashboard.upcoming}</h2>
          <p>{upcoming.count}</p>
        </div>
        <div className="card">
          <h2>{copy.staffDashboard.actions}</h2>
          <Link className="dashboard-action-link" href={`/${locale}/admin/appointments`}>
            {copy.staffDashboard.viewAppointments}
          </Link>
          {user.role === "ADMIN" && (
            <>
              <Link className="dashboard-action-link" href={`/${locale}/admin/staff`}>
                {copy.staffDashboard.manageStaff}
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
