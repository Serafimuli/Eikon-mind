import assert from "node:assert/strict";
import test from "node:test";
import { getProtectedCopy, roleLabel } from "../src/lib/protected-content";

test("protected content localizes navigation, statuses, and staff actions", () => {
  const copy = getProtectedCopy("ro");
  assert.equal(copy.navigation.logout, "Deconectare");
  assert.equal(copy.staff.makeAdmin, "Devine administrator");
  assert.equal(copy.appointments.cancel, "Anulează");
  assert.equal(roleLabel("ro", "THERAPIST"), "Terapeut");
});
