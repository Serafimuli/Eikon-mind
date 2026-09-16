import assert from "node:assert/strict";
import test from "node:test";
import { getErrorContent } from "../src/lib/error-content";

test("localized error recovery content exposes safe home and contact destinations", () => {
  const english = getErrorContent("en");
  const romanian = getErrorContent("ro");

  assert.equal(english.copy.title, "Something went wrong");
  assert.equal(english.copy.retry, "Try again");
  assert.equal(english.homeHref, "/en");
  assert.equal(english.contactHref, "/en/contact");

  assert.equal(romanian.copy.title, "A apărut o eroare");
  assert.equal(romanian.copy.retry, "Încearcă din nou");
  assert.equal(romanian.homeHref, "/ro");
  assert.equal(romanian.contactHref, "/ro/contact");
});
