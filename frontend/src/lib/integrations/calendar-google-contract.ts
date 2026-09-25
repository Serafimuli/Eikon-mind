export const GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar";
export const GOOGLE_CALENDAR_EVENTS_SCOPE = "https://www.googleapis.com/auth/calendar.events";
export const GOOGLE_CALENDAR_FREEBUSY_SCOPE = "https://www.googleapis.com/auth/calendar.freebusy";

export const PENDING_EVENT_COLOR = "5";
export const CONFIRMED_EVENT_COLOR = "10";
export const MANAGED_PROPERTY = "eikonMindManaged";
export const MANAGED_KIND_PROPERTY = "eikonMindItemKind";
export const MANAGED_APPOINTMENT_PROPERTY = "eikonMindAppointmentId";

export function isCalendarTestMockEnabled(env: { APP_ENV?: string; E2E_CALENDAR_MOCK?: string }) {
  return env.APP_ENV === "local" && env.E2E_CALENDAR_MOCK === "true";
}

export function managedGoogleEventPayload(input: {
  kind: "APPOINTMENT" | "BLOCK";
  appointmentId?: string;
  startsAt: Date;
  endsAt: Date;
  status: "REQUESTED" | "CONFIRMED";
  summary?: string;
  description?: string;
}) {
  const hasClientDetails = input.kind === "APPOINTMENT" && Boolean(input.summary?.trim());
  return {
    summary: hasClientDetails ? input.summary!.trim() : "Reserved time",
    ...(hasClientDetails && input.description ? { description: input.description } : {}),
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

const EVENT_WRITE_SCOPES = new Set([
  GOOGLE_CALENDAR_SCOPE,
  GOOGLE_CALENDAR_EVENTS_SCOPE,
  "https://www.googleapis.com/auth/calendar.app.created",
  "https://www.googleapis.com/auth/calendar.events.owned",
]);
const FREEBUSY_SCOPES = new Set([
  GOOGLE_CALENDAR_SCOPE,
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events.freebusy",
  GOOGLE_CALENDAR_FREEBUSY_SCOPE,
]);

export type GoogleCalendarOperation = "oauth-refresh" | "calendar-request" | "freebusy-query";
export type GoogleCalendarErrorDetails = {
  operation: GoogleCalendarOperation;
  status?: number;
  reason: string;
};
export type GoogleBusyInterval = { start: Date; end: Date };

export class GoogleCalendarIntegrationError extends Error {
  readonly operation: GoogleCalendarOperation;
  readonly status?: number;
  readonly reason: string;

  constructor(details: GoogleCalendarErrorDetails) {
    super(`Google Calendar ${details.operation} failed: ${details.reason}`);
    this.name = "GoogleCalendarIntegrationError";
    this.operation = details.operation;
    this.status = details.status;
    this.reason = details.reason;
  }
}

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function providerReason(body: unknown) {
  const payload = record(body);
  if (!payload) return "provider_error";
  if (typeof payload.error === "string") return payload.error;
  const error = record(payload.error);
  if (!error) return "provider_error";
  if (typeof error.reason === "string") return error.reason;
  if (Array.isArray(error.errors)) {
    const first = record(error.errors[0]);
    if (typeof first?.reason === "string") return first.reason;
  }
  return "provider_error";
}

export function googleCalendarRequestError(
  operation: GoogleCalendarOperation,
  status: number,
  body: unknown,
) {
  return new GoogleCalendarIntegrationError({
    operation,
    status,
    reason: providerReason(body),
  });
}

export function assertGoogleCalendarScopes(scope: unknown) {
  if (typeof scope !== "string" || !scope.trim()) {
    throw new GoogleCalendarIntegrationError({
      operation: "oauth-refresh",
      reason: "missing_scope",
    });
  }
  const granted = new Set(scope.trim().split(/\s+/));
  if (![...EVENT_WRITE_SCOPES].some((candidate) => granted.has(candidate))) {
    throw new GoogleCalendarIntegrationError({
      operation: "oauth-refresh",
      reason: "missing_event_write_scope",
    });
  }
  if (![...FREEBUSY_SCOPES].some((candidate) => granted.has(candidate))) {
    throw new GoogleCalendarIntegrationError({
      operation: "oauth-refresh",
      reason: "missing_freebusy_scope",
    });
  }
}

export function parseGoogleFreeBusyResponse(
  body: unknown,
  calendarId: string,
): GoogleBusyInterval[] {
  const payload = record(body);
  const calendars = record(payload?.calendars);
  const calendar = record(calendars?.[calendarId]);
  if (!calendar) {
    throw new GoogleCalendarIntegrationError({
      operation: "freebusy-query",
      status: 200,
      reason: "invalid_response",
    });
  }
  if (Array.isArray(calendar.errors) && calendar.errors.length > 0) {
    const first = record(calendar.errors[0]);
    throw new GoogleCalendarIntegrationError({
      operation: "freebusy-query",
      status: 200,
      reason: typeof first?.reason === "string" ? first.reason : "calendar_error",
    });
  }
  if (calendar.busy === undefined) return [];
  if (!Array.isArray(calendar.busy)) {
    throw new GoogleCalendarIntegrationError({
      operation: "freebusy-query",
      status: 200,
      reason: "invalid_response",
    });
  }

  return calendar.busy.map((value) => {
    const interval = record(value);
    const start = new Date(typeof interval?.start === "string" ? interval.start : Number.NaN);
    const end = new Date(typeof interval?.end === "string" ? interval.end : Number.NaN);
    if (
      !Number.isFinite(start.getTime()) ||
      !Number.isFinite(end.getTime()) ||
      end.getTime() <= start.getTime()
    ) {
      throw new GoogleCalendarIntegrationError({
        operation: "freebusy-query",
        status: 200,
        reason: "invalid_response",
      });
    }
    return { start, end };
  });
}

export function googleCalendarErrorDetails(
  error: unknown,
  fallbackOperation: GoogleCalendarOperation,
): GoogleCalendarErrorDetails {
  if (error instanceof GoogleCalendarIntegrationError) {
    return {
      operation: error.operation,
      ...(error.status === undefined ? {} : { status: error.status }),
      reason: error.reason,
    };
  }
  return { operation: fallbackOperation, reason: "unexpected_error" };
}
