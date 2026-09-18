import "server-only";

import { eq } from "drizzle-orm";
import { getD1, getDb } from "@/lib/db";
import { appointments, users } from "@/lib/db/schema";
import { DomainError } from "@/lib/errors";
import { appointmentEmail, sendTransactionalEmail } from "@/lib/integrations/email";
import { defer, getApplicationOrigin, getRuntimeEnv } from "@/lib/platform-env";
import { resolveSecret } from "@/lib/runtime-secret";
import {
  CLIENT_SLOT_MINUTES,
  clientSlotsForDate,
  overlaps,
  type ClientCalendarSlot,
} from "@/lib/calendar-scheduling";

export const PENDING_EVENT_COLOR = "5";
export const CONFIRMED_EVENT_COLOR = "10";
const MANAGED_PROPERTY = "eikonMindManaged";
const MANAGED_KIND_PROPERTY = "eikonMindItemKind";
const MANAGED_APPOINTMENT_PROPERTY = "eikonMindAppointmentId";
const WATCH_RENEWAL_MILLISECONDS = 24 * 60 * 60 * 1000;

export type CalendarEnvironment = Pick<
  CloudflareEnv,
  | "DB"
  | "GOOGLE_CLIENT_ID"
  | "GOOGLE_CLIENT_SECRET"
  | "GOOGLE_REFRESH_TOKEN"
  | "GOOGLE_CALENDAR_ID"
  | "BETTER_AUTH_URL"
  | "APP_ENV"
  | "EMAIL_FROM_ADDRESS"
  | "FREE_TIER_ONLY"
  | "OPERATIONS_MAILBOX"
  | "RESEND_API_KEY"
>;

type GoogleCredentials = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  calendarId: string;
};

type GoogleEvent = {
  id?: string;
  etag?: string;
  status?: "confirmed" | "cancelled" | "tentative";
  colorId?: string;
  start?: { dateTime?: string };
  end?: { dateTime?: string };
  extendedProperties?: { private?: Record<string, string | undefined> };
};

type GoogleEventResponse = GoogleEvent & { id: string; etag?: string };

export type BusyInterval = { start: Date; end: Date };
export type ManagedItemKind = "APPOINTMENT" | "BLOCK";

export class CalendarConflictError extends Error {
  constructor() {
    super("The calendar changed before this action could be applied");
    this.name = "CalendarConflictError";
  }
}

function assertSecret(value: string | undefined, name: string) {
  if (!value) throw new Error(`Missing required ${name} secret`);
  return value;
}

async function credentials(env: CalendarEnvironment): Promise<GoogleCredentials> {
  const [clientId, clientSecret, refreshToken, calendarId] = await Promise.all([
    resolveSecret(env.GOOGLE_CLIENT_ID, "GOOGLE_CLIENT_ID"),
    resolveSecret(env.GOOGLE_CLIENT_SECRET, "GOOGLE_CLIENT_SECRET"),
    resolveSecret(env.GOOGLE_REFRESH_TOKEN, "GOOGLE_REFRESH_TOKEN"),
    resolveSecret(env.GOOGLE_CALENDAR_ID, "GOOGLE_CALENDAR_ID"),
  ]);
  return { clientId, clientSecret, refreshToken, calendarId };
}

async function accessToken(input: GoogleCredentials) {
  const body = new URLSearchParams({
    client_id: input.clientId,
    client_secret: input.clientSecret,
    refresh_token: input.refreshToken,
    grant_type: "refresh_token",
  });
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) throw new Error("Google OAuth refresh failed");
  const bodyJson = (await response.json()) as { access_token?: string };
  return assertSecret(bodyJson.access_token, "Google access token");
}

async function googleRequest(env: CalendarEnvironment, path: string, init: RequestInit = {}) {
  const input = await credentials(env);
  const token = await accessToken(input);
  const response = await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...init.headers,
    },
  });
  if (response.status === 412) throw new CalendarConflictError();
  if (!response.ok) throw new Error(`Google Calendar request failed (${response.status})`);
  return response;
}

async function calendarPath(env: CalendarEnvironment) {
  const { calendarId } = await credentials(env);
  return `/calendars/${encodeURIComponent(calendarId)}`;
}

