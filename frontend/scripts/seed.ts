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
const end = new Date(start.getTime() + 50 * 60_000);
const passwordHash = await hashPassword(E2E_FIXTURES.password);
const encryptedSecret = await symmetricEncrypt({ key: secretConfig, data: "JBSWY3DPEHPK3PXP" });
const encryptedBackupCodes = await symmetricEncrypt({
  key: secretConfig,
  data: JSON.stringify([E2E_FIXTURES.therapistBackupCode, E2E_FIXTURES.adminBackupCode]),
});

const users = [
  [E2E_FIXTURES.clientId, "E2E Client", E2E_FIXTURES.clientEmail, "E2E", "Client", "USER", 0],
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
const statements = [
  "PRAGMA foreign_keys = ON",
  `DELETE FROM appointment WHERE client_id IN (${fixtureIds}) OR therapist_id IN (${fixtureIds}) OR availability_slot_id = ${quote(E2E_FIXTURES.slotId)}`,
  `DELETE FROM integration_job WHERE appointment_id = ${quote(E2E_FIXTURES.appointmentId)}`,
  `DELETE FROM calendar_event_reference WHERE appointment_id = ${quote(E2E_FIXTURES.appointmentId)}`,
  `DELETE FROM appointment WHERE id = ${quote(E2E_FIXTURES.appointmentId)}`,
  `DELETE FROM availability_slot WHERE id = ${quote(E2E_FIXTURES.slotId)}`,
  `DELETE FROM session WHERE user_id IN (${fixtureIds})`,
  `DELETE FROM "twoFactor" WHERE userId IN (${fixtureIds})`,
  `DELETE FROM account WHERE user_id IN (${fixtureIds})`,
  `DELETE FROM user WHERE id IN (${fixtureIds}) OR email IN (${users.map(([, , email]) => quote(email)).join(", ")})`,
  ...users.map(
    ([id, name, email, firstName, lastName, role, twoFactorEnabled]) =>
      `INSERT INTO user (id, name, email, email_verified, image, first_name, last_name, role, two_factor_enabled, created_at, updated_at) VALUES (${quote(id)}, ${quote(name)}, ${quote(email)}, 1, NULL, ${quote(firstName)}, ${quote(lastName)}, ${quote(role)}, ${twoFactorEnabled}, ${now}, ${now})`,
  ),
  ...users.map(
    ([id]) =>
      `INSERT INTO account (id, issuer, account_id, provider_id, user_id, password, created_at, updated_at) VALUES (${quote(`account-${id}`)}, 'local:credential', ${quote(id)}, 'credential', ${quote(id)}, ${quote(passwordHash)}, ${now}, ${now})`,
  ),
  ...[E2E_FIXTURES.therapistId, E2E_FIXTURES.adminId].map(
    (id) =>
      `INSERT INTO "twoFactor" (id, userId, secret, backupCodes, verified, failedVerificationCount, lockedUntil) VALUES (${quote(`2fa-${id}`)}, ${quote(id)}, ${quote(encryptedSecret)}, ${quote(encryptedBackupCodes)}, 1, 0, NULL)`,
  ),
  `INSERT INTO availability_slot (id, therapist_id, starts_at, ends_at, state, created_at, updated_at) VALUES (${quote(E2E_FIXTURES.slotId)}, ${quote(E2E_FIXTURES.therapistId)}, ${start.getTime()}, ${end.getTime()}, 'OPEN', ${now}, ${now})`,
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

console.info("Prepared isolated local E2E users and one bookable slot.");
