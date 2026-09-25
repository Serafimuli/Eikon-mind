import type { Route } from "next";
import Link from "next/link";
import { and, asc, eq, gt, lt } from "drizzle-orm";
import {
  approveCalendarAppointment,
  cancelCalendarItem,
  createCalendarAppointment,
  createCalendarBusyBlock,
  moveCalendarItem,
} from "@/app/[locale]/actions";
import { ActionForm } from "@/components/ActionForm";
import { appointmentServiceLabel, isAppointmentServiceType } from "@/lib/appointment-types";
import { bucharestDate, bucharestWallTime } from "@/lib/calendar-scheduling";
import {
  placeOverlappingCalendarSegments,
  splitCalendarItemsForDay,
  visibleCalendarHours,
} from "@/lib/calendar-week-layout";
import { getDb } from "@/lib/db";
import { appointments, calendarManagedItems, users } from "@/lib/db/schema";
import { getBusyIntervals } from "@/lib/integrations/calendar-google";
import { googleCalendarErrorDetails } from "@/lib/integrations/calendar-google-contract";
import { getRuntimeEnv } from "@/lib/platform-env";
import { appointmentStatusLabel, formatTime } from "@/lib/presentation";
import type { Locale } from "@/lib/site-content";

type Item = {
  id: string;
  appointmentId: string | null;
  kind: "APPOINTMENT" | "BLOCK";
  startsAt: Date;
  endsAt: Date;
  status: "REQUESTED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | null;
  clientName: string | null;
  serviceCode: string | null;
};

type TimelineEvent = {
  key: string;
  kind: "APPOINTMENT" | "BLOCK" | "EXTERNAL";
  startsAt: Date;
  endsAt: Date;
  status: Item["status"];
  clientName: string | null;
  serviceCode: string | null;
  managedItem?: Item;
};

const HOUR_HEIGHT = 64;

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
  const offset: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
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

function weekdayLabel(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ro" ? "ro-RO" : "en-GB", {
    timeZone: "Europe/Bucharest",
    weekday: "short",
  }).format(bucharestWallTime(value, 12)!);
}

function rangeLabel(firstDay: string, lastDay: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ro" ? "ro-RO" : "en-GB", {
    timeZone: "Europe/Bucharest",
    dateStyle: "medium",
  }).formatRange(bucharestWallTime(firstDay, 12)!, bucharestWallTime(lastDay, 12)!);
}

function itemTitle(item: TimelineEvent, locale: Locale) {
  if (item.kind === "BLOCK") return locale === "ro" ? "Timp blocat" : "Busy block";
  if (item.kind === "EXTERNAL") return locale === "ro" ? "Ocupat" : "Busy";
  return item.clientName ?? (locale === "ro" ? "Client șters" : "Deleted client");
}

function eventStatusText(event: TimelineEvent, locale: Locale) {
  if (event.status) return appointmentStatusLabel(event.status, locale);
  return event.kind === "BLOCK"
    ? locale === "ro"
      ? "Timp blocat"
      : "Busy block"
    : locale === "ro"
      ? "Ocupat"
      : "Busy";
}

