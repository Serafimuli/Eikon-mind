import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
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
  const sql = await readFile(new URL("../drizzle/0001_production_security.sql", import.meta.url), "utf8")
  assert.match(sql, /DROP TABLE appointment/)
  assert.match(sql, /availability_slot_id text UNIQUE/)
  assert.doesNotMatch(sql, /notes text/i)
})

test("booking uses a single D1 batch and conditional reservation", async () => {
  const source = await readFile(new URL("../src/lib/appointments.ts", import.meta.url), "utf8")
  assert.match(source, /await db\.batch/)
  assert.match(source, /changes\(\) = 1/)
})
