import { bucharestDate, bucharestWallTime, overlaps } from "@/lib/calendar-scheduling";

export type CalendarTimedItem = {
  startsAt: Date;
  endsAt: Date;
};

export type CalendarDaySegment<T extends CalendarTimedItem> = {
  item: T;
  startMinutes: number;
  endMinutes: number;
};

export type PositionedCalendarSegment<T extends CalendarTimedItem> = CalendarDaySegment<T> & {
  lane: number;
  laneCount: number;
};

function minuteOfDay(value: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Bucharest",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(value);
  const values = Object.fromEntries(
    parts.filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)]),
  );
  return values.hour * 60 + values.minute;
}

export function splitCalendarItemsForDay<T extends CalendarTimedItem>(
  day: string,
  items: readonly T[],
): CalendarDaySegment<T>[] {
  const dayStart = bucharestWallTime(day, 0);
  const nextDate = new Date(`${day}T12:00:00.000Z`);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  const nextDay = nextDate.toISOString().slice(0, 10);
  const dayEnd = bucharestWallTime(nextDay, 0);
  if (!dayStart || !dayEnd) return [];

  return items.flatMap((item) => {
    if (!overlaps(item.startsAt, item.endsAt, dayStart, dayEnd)) return [];
    return [
      {
        item,
        startMinutes: item.startsAt <= dayStart ? 0 : minuteOfDay(item.startsAt),
        endMinutes: item.endsAt >= dayEnd ? 24 * 60 : minuteOfDay(item.endsAt),
      },
    ];
  });
}

export function visibleCalendarHours<T extends CalendarTimedItem>(
  segments: readonly CalendarDaySegment<T>[],
) {
  const firstEventHour = segments.length
    ? Math.floor(Math.min(...segments.map((segment) => segment.startMinutes)) / 60)
    : 9;
  const lastEventHour = segments.length
    ? Math.ceil(Math.max(...segments.map((segment) => segment.endMinutes)) / 60)
    : 19;
  return {
    startHour: Math.max(0, Math.min(9, firstEventHour)),
    endHour: Math.min(24, Math.max(19, lastEventHour)),
  };
}

export function placeOverlappingCalendarSegments<T extends CalendarTimedItem>(
  segments: readonly CalendarDaySegment<T>[],
): PositionedCalendarSegment<T>[] {
  const sorted = [...segments].sort(
    (left, right) => left.startMinutes - right.startMinutes || right.endMinutes - left.endMinutes,
  );
  const positioned: PositionedCalendarSegment<T>[] = [];
  let cluster: CalendarDaySegment<T>[] = [];
  let clusterEnd = -1;

  const flush = () => {
    if (cluster.length === 0) return;
    const laneEnds: number[] = [];
    const laneAssignments: number[] = [];
    for (const segment of cluster) {
      let lane = laneEnds.findIndex((end) => end <= segment.startMinutes);
      if (lane === -1) lane = laneEnds.length;
      laneEnds[lane] = segment.endMinutes;
      laneAssignments.push(lane);
    }
    const laneCount = laneEnds.length;
    cluster.forEach((segment, index) => {
      positioned.push({ ...segment, lane: laneAssignments[index], laneCount });
    });
    cluster = [];
    clusterEnd = -1;
  };

  for (const segment of sorted) {
    if (cluster.length > 0 && segment.startMinutes >= clusterEnd) flush();
    cluster.push(segment);
    clusterEnd = Math.max(clusterEnd, segment.endMinutes);
  }
  flush();
  return positioned.sort(
    (left, right) => left.startMinutes - right.startMinutes || right.endMinutes - left.endMinutes,
  );
}

export function calendarDayKey(date: Date) {
  return bucharestDate(date);
}
