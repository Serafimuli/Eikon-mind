import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { canStaffTransitionAppointment } from "../src/lib/appointment-types";
import { authDestination } from "../src/lib/auth-routing";
import { createTextEmail } from "../src/lib/integrations/email-message";
import { canManageTherapist, isStaff } from "../src/lib/roles";
import {
  availabilityFormSchema,
  bookingRequestSchema,
  localeSchema,
  parseBucharestLocalDateTime,
} from "../src/lib/validation";

test("staff authorization never permits a therapist to manage a peer", () => {
  assert.equal(isStaff("THERAPIST"), true);
  assert.equal(isStaff("ADMIN"), true);
  assert.equal(isStaff("USER"), false);
  assert.equal(canManageTherapist("THERAPIST", "a", "a"), true);
  assert.equal(canManageTherapist("THERAPIST", "a", "b"), false);
  assert.equal(canManageTherapist("ADMIN", "a", "b"), true);
});

test("appointment state transitions are explicit and terminal states stay terminal", () => {
  assert.equal(canStaffTransitionAppointment("REQUESTED", "CONFIRMED"), true);
  assert.equal(canStaffTransitionAppointment("REQUESTED", "COMPLETED"), false);
  assert.equal(canStaffTransitionAppointment("CONFIRMED", "COMPLETED"), true);
  assert.equal(canStaffTransitionAppointment("COMPLETED", "CANCELLED"), false);
  assert.equal(canStaffTransitionAppointment("CANCELLED", "CONFIRMED"), false);
});

test("request validation rejects unknown locales, malformed IDs, and extra booking fields", () => {
  assert.equal(localeSchema.safeParse("ro").success, true);
  assert.equal(localeSchema.safeParse("fr").success, false);
  assert.equal(
    bookingRequestSchema.safeParse({ slotId: "550e8400-e29b-41d4-a716-446655440000" }).success,
    true,
  );
  assert.equal(bookingRequestSchema.safeParse({ slotId: "not-an-id" }).success, false);
  assert.equal(
    bookingRequestSchema.safeParse({
      slotId: "550e8400-e29b-41d4-a716-446655440000",
      role: "ADMIN",
    }).success,
    false,
  );
});

test("Bucharest local times use the correct offset and reject DST gaps", () => {
  assert.equal(
    parseBucharestLocalDateTime("2026-01-15T10:30")?.toISOString(),
    "2026-01-15T08:30:00.000Z",
  );
  assert.equal(parseBucharestLocalDateTime("2026-03-29T03:30"), null);
  assert.equal(parseBucharestLocalDateTime("2026-02-30T10:00"), null);
  assert.equal(
    availabilityFormSchema.safeParse({
      startsAt: "2026-01-15T11:00",
      endsAt: "2026-01-15T10:00",
    }).success,
    false,
  );
});

test("email construction blocks header injection and validates destinations", () => {
  const message = createTextEmail(
    "noreply@example.com",
    "client@example.com",
    "Appointment\r\nBcc: attacker@example.com",
    "Generic body",
  );
  assert.doesNotMatch(message.subject, /[\r\n]/);
  assert.match(message.subject, /Appointment\s+Bcc: attacker@example\.com/);
  assert.throws(
    () =>
      createTextEmail(
        "noreply@example.com",
        "client@example.com\r\nBcc: attacker@example.com",
        "Appointment",
        "Body",
      ),
    /Invalid email destination/,
  );
});

test("migration removes free-text appointment notes and preserves slot uniqueness", async () => {
  const sql = await readFile(
    new URL("../drizzle/0001_production_security.sql", import.meta.url),
    "utf8",
  );
  assert.match(sql, /DROP TABLE appointment/);
  assert.match(sql, /availability_slot_id text UNIQUE/);
  assert.doesNotMatch(sql, /notes text/i);
});

test("booking uses a single D1 batch and conditional reservation", async () => {
  const source = await readFile(new URL("../src/lib/appointments.ts", import.meta.url), "utf8");
  assert.match(source, /await db\.batch/);
  assert.match(source, /changes\(\) = 1/);
});

