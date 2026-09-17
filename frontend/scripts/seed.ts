import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { symmetricEncrypt, type SecretConfig } from "better-auth/crypto";
import { hashPassword } from "../src/lib/security/password";
import { E2E_FIXTURES } from "../tests/e2e/fixtures";

if (!process.argv.includes("--e2e")) {
  throw new Error(
    "Seeding is restricted to the isolated local E2E fixture. Run `pnpm db:seed -- --e2e` explicitly.",
  );
}

function parseDevVars(source: string) {
  return Object.fromEntries(
    source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const separator = line.indexOf("=");
        const key = line.slice(0, separator);
        const value = line.slice(separator + 1).replace(/^(["'])(.*)\1$/, "$2");
        return [key, value];
      }),
  );
}

function quote(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

const variables = parseDevVars(await readFile(new URL("../.dev.vars", import.meta.url), "utf8"));
if (
  variables.APP_ENV !== "local" ||
  variables.TURNSTILE_SITEKEY !== "1x00000000000000000000AA" ||
  variables.TURNSTILE_SECRET !== "1x0000000000000000000000000000000AA"
) {
  throw new Error("Refusing to seed without the documented local-only Turnstile test bindings.");
}

const secretMatch = /^(\d+):(.{32,})$/.exec(variables.BETTER_AUTH_SECRETS ?? "");
if (!secretMatch)
  throw new Error("The local Better Auth signing key must use the native version:key format.");
const version = Number(secretMatch[1]);
const secretConfig: SecretConfig = {
  currentVersion: version,
  keys: new Map([[version, secretMatch[2]]]),
};

const now = Date.now();
const start = new Date(now + 86_400_000);
start.setUTCHours(8, 0, 0, 0);
const slotIds = [
  E2E_FIXTURES.slotId,
  E2E_FIXTURES.rescheduleSlotId,
  E2E_FIXTURES.spareSlotId,
  E2E_FIXTURES.auditSlotId,
  E2E_FIXTURES.auditRescheduleSlotId,
];
const slotWindows = slotIds.map((id, index) => {
  const startsAt = new Date(start.getTime() + index * 2 * 60 * 60_000);
  return { id, startsAt, endsAt: new Date(startsAt.getTime() + 50 * 60_000) };
});
const passwordHash = await hashPassword(E2E_FIXTURES.password);
const encryptedSecret = await symmetricEncrypt({ key: secretConfig, data: "JBSWY3DPEHPK3PXP" });
const encryptedBackupCodes = await symmetricEncrypt({
  key: secretConfig,
  data: JSON.stringify([E2E_FIXTURES.therapistBackupCode, E2E_FIXTURES.adminBackupCode]),
});

const users = [
  [E2E_FIXTURES.clientId, "E2E Client", E2E_FIXTURES.clientEmail, "E2E", "Client", "USER", 0],
  [
    E2E_FIXTURES.auditClientId,
    "E2E Audit Client",
    E2E_FIXTURES.auditClientEmail,
    "E2E",
    "Audit Client",
    "USER",
    0,
  ],
  [
    E2E_FIXTURES.roleChangeTargetId,
    "E2E Role Change Target",
    E2E_FIXTURES.roleChangeTargetEmail,
    "E2E",
    "Role Target",
    "USER",
    1,
  ],
  [
    E2E_FIXTURES.therapistId,
    "E2E Therapist",
    E2E_FIXTURES.therapistEmail,
    "E2E",
    "Therapist",
    "THERAPIST",
    1,
  ],
  [E2E_FIXTURES.adminId, "E2E Admin", E2E_FIXTURES.adminEmail, "E2E", "Admin", "ADMIN", 1],
] as const;

const fixtureIds = users.map(([id]) => quote(id)).join(", ");
const fixtureSlotIds = slotIds.map(quote).join(", ");
const fixtureAppointmentIds = [
  E2E_FIXTURES.appointmentId,
  E2E_FIXTURES.auditAppointmentId,
  E2E_FIXTURES.auditCancelledAppointmentId,
  E2E_FIXTURES.auditCompletedAppointmentId,
  E2E_FIXTURES.auditPastAppointmentId,
];
const auditActiveWindow = slotWindows[3];
const auditAppointments = [
  {
    id: E2E_FIXTURES.auditAppointmentId,
    slotId: E2E_FIXTURES.auditSlotId,
    startsAt: auditActiveWindow.startsAt,
    endsAt: auditActiveWindow.endsAt,
    status: "REQUESTED",
    cancelledAt: "NULL",
  },
  {
    id: E2E_FIXTURES.auditCancelledAppointmentId,
    slotId: null,
    startsAt: new Date(auditActiveWindow.startsAt.getTime() + 4 * 60 * 60_000),
    endsAt: new Date(auditActiveWindow.endsAt.getTime() + 4 * 60 * 60_000),
    status: "CANCELLED",
    cancelledAt: String(now),
  },
  {
    id: E2E_FIXTURES.auditCompletedAppointmentId,
    slotId: null,
    startsAt: new Date(now - 2 * 86_400_000),
    endsAt: new Date(now - 2 * 86_400_000 + 50 * 60_000),
    status: "COMPLETED",
    cancelledAt: "NULL",
  },
  {
    id: E2E_FIXTURES.auditPastAppointmentId,
    slotId: null,
    startsAt: new Date(now - 86_400_000),
    endsAt: new Date(now - 86_400_000 + 50 * 60_000),
    status: "CONFIRMED",
    cancelledAt: "NULL",
  },
];
const statements = [
  "PRAGMA foreign_keys = ON",
  "DELETE FROM rateLimit",
  `DELETE FROM appointment WHERE client_id IN (${fixtureIds}) OR therapist_id IN (${fixtureIds}) OR availability_slot_id IN (${fixtureSlotIds})`,
  `DELETE FROM integration_job WHERE appointment_id IN (${fixtureAppointmentIds.map(quote).join(", ")})`,
  `DELETE FROM calendar_event_reference WHERE appointment_id IN (${fixtureAppointmentIds.map(quote).join(", ")})`,
  `DELETE FROM appointment WHERE id IN (${fixtureAppointmentIds.map(quote).join(", ")})`,
  `DELETE FROM availability_slot WHERE id IN (${fixtureSlotIds})`,
  `DELETE FROM session WHERE user_id IN (${fixtureIds})`,
  `DELETE FROM "twoFactor" WHERE userId IN (${fixtureIds})`,
  `DELETE FROM account WHERE user_id IN (${fixtureIds})`,
  `DELETE FROM user WHERE id IN (${fixtureIds}) OR email IN (${users.map(([, , email]) => quote(email)).join(", ")})`,
  ...users.map(
    ([id, name, email, firstName, lastName, role, twoFactorEnabled]) =>
      `INSERT INTO user (id, name, email, email_verified, first_name, last_name, role, two_factor_enabled, created_at, updated_at) VALUES (${quote(id)}, ${quote(name)}, ${quote(email)}, 1, ${quote(firstName)}, ${quote(lastName)}, ${quote(role)}, ${twoFactorEnabled}, ${now}, ${now})`,
  ),
  ...users.map(
    ([id]) =>
      `INSERT INTO account (id, issuer, account_id, provider_id, user_id, password, created_at, updated_at) VALUES (${quote(`account-${id}`)}, 'local:credential', ${quote(id)}, 'credential', ${quote(id)}, ${quote(passwordHash)}, ${now}, ${now})`,
  ),
  ...[E2E_FIXTURES.therapistId, E2E_FIXTURES.adminId, E2E_FIXTURES.roleChangeTargetId].map(
    (id) =>
      `INSERT INTO "twoFactor" (id, userId, secret, backupCodes, verified, failedVerificationCount, lockedUntil) VALUES (${quote(`2fa-${id}`)}, ${quote(id)}, ${quote(encryptedSecret)}, ${quote(encryptedBackupCodes)}, 1, 0, NULL)`,
  ),
  ...slotWindows.map(
    ({ id, startsAt, endsAt }) =>
      `INSERT INTO availability_slot (id, therapist_id, starts_at, ends_at, state, created_at, updated_at) VALUES (${quote(id)}, ${quote(E2E_FIXTURES.therapistId)}, ${startsAt.getTime()}, ${endsAt.getTime()}, ${id === E2E_FIXTURES.auditSlotId ? "'RESERVED'" : "'OPEN'"}, ${now}, ${now})`,
  ),
  ...auditAppointments.map(
    ({ id, slotId, startsAt, endsAt, status, cancelledAt }) =>
      `INSERT INTO appointment (id, client_id, therapist_id, availability_slot_id, service_code, starts_at, ends_at, status, cancelled_at, client_hidden_at, created_at, updated_at) VALUES (${quote(id)}, ${quote(E2E_FIXTURES.clientId)}, ${quote(E2E_FIXTURES.therapistId)}, ${slotId ? quote(slotId) : "NULL"}, 'STANDARD', ${startsAt.getTime()}, ${endsAt.getTime()}, ${quote(status)}, ${cancelledAt}, NULL, ${now}, ${now})`,
  ),
].join(";\n");

execFileSync(
  process.execPath,
  [
    fileURLToPath(new URL("../node_modules/wrangler/bin/wrangler.js", import.meta.url)),
    "d1",
    "execute",
    "eikon-mind",
    "--local",
    "--command",
    statements,
  ],
  { stdio: "inherit" },
);

console.info(
  "Prepared isolated local E2E users, protected-page audit records, and bookable slots.",
);
