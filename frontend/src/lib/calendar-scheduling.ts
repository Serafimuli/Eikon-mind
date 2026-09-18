export const CALENDAR_TIME_ZONE = "Europe/Bucharest";
export const CLIENT_SLOT_MINUTES = 60;
export const CLIENT_BOOKING_NOTICE_MILLISECONDS = 24 * 60 * 60 * 1000;
export const CLIENT_BOOKING_HORIZON_DAYS = 60;

export type ClientCalendarSlot = { startsAt: Date; endsAt: Date };

function partsAt(value: Date) {
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: CALENDAR_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(value)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  ) as Record<"year" | "month" | "day" | "weekday" | "hour" | "minute", string>;
}

export function bucharestDate(value: Date) {
  const parts = partsAt(value);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function isClientBookingDate(value: Date) {
  const weekday = partsAt(value).weekday;
  return weekday !== "Sat" && weekday !== "Sun";
}

function offsetMilliseconds(value: Date) {
  const parts = partsAt(value);
  return (
    Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
    ) - value.getTime()
  );
}

export function bucharestWallTime(date: string, hour: number) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match || hour < 0 || hour > 23) return null;
  const [, rawYear, rawMonth, rawDay] = match;
  const wallClockUtc = Date.UTC(Number(rawYear), Number(rawMonth) - 1, Number(rawDay), hour, 0, 0);
  let result = new Date(wallClockUtc - offsetMilliseconds(new Date(wallClockUtc)));
  result = new Date(wallClockUtc - offsetMilliseconds(result));
  const rendered = partsAt(result);
  if (
    rendered.year !== rawYear ||
    rendered.month !== rawMonth ||
    rendered.day !== rawDay ||
    Number(rendered.hour) !== hour ||
    Number(rendered.minute) !== 0
  ) {
    return null;
  }
  return result;
}

export function clientBookingDateBounds(now = new Date()) {
  const earliest = new Date(now.getTime() + CLIENT_BOOKING_NOTICE_MILLISECONDS);
  const latest = new Date(now.getTime() + CLIENT_BOOKING_HORIZON_DAYS * 86_400_000);
  return { earliest, latest };
}

export function clientSlotsForDate(date: string) {
  const slots: ClientCalendarSlot[] = [];
  for (let hour = 9; hour < 19; hour += 1) {
    const startsAt = bucharestWallTime(date, hour);
    if (!startsAt || !isClientBookingDate(startsAt)) continue;
    slots.push({ startsAt, endsAt: new Date(startsAt.getTime() + CLIENT_SLOT_MINUTES * 60_000) });
  }
  return slots;
}

export function isClientSlot(startsAt: Date, now = new Date()) {
  const parts = partsAt(startsAt);
  const { earliest, latest } = clientBookingDateBounds(now);
  return (
    startsAt.getTime() >= earliest.getTime() &&
    startsAt.getTime() <= latest.getTime() &&
    isClientBookingDate(startsAt) &&
    Number(parts.minute) === 0 &&
    Number(parts.hour) >= 9 &&
    Number(parts.hour) < 19
  );
}

export function overlaps(start: Date, end: Date, otherStart: Date, otherEnd: Date) {
  return start < otherEnd && end > otherStart;
}
