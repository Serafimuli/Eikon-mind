import { z } from "zod";
import { APPOINTMENT_STATUSES } from "@/lib/appointment-types";

export const localeSchema = z.enum(["ro", "en"]);
export const idSchema = z.string().uuid();
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

const formDateSchema = z
  .string()
  .trim()
  .min(1)
  .max(40)
  .transform((value, context) => {
    const date = parseBucharestLocalDateTime(value);
    if (!date) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid date and time" });
      return z.NEVER;
    }
    return date;
  });

export const availabilityFormSchema = z
  .object({
    therapistId: z.string().trim().max(36).optional().default(""),
    startsAt: formDateSchema,
    endsAt: formDateSchema,
  })
  .refine((value) => value.endsAt > value.startsAt, {
    message: "End time must be after start time",
    path: ["endsAt"],
  });

export const bookingRequestSchema = z
  .object({
    slotId: idSchema,
    rescheduleFromAppointmentId: idSchema.optional(),
  })
  .strict();

export function parseLocale(value: unknown) {
  return localeSchema.parse(value);
}
