import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import {
  FREE_EMAIL_DAILY_LIMIT,
  FREE_EMAIL_MONTHLY_LIMIT,
  sendTransactionalEmail,
} from "../src/lib/integrations/email-delivery";
import { passwordChangedEmail, securityEmail } from "../src/lib/integrations/email-content";

type PreparedCall = { sql: string; bindings: unknown[] };

function emailEnvironment(changes = 1) {
  const prepared: PreparedCall[] = [];
  const DB = {
    prepare(sql: string) {
      const call = { sql, bindings: [] as unknown[] };
      prepared.push(call);
      return {
        bind(...bindings: unknown[]) {
          call.bindings = bindings;
          return this;
        },
        async run() {
          return { meta: { changes } };
        },
      };
    },
  };
  const env = {
    APP_ENV: "dev",
    BETTER_AUTH_URL: "https://eikon-mind.example",
    DB,
    EMAIL_FROM_ADDRESS: "noreply@example.com",
    FREE_TIER_ONLY: "true",
    OPERATIONS_MAILBOX: "operations@example.com",
    RESEND_API_KEY: { get: async () => "re_test_key" },
  } as unknown as Parameters<typeof sendTransactionalEmail>[0];
  return { env, prepared };
}

function mockFetch(context: TestContext, response: Response) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  context.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), init });
    return response;
  });
  return calls;
}

test("transactional email uses Resend Free after reserving both free-tier quotas", async (t) => {
  const { env, prepared } = emailEnvironment();
  const calls = mockFetch(t, Response.json({ id: "email-id" }));

  await sendTransactionalEmail(env, "client@example.com", {
    subject: "Appointment",
    body: "Generic body",
  });

  assert.equal(prepared.length, 1);
  assert.match(prepared[0].sql, /INSERT INTO email_quota_usage/);
  assert.deepEqual(prepared[0].bindings.slice(-2), [
    FREE_EMAIL_DAILY_LIMIT,
    FREE_EMAIL_MONTHLY_LIMIT,
  ]);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.resend.com/emails");
  assert.equal(calls[0].init?.method, "POST");
  assert.equal(new Headers(calls[0].init?.headers).get("authorization"), "Bearer re_test_key");
  const payload = JSON.parse(String(calls[0].init?.body));
  assert.deepEqual(
    { from: payload.from, to: payload.to, subject: payload.subject },
    {
      from: "Eikon Mind <noreply@example.com>",
      to: ["client@example.com"],
      subject: "Appointment",
    },
  );
  assert.match(payload.text, /^Eikon Mind\n\nGeneric body/);
  assert.match(payload.html, /Eikon Mind/);
  assert.match(payload.html, /https:\/\/eikon-mind\.example\/assets\/source\/eikon-mind-logo\.png/);
});

test("email fails closed without calling Resend when the free allowance is exhausted", async (t) => {
  const { env } = emailEnvironment(0);
  const calls = mockFetch(t, Response.json({ id: "must-not-send" }));

  await assert.rejects(
    sendTransactionalEmail(env, "client@example.com", {
      subject: "Appointment",
      body: "Generic body",
    }),
    /Free email quota exhausted/,
  );
  assert.equal(calls.length, 0);
});

test("local development validates messages but never contacts the provider", async (t) => {
  const { env } = emailEnvironment();
  Object.assign(env, { APP_ENV: "local" });
  const calls = mockFetch(t, Response.json({ id: "must-not-send" }));

  await sendTransactionalEmail(env, "client@example.com", {
    subject: "Appointment",
    body: "Generic body",
  });

  assert.equal(calls.length, 0);
});

test("email delivery refuses a configuration that does not declare free-tier-only mode", async () => {
  const { env } = emailEnvironment();
  Object.assign(env, { FREE_TIER_ONLY: "false" });

  await assert.rejects(
    sendTransactionalEmail(env, "client@example.com", {
      subject: "Appointment",
      body: "Generic body",
    }),
    /FREE_TIER_ONLY=true/,
  );
});

test("security notices are Eikon Mind branded and password-change notices carry no secret", () => {
  const verification = securityEmail("verify", "https://eikon-mind.example/verify?token=one-time");
  const passwordChange = passwordChangedEmail();

  assert.match(verification.subject, /Eikon Mind/);
  assert.equal(verification.action?.label, "Verify email address");
  assert.match(passwordChange.subject, /Eikon Mind/);
  assert.doesNotMatch(passwordChange.body, /password=|token=|https?:\/\//i);
  assert.doesNotMatch(passwordChange.body, /correct horse|new password/i);
});
