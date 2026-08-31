import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { processPendingIntegrationJobs } from "../src/lib/integrations/calendar";

type CalendarJob = {
  job_id: string;
  kind: "CALENDAR_UPSERT" | "CALENDAR_CANCEL";
  attempts: number;
  appointment_id: string;
  starts_at: number;
  ends_at: number;
  event_id: string | null;
};

type RecordedStatement = {
  sql: string;
  bindings: unknown[];
};

class FakeStatement {
  bindings: unknown[] = [];

  constructor(
    readonly database: FakeDatabase,
    readonly sql: string,
  ) {}

  bind(...bindings: unknown[]) {
    this.bindings = bindings;
    return this;
  }

  async all<T>() {
    if (this.sql.includes("SELECT j.id AS job_id")) {
      return { results: (this.database.active ? [this.database.job] : []) as T[] };
    }
    if (this.sql.includes("SELECT id FROM integration_job WHERE state = 'FAILED'")) {
      return { results: [] as T[] };
    }
    throw new Error(`Unexpected all() query: ${this.sql}`);
  }

  async run() {
    this.database.executed.push({ sql: this.sql, bindings: this.bindings });
    if (this.sql.includes("SET attempts = ?, state = 'PENDING'")) {
      this.database.job.attempts = this.bindings[0] as number;
      this.database.retryAttempts.push(this.database.job.attempts);
    }
    return { meta: { changes: 1 } };
  }
}

class FakeDatabase {
  active = true;
  completed = false;
  executed: RecordedStatement[] = [];
  retryAttempts: number[] = [];
  batched: RecordedStatement[] = [];

  constructor(readonly job: CalendarJob) {}

  prepare(sql: string) {
    return new FakeStatement(this, sql);
  }

  async batch(statements: FakeStatement[]) {
    for (const statement of statements) {
      this.batched.push({ sql: statement.sql, bindings: statement.bindings });
      if (statement.sql.includes("SET state = 'COMPLETED'")) {
        this.active = false;
        this.completed = true;
      }
    }
    return statements.map(() => ({ meta: { changes: 1 } }));
  }
}

type FetchCall = {
  url: string;
  init: RequestInit | undefined;
};

const oauthUrl = "https://oauth2.googleapis.com/token";
const eventsUrl = "https://www.googleapis.com/calendar/v3/calendars/calendar%40example.com/events";

function createJob(overrides: Partial<CalendarJob> = {}): CalendarJob {
  return {
    job_id: "job-1",
    kind: "CALENDAR_UPSERT",
    attempts: 0,
    appointment_id: "appointment-1",
    starts_at: Date.parse("2026-09-01T08:00:00.000Z"),
    ends_at: Date.parse("2026-09-01T09:00:00.000Z"),
    event_id: null,
    ...overrides,
  };
}

function createEnvironment(database: FakeDatabase) {
  return {
    DB: database,
    GOOGLE_CLIENT_ID: "client-id",
    GOOGLE_CLIENT_SECRET: "client-secret",
    GOOGLE_REFRESH_TOKEN: "refresh-token",
    GOOGLE_CALENDAR_ID: "calendar@example.com",
    OPERATIONS_EMAIL: { send: async () => undefined },
    EMAIL_FROM_ADDRESS: "noreply@example.com",
    OPERATIONS_MAILBOX: "operations@example.com",
  } as unknown as Parameters<typeof processPendingIntegrationJobs>[0];
}

function mockFetch(
  context: TestContext,
  handler: (call: FetchCall, calls: FetchCall[]) => Response | Promise<Response>,
) {
  const calls: FetchCall[] = [];
  context.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const call = { url: String(input), init };
    calls.push(call);
    return handler(call, calls);
  });
  return calls;
}

function oauthSuccess() {
  return Response.json({ access_token: "access-token" });
}

test("creates an initial Google Calendar event with POST and a deterministic ID", async (t) => {
  const database = new FakeDatabase(createJob());
  const calls = mockFetch(t, ({ url }) => {
    if (url === oauthUrl) return oauthSuccess();
    return new Response(null, { status: 200 });
  });

  await processPendingIntegrationJobs(createEnvironment(database), 1);

  assert.equal(database.completed, true);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].url, eventsUrl);
  assert.equal(calls[1].init?.method, "POST");
  const payload = JSON.parse(String(calls[1].init?.body)) as {
    id: string;
    start: { dateTime: string; timeZone: string };
    end: { dateTime: string; timeZone: string };
  };
  assert.match(payload.id, /^[0-9a-v]{26}$/);
  assert.deepEqual(payload.start, { dateTime: "2026-09-01T08:00:00.000Z", timeZone: "UTC" });
  assert.deepEqual(payload.end, { dateTime: "2026-09-01T09:00:00.000Z", timeZone: "UTC" });
  assert.equal(database.batched[0].bindings[2], payload.id);
});

