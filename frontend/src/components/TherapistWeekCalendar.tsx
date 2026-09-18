import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import {
  approveCalendarAppointment,
  cancelCalendarItem,
  createCalendarAppointment,
  createCalendarBusyBlock,
  moveCalendarItem,
} from "@/app/[locale]/actions";
import { ActionForm } from "@/components/ActionForm";
import { bucharestDate, bucharestWallTime, overlaps } from "@/lib/calendar-scheduling";
import { getDb } from "@/lib/db";
import { appointments, calendarManagedItems, users } from "@/lib/db/schema";
import { getBusyIntervals } from "@/lib/integrations/calendar-google";
import { getRuntimeEnv } from "@/lib/platform-env";
import { formatTime } from "@/lib/presentation";
import type { Locale } from "@/lib/site-content";

type Item = {
  id: string;
  appointmentId: string | null;
  kind: "APPOINTMENT" | "BLOCK";
  startsAt: Date;
  endsAt: Date;
  status: "REQUESTED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | null;
  clientName: string | null;
};

function addDays(date: string, amount: number) {
  const value = new Date(`${date}T12:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

function monday(date: string) {
  const value = bucharestWallTime(date, 12) ?? new Date();
  const weekday = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Bucharest",
    weekday: "short",
  }).format(value);
  const offset: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  return addDays(date, -(offset[weekday] ?? 0));
}

function localInput(value: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Bucharest",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(value)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  ) as Record<"year" | "month" | "day" | "hour" | "minute", string>;
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function dayName(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ro" ? "ro-RO" : "en-GB", {
    timeZone: "Europe/Bucharest",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(bucharestWallTime(value, 12)!);
}

export async function TherapistWeekCalendar({
  locale,
  requestedWeek,
  canManage,
}: {
  locale: Locale;
  requestedWeek?: string;
  canManage: boolean;
}) {
  const chosenDate = /^\d{4}-\d{2}-\d{2}$/.test(requestedWeek ?? "")
    ? requestedWeek!
    : bucharestDate(new Date());
  const firstDay = monday(chosenDate);
  const days = Array.from({ length: 7 }, (_, index) => addDays(firstDay, index));
  const rangeStart = bucharestWallTime(firstDay, 0)!;
  const rangeEnd = bucharestWallTime(addDays(firstDay, 7), 0)!;
  const db = getDb();
  const rows = await db
    .select({ item: calendarManagedItems, appointment: appointments, clientName: users.name })
    .from(calendarManagedItems)
    .leftJoin(appointments, eq(calendarManagedItems.appointmentId, appointments.id))
    .leftJoin(users, eq(appointments.clientId, users.id));
  const items: Item[] = rows
    .filter(({ item }) => item.startsAt < rangeEnd && item.endsAt > rangeStart)
    .map(({ item, appointment, clientName }) => ({
      id: item.id,
      appointmentId: item.appointmentId,
      kind: item.kind,
      startsAt: item.startsAt,
      endsAt: item.endsAt,
      status: appointment?.status ?? null,
      clientName: clientName ?? null,
    }));
  const clients = canManage
    ? await db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(and(eq(users.role, "USER"), eq(users.emailVerified, true)))
        .orderBy(asc(users.lastName), asc(users.firstName))
    : [];
  const busy = await getBusyIntervals(getRuntimeEnv(), rangeStart, rangeEnd).catch(() => null);
  const externalBusy = (busy ?? []).filter(
    (interval) =>
      !items.some(
        (item) =>
          item.startsAt.getTime() === interval.start.getTime() &&
          item.endsAt.getTime() === interval.end.getTime(),
      ),
  );
  const error =
    locale === "ro"
      ? "Calendarul Google s-a schimbat. Reîmprospătează și încearcă din nou."
      : "Google Calendar changed. Refresh and try again.";

  return (
    <main className="private-shell therapist-calendar">
      <div className="private-head">
        <div>
          <p className="eyebrow">Eikon Mind</p>
          <h1>{locale === "ro" ? "Calendar programări" : "Appointment calendar"}</h1>
          <p className="muted">
            {locale === "ro"
              ? "Google Calendar stabilește disponibilitatea. Evenimentele externe sunt afișate doar ca timp ocupat."
              : "Google Calendar determines availability. External events are shown only as busy time."}
          </p>
        </div>
        <div className="calendar-nav">
          <Link
            className="button button--secondary"
            href={`/${locale}/admin/appointments?week=${addDays(firstDay, -7)}`}
          >
            ←
          </Link>
          <Link
            className="button button--secondary"
            href={`/${locale}/admin/appointments?week=${bucharestDate(new Date())}`}
          >
            {locale === "ro" ? "Azi" : "Today"}
          </Link>
          <Link
            className="button button--secondary"
            href={`/${locale}/admin/appointments?week=${addDays(firstDay, 7)}`}
          >
            →
          </Link>
        </div>
      </div>
      {busy === null && (
        <p className="error">
          {locale === "ro"
            ? "Timpul ocupat din Google nu a putut fi încărcat."
            : "Google busy time could not be loaded."}
        </p>
      )}
      {canManage && (
        <div className="calendar-create-grid">
          <ActionForm
            locale={locale}
            action={createCalendarAppointment.bind(null, locale)}
            errorMessage={error}
            className="card calendar-create-form"
          >
            <h2>{locale === "ro" ? "Programare confirmată" : "Confirmed appointment"}</h2>
            <label>
              {locale === "ro" ? "Client" : "Client"}
              <select name="clientId" defaultValue="" required>
                <option value="">
                  {locale === "ro" ? "Selectează clientul" : "Select client"}
                </option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} · {client.email}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {locale === "ro" ? "Începe la" : "Starts at"}
              <input name="startsAt" type="datetime-local" required />
            </label>
            <label>
              {locale === "ro" ? "Se termină la" : "Ends at"}
              <input name="endsAt" type="datetime-local" required />
            </label>
            <button className="button" type="submit">
              {locale === "ro" ? "Creează" : "Create"}
            </button>
          </ActionForm>
          <ActionForm
            locale={locale}
            action={createCalendarBusyBlock.bind(null, locale)}
            errorMessage={error}
            className="card calendar-create-form"
          >
            <h2>{locale === "ro" ? "Blochează timp" : "Block time"}</h2>
            <label>
              {locale === "ro" ? "Începe la" : "Starts at"}
              <input name="startsAt" type="datetime-local" required />
            </label>
            <label>
              {locale === "ro" ? "Se termină la" : "Ends at"}
              <input name="endsAt" type="datetime-local" required />
            </label>
            <p className="muted">
              {locale === "ro"
                ? "Nu este asociat unui client și elimină doar disponibilitatea."
                : "It is not associated with a client and only removes availability."}
            </p>
            <button className="button" type="submit">
              {locale === "ro" ? "Blochează" : "Block"}
            </button>
          </ActionForm>
        </div>
      )}
      <section
        className="week-grid"
        aria-label={locale === "ro" ? "Săptămână calendar" : "Calendar week"}
      >
        {days.map((day) => {
          const start = bucharestWallTime(day, 0)!;
          const end = bucharestWallTime(addDays(day, 1), 0)!;
          const dayItems = items.filter((item) => overlaps(item.startsAt, item.endsAt, start, end));
          const dayBusy = externalBusy.filter((item) => overlaps(item.start, item.end, start, end));
          return (
            <section className="week-day" key={day}>
              <h2>{dayName(day, locale)}</h2>
              {dayBusy.map((item) => (
                <p
                  className="calendar-external-busy"
                  key={`${item.start.toISOString()}-${item.end.toISOString()}`}
                >
                  {formatTime(item.start, locale)}–{formatTime(item.end, locale)} ·{" "}
                  {locale === "ro" ? "Ocupat" : "Busy"}
                </p>
              ))}
              {dayItems.length === 0 && dayBusy.length === 0 && (
                <p className="muted">{locale === "ro" ? "Fără evenimente" : "No events"}</p>
              )}
              {dayItems.map((item) => (
                <article
                  className={`calendar-item calendar-item--${item.kind.toLowerCase()}`}
                  key={item.id}
                >
                  <strong>
                    {item.kind === "BLOCK"
                      ? locale === "ro"
                        ? "Timp blocat"
                        : "Busy block"
                      : (item.clientName ?? (locale === "ro" ? "Client șters" : "Deleted client"))}
                  </strong>
                  <span>
                    {formatTime(item.startsAt, locale)}–{formatTime(item.endsAt, locale)}
                    {item.status ? ` · ${item.status}` : ""}
                  </span>
                  {canManage && (
                    <div className="calendar-item-actions">
                      {item.appointmentId && item.status === "REQUESTED" && (
                        <ActionForm
                          locale={locale}
                          action={approveCalendarAppointment.bind(null, locale, item.appointmentId)}
                          errorMessage={error}
                        >
                          <button type="submit" className="button button--small">
                            {locale === "ro" ? "Aprobă" : "Approve"}
                          </button>
                        </ActionForm>
                      )}
                      <ActionForm
                        locale={locale}
                        action={moveCalendarItem.bind(null, locale, item.id)}
                        errorMessage={error}
                      >
                        <label>
                          {locale === "ro" ? "Mută la" : "Move to"}
                          <input
                            name="startsAt"
                            type="datetime-local"
                            defaultValue={localInput(item.startsAt)}
                            required
                          />
                        </label>
                        <label>
                          {locale === "ro" ? "Se termină" : "Ends"}
                          <input
                            name="endsAt"
                            type="datetime-local"
                            defaultValue={localInput(item.endsAt)}
                            required
                          />
                        </label>
                        <button type="submit" className="button button--secondary button--small">
                          {locale === "ro" ? "Salvează" : "Move"}
                        </button>
                      </ActionForm>
                      <ActionForm
                        locale={locale}
                        action={cancelCalendarItem.bind(null, locale, item.id)}
                        errorMessage={error}
                      >
                        <button type="submit" className="button button--danger button--small">
                          {locale === "ro" ? "Anulează" : "Cancel"}
                        </button>
                      </ActionForm>
                    </div>
                  )}
                </article>
              ))}
            </section>
          );
        })}
      </section>
    </main>
  );
}