function eventPayload(input: {
  kind: ManagedItemKind;
  appointmentId?: string;
  startsAt: Date;
  endsAt: Date;
  status: "REQUESTED" | "CONFIRMED";
}) {
  return {
    summary: "Reserved time",
    transparency: "opaque",
    visibility: "private",
    colorId: input.status === "REQUESTED" ? PENDING_EVENT_COLOR : CONFIRMED_EVENT_COLOR,
    start: { dateTime: input.startsAt.toISOString(), timeZone: "Europe/Bucharest" },
    end: { dateTime: input.endsAt.toISOString(), timeZone: "Europe/Bucharest" },
    extendedProperties: {
      private: {
        [MANAGED_PROPERTY]: "1",
        [MANAGED_KIND_PROPERTY]: input.kind,
        ...(input.appointmentId ? { [MANAGED_APPOINTMENT_PROPERTY]: input.appointmentId } : {}),
      },
    },
  };
}

export async function getBusyIntervals(
  env: CalendarEnvironment,
  startsAt: Date,
  endsAt: Date,
): Promise<BusyInterval[]> {
  const input = await credentials(env);
  const token = await accessToken(input);
  const response = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({
      timeMin: startsAt.toISOString(),
      timeMax: endsAt.toISOString(),
      timeZone: "Europe/Bucharest",
      items: [{ id: input.calendarId }],
    }),
  });
  if (!response.ok) throw new Error("Google Calendar FreeBusy query failed");
  const body = (await response.json()) as {
    calendars?: Record<string, { busy?: Array<{ start: string; end: string }> }>;
  };
  return (body.calendars?.[input.calendarId]?.busy ?? []).map((item) => ({
    start: new Date(item.start),
    end: new Date(item.end),
  }));
}

export async function availableClientSlots(
  env: CalendarEnvironment,
  date: string,
  now = new Date(),
): Promise<ClientCalendarSlot[]> {
  const candidates = clientSlotsForDate(date).filter(
    (slot) => slot.startsAt.getTime() >= now.getTime() + 24 * 60 * 60 * 1000,
  );
  if (candidates.length === 0) return [];
  const busy = await getBusyIntervals(env, candidates[0].startsAt, candidates.at(-1)!.endsAt);
  return candidates.filter(
    (slot) => !busy.some((item) => overlaps(slot.startsAt, slot.endsAt, item.start, item.end)),
  );
}

export async function assertGoogleCalendarFree(
  env: CalendarEnvironment,
  startsAt: Date,
  endsAt = new Date(startsAt.getTime() + CLIENT_SLOT_MINUTES * 60_000),
) {
  const busy = await getBusyIntervals(env, startsAt, endsAt);
  if (busy.some((item) => overlaps(startsAt, endsAt, item.start, item.end))) {
    throw new DomainError("That time is no longer available", "CONFLICT");
  }
}

export async function createManagedGoogleEvent(
  env: CalendarEnvironment,
  input: {
    kind: ManagedItemKind;
    appointmentId?: string;
    startsAt: Date;
    endsAt: Date;
    status: "REQUESTED" | "CONFIRMED";
  },
) {
  const base = await calendarPath(env);
  const response = await googleRequest(env, `${base}/events?sendUpdates=none`, {
    method: "POST",
    body: JSON.stringify(eventPayload(input)),
  });
  return (await response.json()) as GoogleEventResponse;
}

export async function updateManagedGoogleEvent(
  env: CalendarEnvironment,
  eventId: string,
  input: Partial<{ startsAt: Date; endsAt: Date; status: "REQUESTED" | "CONFIRMED" }>,
  etag?: string | null,
) {
  const base = await calendarPath(env);
  const body: Record<string, unknown> = {};
  if (input.startsAt)
    body.start = { dateTime: input.startsAt.toISOString(), timeZone: "Europe/Bucharest" };
  if (input.endsAt)
    body.end = { dateTime: input.endsAt.toISOString(), timeZone: "Europe/Bucharest" };
  if (input.status)
    body.colorId = input.status === "REQUESTED" ? PENDING_EVENT_COLOR : CONFIRMED_EVENT_COLOR;
  const response = await googleRequest(
    env,
    `${base}/events/${encodeURIComponent(eventId)}?sendUpdates=none`,
    {
      method: "PATCH",
      headers: etag ? { "if-match": etag } : {},
      body: JSON.stringify(body),
    },
  );
  return (await response.json()) as GoogleEventResponse;
}

export async function deleteManagedGoogleEvent(
  env: CalendarEnvironment,
  eventId: string,
  etag?: string | null,
) {
  const base = await calendarPath(env);
  await googleRequest(env, `${base}/events/${encodeURIComponent(eventId)}?sendUpdates=none`, {
    method: "DELETE",
    headers: etag ? { "if-match": etag } : {},
  });
}