test("resolves Secrets Store bindings before calling Google", async (t) => {
  const database = new FakeDatabase(createJob());
  const calls = mockFetch(t, ({ url }) => {
    if (url === oauthUrl) return oauthSuccess();
    return new Response(null, { status: 200 });
  });
  const env = createEnvironment(database);
  Object.assign(env, {
    GOOGLE_CLIENT_ID: { get: async () => "remote-client-id" },
    GOOGLE_CLIENT_SECRET: { get: async () => "remote-client-secret" },
    GOOGLE_REFRESH_TOKEN: { get: async () => "remote-refresh-token" },
    GOOGLE_CALENDAR_ID: { get: async () => "calendar@example.com" },
  });

  await processPendingIntegrationJobs(env, 1);

  const oauthBody = new URLSearchParams(String(calls[0].init?.body));
  assert.equal(oauthBody.get("client_id"), "remote-client-id");
  assert.equal(oauthBody.get("client_secret"), "remote-client-secret");
  assert.equal(oauthBody.get("refresh_token"), "remote-refresh-token");
  assert.equal(calls[1].url, eventsUrl);
});

test("retries a transient insert failure with the same deterministic event ID", async (t) => {
  const database = new FakeDatabase(createJob());
  let insertAttempts = 0;
  const calls = mockFetch(t, ({ url }) => {
    if (url === oauthUrl) return oauthSuccess();
    insertAttempts += 1;
    return new Response(null, { status: insertAttempts === 1 ? 503 : 200 });
  });

  await processPendingIntegrationJobs(createEnvironment(database), 1);
  assert.deepEqual(database.retryAttempts, [1]);
  assert.equal(database.completed, false);

  await processPendingIntegrationJobs(createEnvironment(database), 1);

  const insertCalls = calls.filter(({ url }) => url === eventsUrl);
  assert.equal(database.completed, true);
  assert.equal(insertCalls.length, 2);
  assert.equal(insertCalls[0].init?.method, "POST");
  assert.equal(insertCalls[1].init?.method, "POST");
  assert.equal(
    JSON.parse(String(insertCalls[0].init?.body)).id,
    JSON.parse(String(insertCalls[1].init?.body)).id,
  );
});

test("updates the deterministic event when insert reports a duplicate", async (t) => {
  const database = new FakeDatabase(createJob());
  const calls = mockFetch(t, ({ url }) => {
    if (url === oauthUrl) return oauthSuccess();
    if (url === eventsUrl) return new Response(null, { status: 409 });
    return new Response(null, { status: 200 });
  });

  await processPendingIntegrationJobs(createEnvironment(database), 1);

  const insertCall = calls[1];
  const updateCall = calls[2];
  const insertedId = JSON.parse(String(insertCall.init?.body)).id as string;
  assert.equal(database.completed, true);
  assert.equal(insertCall.init?.method, "POST");
  assert.equal(updateCall.url, `${eventsUrl}/${insertedId}`);
  assert.equal(updateCall.init?.method, "PUT");
  assert.deepEqual(
    JSON.parse(String(updateCall.init?.body)),
    JSON.parse(String(insertCall.init?.body)),
  );
});

test("updates an already tracked event without attempting another insert", async (t) => {
  const database = new FakeDatabase(createJob({ event_id: "tracked-event-id" }));
  const calls = mockFetch(t, ({ url }) => {
    if (url === oauthUrl) return oauthSuccess();
    return new Response(null, { status: 200 });
  });

  await processPendingIntegrationJobs(createEnvironment(database), 1);

  assert.equal(database.completed, true);
  assert.equal(calls[1].url, `${eventsUrl}/tracked-event-id`);
  assert.equal(calls[1].init?.method, "PUT");
});

test("cancels with DELETE and treats an already deleted event as success", async (t) => {
  const database = new FakeDatabase(
    createJob({ kind: "CALENDAR_CANCEL", event_id: "cancelled-event-id" }),
  );
  const calls = mockFetch(t, ({ url }) => {
    if (url === oauthUrl) return oauthSuccess();
    return new Response(null, { status: 410 });
  });

  await processPendingIntegrationJobs(createEnvironment(database), 1);

  assert.equal(database.completed, true);
  assert.equal(calls[1].url, `${eventsUrl}/cancelled-event-id`);
  assert.equal(calls[1].init?.method, "DELETE");
  assert.equal(calls[1].init?.body, undefined);
  assert.equal(database.batched[0].bindings[3], "CANCELLED");
});

test("schedules a retry when Google OAuth refresh fails", async (t) => {
  const database = new FakeDatabase(createJob());
  const calls = mockFetch(t, () => new Response(null, { status: 401 }));

  await processPendingIntegrationJobs(createEnvironment(database), 1);

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, oauthUrl);
  assert.deepEqual(database.retryAttempts, [1]);
  assert.equal(database.completed, false);
});

test("schedules a retry when Google Calendar rejects an insert for quota", async (t) => {
  const database = new FakeDatabase(createJob());
  const calls = mockFetch(t, ({ url }) => {
    if (url === oauthUrl) return oauthSuccess();
    return new Response(null, { status: 429 });
  });

  await processPendingIntegrationJobs(createEnvironment(database), 1);

  assert.equal(calls[1].url, eventsUrl);
  assert.equal(calls[1].init?.method, "POST");
  assert.deepEqual(database.retryAttempts, [1]);
  assert.equal(database.completed, false);
});
