import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import test from "node:test";
import {
  hashPassword,
  passwordStorageParameters,
  verifyPassword,
} from "../src/lib/security/password";

test("passwords are stored with versioned scrypt parameters and a unique 128-bit salt", async () => {
  const first = await hashPassword("correct horse battery staple");
  const second = await hashPassword("correct horse battery staple");

  assert.notEqual(first, second);
  assert.match(first, /^scrypt\$1\$16384\$8\$5\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
  assert.deepEqual(passwordStorageParameters, {
    algorithm: "scrypt",
    version: 1,
    N: 16_384,
    r: 8,
    p: 5,
    saltBytes: 16,
    derivedKeyBytes: 64,
  });
});

test("password verification succeeds only for the matching password", async () => {
  const hash = await hashPassword("a sufficiently long test password");

  assert.equal(await verifyPassword({ hash, password: "a sufficiently long test password" }), true);
  assert.equal(await verifyPassword({ hash, password: "the wrong password" }), false);
  assert.equal(await verifyPassword({ hash: "malformed", password: "anything" }), false);
});

test("the configured password KDF remains usable on the CI hardware budget", async () => {
  const startedAt = performance.now();
  await hashPassword("benchmark-only password value");
  const elapsedMilliseconds = performance.now() - startedAt;

  assert.ok(
    elapsedMilliseconds < 5_000,
    `scrypt took ${Math.round(elapsedMilliseconds)} ms; review the deployment CPU budget`,
  );
});

test("password hashing uses the Workers-native crypto implementation", async () => {
  const source = await readFile(
    new URL("../src/lib/security/password.ts", import.meta.url),
    "utf8",
  );
  assert.match(source, /from "node:crypto"/);
  assert.doesNotMatch(source, /@noble\/hashes|scryptAsync/);
});
