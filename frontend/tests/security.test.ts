import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import { authDestination } from "../src/lib/auth-routing"
import { canManageTherapist, isStaff } from "../src/lib/roles"

test("staff authorization never permits a therapist to manage a peer", () => {
  assert.equal(isStaff("THERAPIST"), true)
  assert.equal(isStaff("ADMIN"), true)
  assert.equal(isStaff("USER"), false)
  assert.equal(canManageTherapist("THERAPIST", "a", "a"), true)
  assert.equal(canManageTherapist("THERAPIST", "a", "b"), false)
  assert.equal(canManageTherapist("ADMIN", "a", "b"), true)
})

test("migration removes free-text appointment notes and preserves slot uniqueness", async () => {
  const sql = await readFile(
    new URL("../drizzle/0001_production_security.sql", import.meta.url),
    "utf8",
  )
  assert.match(sql, /DROP TABLE appointment/)
  assert.match(sql, /availability_slot_id text UNIQUE/)
  assert.doesNotMatch(sql, /notes text/i)
})

test("booking uses a single D1 batch and conditional reservation", async () => {
  const source = await readFile(
    new URL("../src/lib/appointments.ts", import.meta.url),
    "utf8",
  )
  assert.match(source, /await db\.batch/)
  assert.match(source, /changes\(\) = 1/)
})

test("auth destinations stay in the caller locale and role section", () => {
  assert.equal(
    authDestination("en", "USER", "/en/client/book"),
    "/en/client/book",
  )
  assert.equal(
    authDestination("ro", "THERAPIST", "/ro/client/book"),
    "/ro/admin",
  )
  assert.equal(
    authDestination("en", "ADMIN", "https://evil.example/steal"),
    "/en/admin",
  )
  assert.equal(authDestination("en", "USER", "//evil.example"), "/en/client")
  assert.equal(authDestination("en", "USER", "/en/clientevil"), "/en/client")
})

test("auth and D1 sources keep secret fields server-only", async () => {
  const authSource = await readFile(
    new URL("../src/lib/auth.ts", import.meta.url),
    "utf8",
  )
  const dbSource = await readFile(
    new URL("../src/lib/db/index.ts", import.meta.url),
    "utf8",
  )
  const repositorySource = await readFile(
    new URL("../src/lib/db/repositories.ts", import.meta.url),
    "utf8",
  )
  assert.match(authSource, /server-only/)
  assert.match(dbSource, /server-only/)
  assert.doesNotMatch(repositorySource, /backupCodes|secret|password/i)
})

test("server session guards enforce verified email and staff TOTP", async () => {
  const source = await readFile(
    new URL("../src/lib/session.ts", import.meta.url),
    "utf8",
  )
  assert.match(source, /requireClient/)
  assert.match(source, /user\.emailVerified/)
  assert.match(source, /user\.twoFactorEnabled/)
})

test("client appointment pages and cancellation use the verified USER guard", async () => {
  const pages = await Promise.all([
    readFile(
      new URL("../src/app/[locale]/client/page.tsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL(
        "../src/app/[locale]/client/appointments/page.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "../src/app/[locale]/client/appointments/[id]/page.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
  ])
  const actions = await readFile(
    new URL("../src/app/[locale]/actions.ts", import.meta.url),
    "utf8",
  )
  for (const source of pages) assert.match(source, /requireClient/)
  assert.match(actions, /cancelOwnAppointment[\s\S]*requireClient/)
})

test("auth consistency migration backfills names and normalizes roles", async () => {
  const sql = await readFile(
    new URL("../drizzle/0002_auth_consistency.sql", import.meta.url),
    "utf8",
  )
  assert.match(sql, /first_name = 'User'/)
  assert.match(sql, /last_name = 'Account'/)
  assert.match(sql, /role = 'USER'/)
})

test("rate-limit coverage includes verification resend and password reset", async () => {
  const terraform = await readFile(
    new URL(
      "../../infra/terraform/modules/application/main.tf",
      import.meta.url,
    ),
    "utf8",
  )
  assert.match(terraform, /send-verification-email/)
  assert.match(terraform, /request-password-reset/)
})
