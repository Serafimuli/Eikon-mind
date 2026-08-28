import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { APPOINTMENT_STATUSES, type AppointmentStatus } from "../src/lib/appointment-types";
import { runRetention } from "../workers/maintenance";

type RecordedStatement = {
  sql: string;
  bindings: unknown[];
};

class FakeStatement {
  bindings: unknown[] = [];

  constructor(readonly sql: string) {}

  bind(...bindings: unknown[]) {
    this.bindings = bindings;
    return this;
  }
}

class FakeDatabase {
  statements: RecordedStatement[] = [];

  prepare(sql: string) {
    return new FakeStatement(sql);
  }

  async batch(statements: FakeStatement[]) {
    this.statements = statements.map(({ sql, bindings }) => ({ sql, bindings }));
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
  return database.statements;
}

function appointmentRule(statements: RecordedStatement[], status: AppointmentStatus) {
  return statements.find(
    ({ sql }) => sql.startsWith("DELETE FROM appointment") && sql.includes(`'${status}'`),
  );
}

for (const status of APPOINTMENT_STATUSES) {
  test(`retention has an explicit deletion rule for ${status} appointments`, async (t) => {
    const statements = await retentionStatements(t);
    const rule = appointmentRule(statements, status);

    assert.ok(rule, `missing retention rule for ${status}`);
    assert.match(rule.sql, /< \?/);
    assert.doesNotMatch(rule.sql, /<= \?/);
    assert.deepEqual(rule.bindings, [status === "CANCELLED" ? cancelledCutoff : normalCutoff]);
  });
}

test("retention prunes old availability slots only after appointment references are gone", async (t) => {
  const statements = await retentionStatements(t);
  const slotRuleIndex = statements.findIndex(({ sql }) =>
    sql.startsWith("DELETE FROM availability_slot"),
  );
  const lastAppointmentRuleIndex = statements.findLastIndex(({ sql }) =>
    sql.startsWith("DELETE FROM appointment"),
  );
  const slotRule = statements[slotRuleIndex];

  assert.ok(slotRule);
  assert.ok(slotRuleIndex > lastAppointmentRuleIndex);
  assert.match(slotRule.sql, /ends_at < \?/);
  assert.match(slotRule.sql, /NOT EXISTS/);
  assert.match(slotRule.sql, /appointment\.availability_slot_id = availability_slot\.id/);
  assert.deepEqual(slotRule.bindings, [normalCutoff]);
});
