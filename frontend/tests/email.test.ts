import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import {
  FREE_EMAIL_DAILY_LIMIT,
  FREE_EMAIL_MONTHLY_LIMIT,
  sendTransactionalEmail,
} from "../src/lib/integrations/email-delivery";
import {
  appointmentEmail,
  passwordChangedEmail,
  securityEmail,
} from "../src/lib/integrations/email-content";
import { parseEmailLocale } from "../src/lib/integrations/email-locale";
import { createBrandedEmail } from "../src/lib/integrations/email-message";

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

test("verification email is localized, welcoming, centered, and privacy-aware", () => {
  const verification = securityEmail(
    "verify",
    "https://eikon-mind.example/en/verify?token=one-time",
    "en",
    "Ada Lovelace",
  );
  const romanianVerification = securityEmail(
    "verify",
    "https://eikon-mind.example/ro/verify?token=one-time",
    "ro",
    "Ada Lovelace",
  );
  const rendered = createBrandedEmail(
    "noreply@example.com",
    "ada@example.com",
    verification,
    "https://eikon-mind.example/assets/logo.png",
    "https://eikon-mind.example",
  );

  assert.equal(verification.locale, "en");
  assert.equal(verification.align, "center");
  assert.match(verification.body, /Welcome, Ada\./);
  assert.match(verification.body, /Do not forward it or share it/);
  assert.match(verification.body, /expires after one hour/);
  assert.match(rendered.html, /<html lang="en">/);
  assert.match(rendered.html, /text-align:center/);
  assert.match(rendered.text, /Privacy and data-processing notice/);
  assert.match(rendered.text, /Terms and conditions/);
  assert.match(rendered.text, /\/en\/politica-de-confidentialitate/);
  assert.match(rendered.text, /\/en\/termeni-si-conditii/);
  assert.equal(romanianVerification.action?.label, "Verifică adresa de email");
  assert.match(romanianVerification.body, /Nu îl redirecționa și nu îl distribui nimănui/);
  assert.match(romanianVerification.body, /expiră după o oră/);
});

test("all appointment email variants remain generic and localized", () => {
  for (const kind of ["confirmed", "cancelled", "requested", "updated"] as const) {
    const message = appointmentEmail(kind, "ro", "https://eikon-mind.example");
    assert.equal(message.locale, "ro");
    assert.match(message.action?.url ?? "", /\/ro\/client\/appointments$/);
    assert.doesNotMatch(message.body, /health|clinical|therapy|startsAt|endsAt|client|service/i);
  }

  assert.equal(parseEmailLocale("ro"), "ro");
  assert.equal(parseEmailLocale("en"), "en");
  assert.equal(parseEmailLocale("fr"), "en");
  assert.equal(parseEmailLocale(undefined), "en");
});

test("Resend receives the selected locale in the subject and rendered content", async (t) => {
  const { env } = emailEnvironment();
  const calls = mockFetch(t, Response.json({ id: "email-id" }));

  await sendTransactionalEmail(
    env,
    "client@example.com",
    appointmentEmail("confirmed", "ro", "https://eikon-mind.example"),
  );

  const payload = JSON.parse(String(calls[0].init?.body));
  assert.equal(payload.subject, "Programarea ta Eikon Mind este confirmată");
  assert.match(payload.text, /Autentifică-te în Eikon Mind/);
  assert.match(payload.text, /\/ro\/politica-de-confidentialitate/);
  assert.match(payload.html, /<html lang="ro">/);
  assert.match(payload.html, /\/ro\/termeni-si-conditii/);
});
