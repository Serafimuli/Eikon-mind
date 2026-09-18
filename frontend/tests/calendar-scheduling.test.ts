import assert from "node:assert/strict";
import test from "node:test";
import {
  bucharestWallTime,
  clientSlotsForDate,
  isClientSlot,
  overlaps,
} from "../src/lib/calendar-scheduling";

test("client slots are one-hour Bucharest weekday hours from 09:00 through 18:00", () => {
  const slots = clientSlotsForDate("2026-09-21"); // Monday, during EEST.
  assert.equal(slots.length, 10);
  assert.equal(slots[0].startsAt.toISOString(), "2026-09-21T06:00:00.000Z");
  assert.equal(slots.at(-1)?.endsAt.toISOString(), "2026-09-21T16:00:00.000Z");
  assert.deepEqual(clientSlotsForDate("2026-09-19"), []);
});

test("client selection enforces weekday, whole-hour, notice, and horizon rules", () => {
  const now = new Date("2026-09-18T06:00:00.000Z");
  const valid = bucharestWallTime("2026-09-21", 9)!;
  assert.equal(isClientSlot(valid, now), true);
  assert.equal(isClientSlot(new Date(valid.getTime() - 30 * 60_000), now), false);
  assert.equal(isClientSlot(bucharestWallTime("2026-11-18", 9)!, now), false);
});

test("overlap uses inclusive start and exclusive end boundaries", () => {
  const start = new Date("2026-09-21T06:00:00.000Z");
  const end = new Date("2026-09-21T07:00:00.000Z");
  assert.equal(overlaps(start, end, end, new Date("2026-09-21T08:00:00.000Z")), false);
  assert.equal(
    overlaps(
      start,
      end,
      new Date("2026-09-21T06:30:00.000Z"),
      new Date("2026-09-21T07:30:00.000Z"),
    ),
    true,
  );
});
