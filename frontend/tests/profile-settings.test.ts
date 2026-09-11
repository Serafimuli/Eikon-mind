import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("profile settings use verified email changes and revoke other sessions after password changes", async () => {
  const [auth, profile] = await Promise.all([
    readFile(new URL("../src/lib/auth.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/components/ProfileSettings.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(auth, /changeEmail:\s*\{[\s\S]*enabled: true/);
  assert.doesNotMatch(auth, /updateEmailWithoutVerification:\s*true/);
  assert.match(auth, /account:\s*\{[\s\S]*passwordChangedEmail/);
  assert.match(profile, /authClient\.changeEmail/);
  assert.match(profile, /authClient\.changePassword/);
  assert.match(profile, /revokeOtherSessions: true/);
  assert.match(profile, /newEmail\.trim\(\)\.toLowerCase\(\) !== confirmEmail/);
});

test("TOTP setup renders a QR code without exposing the provisioning URI as text", async () => {
  const source = await readFile(
    new URL("../src/components/TwoFactorSetup.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /QRCodeSVG/);
  assert.match(source, /value=\{uri\}/);
  assert.doesNotMatch(source, /wrap-code.*uri/);
  assert.doesNotMatch(source, /Scan or add this URI/);
});

test("profile layout is organized into responsive settings and security regions", async () => {
  const [page, css] = await Promise.all([
    readFile(new URL("../src/app/[locale]/client/profile/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(page, /ProfileSettings/);
  assert.match(page, /profile-security-grid/);
  assert.match(page, /danger-zone/);
  assert.match(css, /\.profile-settings-grid/);
  assert.match(css, /\.profile-security-grid/);
  assert.match(css, /@media \(max-width: 767px\)[\s\S]*\.profile-settings-grid/);
});
