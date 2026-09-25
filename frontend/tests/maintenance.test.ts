import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { runRetention } from "../workers/maintenance";

type RecordedStatement = {
  sql: string;
  bindings: unknown[];
};

class FakeStatement {
  bindings: unknown[] = [];

  constructor(
    private readonly database: FakeDatabase,
    readonly sql: string,
  ) {}

  bind(...bindings: unknown[]) {
    this.bindings = bindings;
    return this;
  }

  async all<T>() {
    this.database.statements.push({ sql: this.sql, bindings: this.bindings });
    if (this.sql.startsWith("SELECT id FROM appointment")) {
      return { results: this.database.expiringAppointments as T[] };
    }
    if (this.sql.startsWith("SELECT id, event_id, etag FROM calendar_managed_item")) {
      return {
        results: this.database.managedEvents.filter(
          (event) => event.appointment_id === this.bindings[0],
        ) as T[],
      };
    }
    return { results: [] as T[] };
  }

  async run() {
    this.database.statements.push({ sql: this.sql, bindings: this.bindings });
    if (this.sql === "DELETE FROM appointment WHERE id = ?") {
      this.database.expiringAppointments = this.database.expiringAppointments.filter(
        (appointment) => appointment.id !== this.bindings[0],
      );
    }
    if (this.sql === "DELETE FROM calendar_managed_item WHERE id = ?") {
      this.database.managedEvents = this.database.managedEvents.filter(
        (event) => event.id !== this.bindings[0],
      );
    }
    return { meta: { changes: 1 } };
  }
}

class FakeDatabase {
  statements: RecordedStatement[] = [];
  expiringAppointments: Array<{ id: string }> = [{ id: "expired-appointment" }];
  managedEvents: Array<{
    id: string;
    appointment_id: string;
    event_id: string;
    etag: string | null;
  }> = [];

  prepare(sql: string) {
    return new FakeStatement(this, sql);
  }

  async batch(statements: FakeStatement[]) {
    this.statements.push(...statements.map(({ sql, bindings }) => ({ sql, bindings })));
    return statements.map(() => ({ meta: { changes: 0 } }));
  }
}

const now = Date.parse("2026-08-28T12:00:00.000Z");
const appointmentDays = 180;
const cancelledAppointmentDays = 30;
const normalCutoff = now - appointmentDays * 86_400_000;
const cancelledCutoff = now - cancelledAppointmentDays * 86_400_000;

function createEnvironment(database: FakeDatabase) {
  return {
    DB: database,
    RETENTION_APPOINTMENT_DAYS: String(appointmentDays),
    RETENTION_CANCELLED_APPOINTMENT_DAYS: String(cancelledAppointmentDays),
    RETENTION_DEIDENTIFIED_RECORD_DAYS: "365",
    RETENTION_AUDIT_EVENT_DAYS: "730",
  } as unknown as Parameters<typeof runRetention>[0];
}

async function retentionStatements(context: TestContext) {
  context.mock.method(Date, "now", () => now);
  const database = new FakeDatabase();
  await runRetention(createEnvironment(database));
  return database;
}

test("retention selects expired appointment states with separate cutoffs", async (t) => {
  const database = await retentionStatements(t);
  const rule = database.statements.find(({ sql }) => sql.startsWith("SELECT id FROM appointment"));

  assert.ok(rule);
  assert.match(rule.sql, /status = 'CANCELLED' AND updated_at < \?/);
  assert.match(rule.sql, /status IN \('REQUESTED', 'CONFIRMED', 'COMPLETED'\) AND starts_at < \?/);
  assert.deepEqual(rule.bindings, [cancelledCutoff, normalCutoff]);
  assert.ok(
    database.statements.some(
      ({ sql, bindings }) =>
        sql === "DELETE FROM appointment WHERE id = ?" && bindings[0] === "expired-appointment",
    ),
  );
});

test("retention prunes old availability slots only after appointment references are gone", async (t) => {
  const database = await retentionStatements(t);
  const statements = database.statements;
  const slotRuleIndex = statements.findIndex(({ sql }) =>
    sql.startsWith("DELETE FROM availability_slot"),
  );
  const lastAppointmentRuleIndex = statements.findLastIndex(
    ({ sql }) => sql === "DELETE FROM appointment WHERE id = ?",
  );
  const slotRule = statements[slotRuleIndex];

  assert.ok(slotRule);
  assert.ok(slotRuleIndex > lastAppointmentRuleIndex);
  assert.match(slotRule.sql, /ends_at < \?/);
  assert.match(slotRule.sql, /NOT EXISTS/);
  assert.match(slotRule.sql, /appointment\.availability_slot_id = availability_slot\.id/);
  assert.deepEqual(slotRule.bindings, [normalCutoff]);
});

test("retention deletes managed Google events before their appointment records", async (t) => {
  t.mock.method(Date, "now", () => now);
  const database = new FakeDatabase();
  database.managedEvents = [
    {
      id: "managed-item",
      appointment_id: "expired-appointment",
      event_id: "google-event",
      etag: "etag-1",
    },
  ];
  const calls: string[] = [];

  await runRetention(createEnvironment(database), async (eventId, etag) => {
    calls.push(`${eventId}:${etag}`);
  });

  assert.deepEqual(calls, ["google-event:etag-1"]);
  const managedDelete = database.statements.findIndex(
    ({ sql }) => sql === "DELETE FROM calendar_managed_item WHERE id = ?",
  );
  const appointmentDelete = database.statements.findIndex(
    ({ sql }) => sql === "DELETE FROM appointment WHERE id = ?",
  );
  assert.ok(managedDelete > -1);
  assert.ok(appointmentDelete > managedDelete);
  assert.equal(database.managedEvents.length, 0);
  assert.equal(database.expiringAppointments.length, 0);
});

test("retention keeps failed Calendar cleanup for the next maintenance retry", async (t) => {
  t.mock.method(Date, "now", () => now);
  const database = new FakeDatabase();
  database.managedEvents = [
    {
      id: "managed-item",
      appointment_id: "expired-appointment",
      event_id: "google-event",
      etag: "etag-1",
    },
  ];

  await runRetention(createEnvironment(database), async () => {
    throw new Error("temporary provider outage");
  });
  assert.equal(database.managedEvents.length, 1);
  assert.equal(database.expiringAppointments.length, 1);
  assert.equal(
    database.statements.some(({ sql }) => sql === "DELETE FROM appointment WHERE id = ?"),
    false,
  );

  await runRetention(createEnvironment(database), async () => undefined);
  assert.equal(database.managedEvents.length, 0);
  assert.equal(database.expiringAppointments.length, 0);
  assert.equal(
    database.statements.filter(({ sql }) => sql === "DELETE FROM appointment WHERE id = ?").length,
    1,
  );
});