export async function insertManagedItem(input: {
  id: string;
  appointmentId?: string;
  eventId: string;
  kind: ManagedItemKind;
  etag?: string;
  startsAt: Date;
  endsAt: Date;
}) {
  const now = Date.now();
  await getD1()
    .prepare(
      `INSERT INTO calendar_managed_item
       (id, appointment_id, event_id, kind, etag, starts_at, ends_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      input.id,
      input.appointmentId ?? null,
      input.eventId,
      input.kind,
      input.etag ?? null,
      input.startsAt.getTime(),
      input.endsAt.getTime(),
      now,
      now,
    )
    .run();
}

async function sendClientNotification(
  appointmentId: string,
  kind: "confirmed" | "cancelled" | "updated",
) {
  const [row] = await getDb()
    .select({ email: users.email, emailVerified: users.emailVerified })
    .from(appointments)
    .innerJoin(users, eq(appointments.clientId, users.id))
    .where(eq(appointments.id, appointmentId))
    .limit(1);
  if (row?.emailVerified) {
    defer(
      sendTransactionalEmail(getRuntimeEnv(), row.email, appointmentEmail(kind)),
      "calendar appointment email",
    );
  }
}

function managedEvent(event: GoogleEvent) {
  const properties = event.extendedProperties?.private;
  if (properties?.[MANAGED_PROPERTY] !== "1" || !event.id) return null;
  const kind = properties[MANAGED_KIND_PROPERTY];
  if (kind !== "APPOINTMENT" && kind !== "BLOCK") return null;
  return { kind, appointmentId: properties[MANAGED_APPOINTMENT_PROPERTY] } as {
    kind: ManagedItemKind;
    appointmentId?: string;
  };
}

function eventTime(event: GoogleEvent) {
  if (!event.start?.dateTime || !event.end?.dateTime) return null;
  const startsAt = new Date(event.start.dateTime);
  const endsAt = new Date(event.end.dateTime);
  if (
    !Number.isFinite(startsAt.getTime()) ||
    !Number.isFinite(endsAt.getTime()) ||
    endsAt <= startsAt
  )
    return null;
  return { startsAt, endsAt };
}

async function applyGoogleEvent(event: GoogleEvent) {
  const managed = managedEvent(event);
  if (!managed || !event.id) return;
  const item = await getD1()
    .prepare(
      "SELECT id, appointment_id, kind, starts_at, ends_at FROM calendar_managed_item WHERE event_id = ?",
    )
    .bind(event.id)
    .first<{
      id: string;
      appointment_id: string | null;
      kind: ManagedItemKind;
      starts_at: number;
      ends_at: number;
    }>();
  if (!item) return;
  const now = Date.now();
  if (event.status === "cancelled") {
    if (item.appointment_id) {
      const result = await getD1()
        .prepare(
          "UPDATE appointment SET status = 'CANCELLED', cancelled_at = ?, updated_at = ? WHERE id = ? AND status IN ('REQUESTED', 'CONFIRMED')",
        )
        .bind(now, now, item.appointment_id)
        .run();
      if (result.meta.changes > 0) await sendClientNotification(item.appointment_id, "cancelled");
    }
    await getD1().prepare("DELETE FROM calendar_managed_item WHERE id = ?").bind(item.id).run();
    return;
  }
  const time = eventTime(event);
  if (!time) return;
  await getD1()
    .prepare(
      "UPDATE calendar_managed_item SET etag = ?, starts_at = ?, ends_at = ?, updated_at = ? WHERE id = ?",
    )
    .bind(event.etag ?? null, time.startsAt.getTime(), time.endsAt.getTime(), now, item.id)
    .run();
  if (!item.appointment_id) return;
  const appointment = await getD1()
    .prepare("SELECT status, starts_at, ends_at FROM appointment WHERE id = ?")
    .bind(item.appointment_id)
    .first<{
      status: "REQUESTED" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
      starts_at: number;
      ends_at: number;
    }>();
  if (!appointment || appointment.status === "CANCELLED" || appointment.status === "COMPLETED")
    return;
  const confirms = appointment.status === "REQUESTED" && event.colorId === CONFIRMED_EVENT_COLOR;
  const moved =
    appointment.starts_at !== time.startsAt.getTime() ||
    appointment.ends_at !== time.endsAt.getTime();
  if (!confirms && !moved) return;
  await getD1()
    .prepare(
      "UPDATE appointment SET status = ?, starts_at = ?, ends_at = ?, updated_at = ? WHERE id = ?",
    )
    .bind(
      confirms ? "CONFIRMED" : appointment.status,
      time.startsAt.getTime(),
      time.endsAt.getTime(),
      now,
      item.appointment_id,
    )
    .run();
  await sendClientNotification(item.appointment_id, confirms ? "confirmed" : "updated");
}

async function listGoogleEvents(env: CalendarEnvironment, syncToken?: string | null) {
  const base = await calendarPath(env);
  const params = new URLSearchParams({
    singleEvents: "true",
    showDeleted: "true",
    maxResults: "250",
  });
  if (syncToken) params.set("syncToken", syncToken);
  const events: GoogleEvent[] = [];
  let pageToken: string | undefined;
  let nextSyncToken: string | undefined;
  do {
    if (pageToken) params.set("pageToken", pageToken);
    const response = await googleRequest(env, `${base}/events?${params.toString()}`);
    const body = (await response.json()) as {
      items?: GoogleEvent[];
      nextPageToken?: string;
      nextSyncToken?: string;
    };
    events.push(...(body.items ?? []));
    pageToken = body.nextPageToken;
    nextSyncToken = body.nextSyncToken ?? nextSyncToken;
  } while (pageToken);
  return { events, nextSyncToken };
}

export async function synchronizeGoogleCalendar(env: CalendarEnvironment) {
  const state = await env.DB.prepare(
    "SELECT sync_token FROM calendar_sync_state WHERE id = 1",
  ).first<{ sync_token: string | null }>();
  let result: Awaited<ReturnType<typeof listGoogleEvents>>;
  try {
    result = await listGoogleEvents(env, state?.sync_token);
  } catch (error) {
    if (state?.sync_token && error instanceof Error && error.message.includes("(410)")) {
      result = await listGoogleEvents(env);
    } else {
      throw error;
    }
  }
  for (const event of result.events) await applyGoogleEvent(event);
  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO calendar_sync_state (id, sync_token, updated_at)
     VALUES (1, ?, ?)
     ON CONFLICT(id) DO UPDATE SET sync_token = excluded.sync_token, sync_requested_at = NULL, updated_at = excluded.updated_at`,
  )
    .bind(result.nextSyncToken ?? state?.sync_token ?? null, now)
    .run();
}