test("security hardening migration installs durable limits and privacy-minimal audit events", async () => {
  const sql = await readFile(
    new URL("../drizzle/0003_security_hardening.sql", import.meta.url),
    "utf8",
  );
  assert.match(sql, /CREATE TABLE IF NOT EXISTS ["`]rateLimit["`]/);
  assert.match(sql, /CREATE TABLE security_event/);
  assert.match(sql, /ALTER TABLE account ADD COLUMN issuer/);
  assert.match(sql, /account_issuer_id_unique/);
  assert.match(sql, /UNIQUE INDEX IF NOT EXISTS integration_job_appointment_kind_unique/);
  assert.doesNotMatch(sql, /ip_address|user_agent|details text|message text/i);
});

test("auth destinations stay in the caller locale and role section", () => {
  assert.equal(authDestination("en", "USER", "/en/client/book"), "/en/client/book");
  assert.equal(authDestination("ro", "THERAPIST", "/ro/client/book"), "/ro/admin");
  assert.equal(authDestination("en", "ADMIN", "https://evil.example/steal"), "/en/admin");
  assert.equal(authDestination("en", "USER", "//evil.example"), "/en/client");
  assert.equal(authDestination("en", "USER", "/en/clientevil"), "/en/client");
});

test("auth and D1 sources keep secret fields server-only", async () => {
  const authSource = await readFile(new URL("../src/lib/auth.ts", import.meta.url), "utf8");
  const dbSource = await readFile(new URL("../src/lib/db/index.ts", import.meta.url), "utf8");
  const repositorySource = await readFile(
    new URL("../src/lib/db/repositories.ts", import.meta.url),
    "utf8",
  );
  assert.match(authSource, /server-only/);
  assert.match(dbSource, /server-only/);
  assert.doesNotMatch(repositorySource, /backupCodes|secret|password/i);
});

test("Better Auth model names are explicitly mapped to the Drizzle schema", async () => {
  const source = await readFile(new URL("../src/lib/auth.ts", import.meta.url), "utf8");
  for (const model of ["user", "session", "account", "verification", "rateLimit", "twoFactor"]) {
    assert.match(source, new RegExp(`${model}: schema\\.`));
  }
});

test("server session guards enforce verified email and staff TOTP", async () => {
  const source = await readFile(new URL("../src/lib/session.ts", import.meta.url), "utf8");
  assert.match(source, /requireClient/);
  assert.match(source, /user\.emailVerified/);
  assert.match(source, /user\.twoFactorEnabled/);
});

test("client appointment pages and cancellation use the verified USER guard", async () => {
  const pages = await Promise.all([
    readFile(new URL("../src/app/[locale]/client/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/[locale]/client/appointments/page.tsx", import.meta.url), "utf8"),
    readFile(
      new URL("../src/app/[locale]/client/appointments/[id]/page.tsx", import.meta.url),
      "utf8",
    ),
  ]);
  const actions = await readFile(
    new URL("../src/app/[locale]/actions.ts", import.meta.url),
    "utf8",
  );
  for (const source of pages) assert.match(source, /requireClient/);
  assert.match(actions, /cancelOwnAppointment[\s\S]*requireClient/);
});

test("auth consistency migration backfills names and normalizes roles", async () => {
  const sql = await readFile(
    new URL("../drizzle/0002_auth_consistency.sql", import.meta.url),
    "utf8",
  );
  assert.match(sql, /first_name = 'User'/);
  assert.match(sql, /last_name = 'Account'/);
  assert.match(sql, /role = 'USER'/);
});

test("rate-limit coverage includes verification resend and password reset", async () => {
  const terraform = await readFile(
    new URL("../../infra/terraform/modules/application/main.tf", import.meta.url),
    "utf8",
  );
  assert.match(terraform, /send-verification-email/);
  assert.match(terraform, /request-password-reset/);
});

test("the Turnstile dummy hostname exception is gated by both local test credentials", async () => {
  const source = await readFile(new URL("../src/lib/auth.ts", import.meta.url), "utf8");
  assert.match(source, /!production &&/);
  assert.match(source, /TURNSTILE_SITEKEY === "1x00000000000000000000AA"/);
  assert.match(source, /TURNSTILE_SECRET === "1x0000000000000000000000000000000AA"/);
  assert.match(source, /usesOfficialTurnstileTestKeys \? \["example\.com"\]/);
});
