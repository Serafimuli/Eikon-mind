import assert from "node:assert/strict";
import test from "node:test";
import { bucharestWallTime } from "../src/lib/calendar-scheduling";
import {
  placeOverlappingCalendarSegments,
  splitCalendarItemsForDay,
  visibleCalendarHours,
} from "../src/lib/calendar-week-layout";

type Entry = { id: string; startsAt: Date; endsAt: Date };

function at(day: string, hour: number, minute = 0) {
  const hourStart = bucharestWallTime(day, hour);
  assert.ok(hourStart);
  return new Date(hourStart.getTime() + minute * 60_000);
}

function event(
  id: string,
  day: string,
  startHour: number,
  startMinute: number,
  duration: number,
): Entry {
  const startsAt = at(day, startHour, startMinute);
  return { id, startsAt, endsAt: new Date(startsAt.getTime() + duration * 60_000) };
}

test("workweek event segments receive readable side-by-side overlap lanes", () => {
  const day = "2027-03-02";
  const entries = [
    event("one", day, 10, 0, 60),
    event("two", day, 10, 30, 60),
    event("three", day, 11, 30, 30),
  ];
  const positioned = placeOverlappingCalendarSegments(splitCalendarItemsForDay(day, entries));

  assert.deepEqual(
    positioned.map(({ item, lane, laneCount }) => ({ id: item.id, lane, laneCount })),
    [
      { id: "one", lane: 0, laneCount: 2 },
      { id: "two", lane: 1, laneCount: 2 },
      { id: "three", lane: 0, laneCount: 1 },
    ],
  );
});

test("visible hours expand to contain early and late appointments", () => {
  const day = "2027-03-02";
  const early = event("early", day, 8, 30, 60);
  const late = event("late", day, 19, 30, 60);
  const segments = [
    ...splitCalendarItemsForDay(day, [early]),
    ...splitCalendarItemsForDay(day, [late]),
  ];

  assert.deepEqual(visibleCalendarHours(segments), { startHour: 8, endHour: 21 });
  assert.deepEqual(visibleCalendarHours([]), { startHour: 9, endHour: 19 });
});

test("events spanning midnight remain visible in both day columns", () => {
  const eventStart = at("2027-03-02", 23, 30);
  const entry = {
    id: "overnight",
    startsAt: eventStart,
    endsAt: new Date(eventStart.getTime() + 2 * 60 * 60_000),
  };

  const firstHalf = splitCalendarItemsForDay("2027-03-02", [entry]);
  const secondHalf = splitCalendarItemsForDay("2027-03-03", [entry]);
  assert.deepEqual(
    firstHalf.map(({ startMinutes, endMinutes }) => [startMinutes, endMinutes]),
    [[1410, 1440]],
  );
  assert.deepEqual(
    secondHalf.map(({ startMinutes, endMinutes }) => [startMinutes, endMinutes]),
    [[0, 90]],
  );
});