export async function ensureGoogleCalendarWatch(env: CalendarEnvironment) {
  const state = await env.DB.prepare(
    "SELECT channel_expires_at FROM calendar_sync_state WHERE id = 1",
  ).first<{ channel_expires_at: number | null }>();
  if (
    state?.channel_expires_at &&
    state.channel_expires_at > Date.now() + WATCH_RENEWAL_MILLISECONDS
  )
    return;
  const base = await calendarPath(env);
  const channelId = crypto.randomUUID();
  const channelToken = crypto.randomUUID();
  const response = await googleRequest(env, `${base}/events/watch`, {
    method: "POST",
    body: JSON.stringify({
      id: channelId,
      type: "web_hook",
      address: `${getApplicationOrigin()}/api/calendar/webhook`,
      token: channelToken,
    }),
  });
  const channel = (await response.json()) as { resourceId?: string; expiration?: string };
  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO calendar_sync_state
     (id, channel_id, channel_resource_id, channel_token, channel_expires_at, updated_at)
     VALUES (1, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET channel_id = excluded.channel_id, channel_resource_id = excluded.channel_resource_id,
       channel_token = excluded.channel_token, channel_expires_at = excluded.channel_expires_at, updated_at = excluded.updated_at`,
  )
    .bind(
      channelId,
      channel.resourceId ?? null,
      channelToken,
      Number(channel.expiration) || null,
      now,
    )
    .run();
}

export async function receiveGoogleCalendarNotification(
  env: CalendarEnvironment,
  headers: Headers,
) {
  const state = await env.DB.prepare(
    "SELECT channel_id, channel_resource_id, channel_token FROM calendar_sync_state WHERE id = 1",
  ).first<{
    channel_id: string | null;
    channel_resource_id: string | null;
    channel_token: string | null;
  }>();
  if (
    !state ||
    headers.get("x-goog-channel-id") !== state.channel_id ||
    headers.get("x-goog-resource-id") !== state.channel_resource_id ||
    headers.get("x-goog-channel-token") !== state.channel_token
  )
    return false;
  const now = Date.now();
  await env.DB.prepare(
    "UPDATE calendar_sync_state SET sync_requested_at = ?, updated_at = ? WHERE id = 1",
  )
    .bind(now, now)
    .run();
  return true;
}

export async function processCalendarMaintenance(env: CalendarEnvironment) {
  await synchronizeGoogleCalendar(env);
  await ensureGoogleCalendarWatch(env);
}
