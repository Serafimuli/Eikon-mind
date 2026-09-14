import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createPortableDataExport } from "../src/lib/privacy-export";

const timestamp = new Date("2026-09-14T10:00:00.000Z");

test("portable export serializes only account, provider, and owned appointment fields", () => {
  const body = createPortableDataExport({
    exportedAt: timestamp,
    account: {
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.test",
      emailVerified: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    authenticationProviders: [{ provider: "credential", linkedAt: timestamp }],
    appointments: [
      {
        startsAt: timestamp,
        endsAt: timestamp,
        status: "CONFIRMED",
        cancelledAt: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
  });

  assert.deepEqual(body, {
    format: "eikon-mind-personal-data-export/v1",
    exportedAt: "2026-09-14T10:00:00.000Z",
    account: {
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.test",
      emailVerified: true,
      createdAt: "2026-09-14T10:00:00.000Z",
      updatedAt: "2026-09-14T10:00:00.000Z",
    },
    authenticationProviders: [{ provider: "credential", linkedAt: "2026-09-14T10:00:00.000Z" }],
    appointments: [
      {
        startsAt: "2026-09-14T10:00:00.000Z",
        endsAt: "2026-09-14T10:00:00.000Z",
        status: "CONFIRMED",
        cancelledAt: null,
        createdAt: "2026-09-14T10:00:00.000Z",
        updatedAt: "2026-09-14T10:00:00.000Z",
      },
    ],
  });
  assert.doesNotMatch(
    JSON.stringify(body),
    /password|secret|token|backup|security|therapist|clientId/i,
  );
});

test("export route is authenticated, private, downloadable, and scoped by the session user", async () => {
  const source = await readFile(
    new URL("../src/app/api/privacy/export/route.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /auth\.api\.getSession\(\{ headers: request\.headers \}\)/);
  assert.match(source, /if \(!session\) return unauthorized\(\)/);
  assert.match(source, /eq\(users\.id, session\.user\.id\)/);
  assert.match(source, /eq\(accounts\.userId, session\.user\.id\)/);
  assert.match(source, /eq\(appointments\.clientId, session\.user\.id\)/);
  assert.match(source, /Cache-Control.*private, no-store, max-age=0/);
  assert.match(source, /Content-Disposition.*attachment; filename=/);
  assert.match(source, /status: 401/);

  for (const disallowedField of [
    "accessToken",
    "refreshToken",
    "idToken",
    "accounts.password",
    "sessions",
    "twoFactor",
    "securityEvents",
    "therapistId",
  ]) {
    assert.ok(!source.includes(disallowedField), `route must not select ${disallowedField}`);
  }
});