export async function TherapistWeekCalendarGrid({
  locale,
  requestedWeek,
  showWeekends,
  canManage,
}: {
  locale: Locale;
  requestedWeek?: string;
  showWeekends: boolean;
  canManage: boolean;
}) {
  const chosenDate = /^\d{4}-\d{2}-\d{2}$/.test(requestedWeek ?? "")
    ? requestedWeek!
    : bucharestDate(new Date());
  const firstDay = monday(chosenDate);
  const days = Array.from({ length: showWeekends ? 7 : 5 }, (_, index) => addDays(firstDay, index));
  const rangeStart = bucharestWallTime(firstDay, 0)!;
  const rangeEnd = bucharestWallTime(addDays(firstDay, 7), 0)!;
  const db = getDb();
  const rows = await db
    .select({ item: calendarManagedItems, appointment: appointments, clientName: users.name })
    .from(calendarManagedItems)
    .leftJoin(appointments, eq(calendarManagedItems.appointmentId, appointments.id))
    .leftJoin(users, eq(appointments.clientId, users.id))
    .where(
      and(lt(calendarManagedItems.startsAt, rangeEnd), gt(calendarManagedItems.endsAt, rangeStart)),
    )
    .orderBy(asc(calendarManagedItems.startsAt));
  const items: Item[] = rows.map(({ item, appointment, clientName }) => ({
    id: item.id,
    appointmentId: item.appointmentId,
    kind: item.kind,
    startsAt: item.startsAt,
    endsAt: item.endsAt,
    status: appointment?.status ?? null,
    clientName: clientName ?? null,
    serviceCode: appointment?.serviceCode ?? null,
  }));
  const clients = canManage
    ? await db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(and(eq(users.role, "USER"), eq(users.emailVerified, true)))
        .orderBy(asc(users.lastName), asc(users.firstName))
    : [];
  const busy = await getBusyIntervals(getRuntimeEnv(), rangeStart, rangeEnd).catch((error) => {
    console.error(
      "Google Calendar busy time load failed",
      googleCalendarErrorDetails(error, "freebusy-query"),
    );
    return null;
  });
  const externalBusy = (busy ?? []).filter(
    (interval) =>
      !items.some(
        (item) =>
          item.startsAt.getTime() === interval.start.getTime() &&
          item.endsAt.getTime() === interval.end.getTime(),
      ),
  );
  const timelineEvents: TimelineEvent[] = [
    ...items.map((item) => ({
      key: item.id,
      kind: item.kind,
      startsAt: item.startsAt,
      endsAt: item.endsAt,
      status: item.status,
      clientName: item.clientName,
      serviceCode: item.serviceCode,
      managedItem: item,
    })),
    ...externalBusy.map((interval) => ({
      key: `external-${interval.start.toISOString()}-${interval.end.toISOString()}`,
      kind: "EXTERNAL" as const,
      startsAt: interval.start,
      endsAt: interval.end,
      status: null,
      clientName: null,
      serviceCode: null,
    })),
  ];
  const daySegments = days.map((day) =>
    placeOverlappingCalendarSegments(splitCalendarItemsForDay(day, timelineEvents)),
  );
  const hours = visibleCalendarHours(daySegments.flat());
  const gridHeight = (hours.endHour - hours.startHour) * HOUR_HEIGHT;
  const error =
    locale === "ro"
      ? "Calendarul Google s-a schimbat. Reîmprospătează și încearcă din nou."
      : "Google Calendar changed. Refresh and try again.";
  const weekendQuery = showWeekends ? "&weekends=1" : "";
  const previousHref = `/${locale}/admin/appointments?week=${addDays(firstDay, -7)}${weekendQuery}`;
  const nextHref = `/${locale}/admin/appointments?week=${addDays(firstDay, 7)}${weekendQuery}`;
  const todayHref = `/${locale}/admin/appointments?week=${bucharestDate(new Date())}${weekendQuery}`;
  const toggleWeekendsHref = showWeekends
    ? `/${locale}/admin/appointments?week=${firstDay}`
    : `/${locale}/admin/appointments?week=${firstDay}&weekends=1`;
  const nowDate = bucharestDate(new Date());

  return (
    <main className="private-shell therapist-calendar">
      <div className="private-head therapist-calendar__head">
        <div>
          <p className="eyebrow">Eikon Mind</p>
          <h1>{locale === "ro" ? "Calendar programări" : "Appointment calendar"}</h1>
          <p className="muted">
            {locale === "ro"
              ? "Google Calendar stabilește disponibilitatea. Evenimentele externe sunt afișate doar ca timp ocupat."
              : "Google Calendar determines availability. External events are shown only as busy time."}
          </p>
        </div>
        <nav
          className="calendar-nav"
          aria-label={locale === "ro" ? "Navigare calendar" : "Calendar navigation"}
        >
          <Link
            className="button button--secondary"
            href={previousHref as Route}
            aria-label={locale === "ro" ? "Săptămâna anterioară" : "Previous week"}
          >
            <span aria-hidden="true">←</span>
          </Link>
          <Link className="button button--secondary" href={todayHref as Route}>
            {locale === "ro" ? "Azi" : "Today"}
          </Link>
          <Link
            className="button button--secondary"
            href={nextHref as Route}
            aria-label={locale === "ro" ? "Săptămâna următoare" : "Next week"}
          >
            <span aria-hidden="true">→</span>
          </Link>
        </nav>
      </div>

      <div className="calendar-week-toolbar">
        <h2>{rangeLabel(firstDay, days[days.length - 1], locale)}</h2>
        <Link className="button button--secondary button--small" href={toggleWeekendsHref as Route}>
          {showWeekends
            ? locale === "ro"
              ? "Ascunde weekendul"
              : "Hide weekends"
            : locale === "ro"
              ? "Afișează weekendul"
              : "Show weekends"}
        </Link>
      </div>

      {busy === null && (
        <p className="error" role="status">
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
              Client
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

      <div
        className="calendar-grid-scroll"
        role="region"
        tabIndex={0}
        aria-label={
          locale === "ro"
            ? "Calendar săptămânal, derulează orizontal pentru toate zilele"
            : "Weekly calendar, scroll horizontally to see all days"
        }
      >
        <section
          className="calendar-week-grid"
          aria-label={locale === "ro" ? "Săptămâna de lucru" : "Work week"}
          style={{
            gridTemplateColumns: `64px repeat(${days.length}, minmax(220px, 1fr))`,
            minWidth: `calc(64px + ${days.length} * 220px)`,
          }}
        >
          <div className="calendar-grid-corner" aria-hidden="true" />
          {days.map((day) => (
            <div
              className={`calendar-day-heading${day === nowDate ? " is-today" : ""}`}
              key={`heading-${day}`}
            >
              <span className="calendar-day-heading__number">{Number(day.slice(-2))}</span>
              <span>{weekdayLabel(day, locale)}</span>
            </div>
          ))}

          <div
            className="calendar-time-rail"
            style={{ height: `${gridHeight}px` }}
            aria-hidden="true"
          >
            {Array.from({ length: hours.endHour - hours.startHour }, (_, index) => {
              const hour = hours.startHour + index;
              const date = bucharestWallTime(firstDay, hour === 24 ? 23 : hour)!;
              const time = hour === 24 ? "00:00" : formatTime(date, locale);
              return (
                <span
                  className="calendar-hour-label"
                  key={hour}
                  style={{ top: `${index * HOUR_HEIGHT}px` }}
                >
                  {time}
                </span>
              );
            })}
          </div>

          {days.map((day, dayIndex) => (
            <div
              className={`calendar-day-track${day === nowDate ? " is-today" : ""}`}
              key={`track-${day}`}
              style={{ height: `${gridHeight}px` }}
              role="group"
              aria-label={weekdayLabel(day, locale)}
            >
              {daySegments[dayIndex].map((segment) => {
                const { item, startMinutes, endMinutes, lane, laneCount } = segment;
                const title = itemTitle(item, locale);
                const status = eventStatusText(item, locale);
                const service =
                  item.kind === "APPOINTMENT" &&
                  item.serviceCode &&
                  isAppointmentServiceType(item.serviceCode)
                    ? appointmentServiceLabel(item.serviceCode, locale)
                    : null;
                const top = ((startMinutes - hours.startHour * 60) / 60) * HOUR_HEIGHT;
                const height = ((endMinutes - startMinutes) / 60) * HOUR_HEIGHT;
                const left = (lane / laneCount) * 100;
                const width = 100 / laneCount;
                return (
                  <article
                    className={`calendar-event calendar-event--${item.kind.toLowerCase()}${item.status ? ` calendar-event--${item.status.toLowerCase()}` : ""}`}
                    key={`${day}-${item.key}`}
                    style={{
                      top: `${top}px`,
                      height: `${height}px`,
                      left: `calc(${left}% + 3px)`,
                      width: `calc(${width}% - 6px)`,
                    }}
                    aria-label={`${title}, ${formatTime(item.startsAt, locale)}–${formatTime(item.endsAt, locale)}, ${status}${service ? `, ${service}` : ""}`}
                    title={`${title} · ${formatTime(item.startsAt, locale)}–${formatTime(item.endsAt, locale)} · ${status}${service ? ` · ${service}` : ""}`}
                  >
                    <strong>{title}</strong>
                    <span className="calendar-event__time">
                      {formatTime(item.startsAt, locale)}–{formatTime(item.endsAt, locale)}
                    </span>
                    {service && <span className="calendar-event__service">{service}</span>}
                  </article>
                );
              })}
            </div>
          ))}
        </section>
      </div>

      {canManage && (
        <section className="calendar-management" aria-labelledby="calendar-management-title">
          <h2 id="calendar-management-title">
            {locale === "ro" ? "Gestionează evenimentele" : "Manage events"}
          </h2>
          {items.length === 0 ? (
            <p className="muted">
              {locale === "ro"
                ? "Nu există evenimente gestionate în această săptămână."
                : "There are no managed events this week."}
            </p>
          ) : (
            <div className="calendar-management-list">
              {items.map((item) => {
                const event: TimelineEvent = {
                  key: item.id,
                  kind: item.kind,
                  startsAt: item.startsAt,
                  endsAt: item.endsAt,
                  status: item.status,
                  clientName: item.clientName,
                  serviceCode: item.serviceCode,
                  managedItem: item,
                };
                const canChange =
                  item.kind === "BLOCK" ||
                  item.status === "REQUESTED" ||
                  item.status === "CONFIRMED";
                const service =
                  item.kind === "APPOINTMENT" &&
                  item.serviceCode &&
                  isAppointmentServiceType(item.serviceCode)
                    ? appointmentServiceLabel(item.serviceCode, locale)
                    : null;
                return (
                  <details
                    className="calendar-management-item"
                    key={item.id}
                    data-appointment-id={item.appointmentId ?? undefined}
                  >
                    <summary>
                      <strong>{itemTitle(event, locale)}</strong>
                      <span>
                        {formatTime(item.startsAt, locale)}–{formatTime(item.endsAt, locale)}
                        {item.status ? ` · ${appointmentStatusLabel(item.status, locale)}` : ""}
                        {service ? ` · ${service}` : ""}
                      </span>
                    </summary>
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
                      {canChange && (
                        <>
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
                            <button
                              type="submit"
                              className="button button--secondary button--small"
                            >
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
                        </>
                      )}
                    </div>
                  </details>
                );
              })}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
