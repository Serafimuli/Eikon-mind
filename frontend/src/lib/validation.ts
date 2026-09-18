import { z } from "zod";
import { APPOINTMENT_STATUSES } from "@/lib/appointment-types";

export const localeSchema = z.enum(["ro", "en"]);
// Better Auth's default ID generator creates 32-character alphanumeric IDs.
// Keep this separate from UUIDs used by application-owned resources.
export const betterAuthUserIdSchema = z.string().regex(/^[A-Za-z0-9]{32}$/);
export const resourceIdSchema = z.string().uuid();
export const roleSchema = z.enum(["USER", "THERAPIST", "ADMIN"]);
export const appointmentStatusSchema = z.enum(APPOINTMENT_STATUSES);

const BUCHAREST_TIME_ZONE = "Europe/Bucharest";
const localDateTimePattern = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

function bucharestOffsetMilliseconds(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUCHAREST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  })
    .formatToParts(date)
    .reduce<Record<string, number>>((result, part) => {
      if (part.type !== "literal") result[part.type] = Number(part.value);
      return result;
    }, {});

  return (
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) -
    date.getTime()
  );
}

export function parseBucharestLocalDateTime(value: string) {
  const match = localDateTimePattern.exec(value);
  if (!match) return null;

  const [, year, month, day, hour, minute] = match.map(Number);
  const wallClockUtc = Date.UTC(year, month - 1, day, hour, minute);
  let result = new Date(wallClockUtc - bucharestOffsetMilliseconds(new Date(wallClockUtc)));
  result = new Date(wallClockUtc - bucharestOffsetMilliseconds(result));

  const rendered = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUCHAREST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(result);
  const renderedValue = Object.fromEntries(
    rendered
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );
  if (
    renderedValue.year !== year ||
    renderedValue.month !== month ||
    renderedValue.day !== day ||
    renderedValue.hour !== hour ||
    renderedValue.minute !== minute
  ) {
    return null;
  }
  return result;
}

export const bookingRequestSchema = z
  .object({
    startsAt: z.string().datetime({ offset: true }),
    rescheduleFromAppointmentId: resourceIdSchema.optional(),
  })
  .strict();

export function parseLocale(value: unknown) {
  return localeSchema.parse(value);
}
