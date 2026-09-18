import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Romanian and English notices state matching data, rights, transfer, and retention safeguards", async () => {
  const source = await readFile(new URL("../src/lib/site-content.ts", import.meta.url), "utf8");

  for (const text of [
    "14 septembrie 2026",
    "14 September 2026",
    "art. 9 alin. (2) lit. h GDPR",
    "Article 9(2)(h) GDPR",
    "Cloudflare, Resend și Google",
    "Cloudflare, Resend, and Google",
    "Reserved time",
    "30 de zile",
    "30 days",
    "14 zile",
    "14 days",
    "ANSPDCP",
    "one month",
    "o lună",
    "profilare",
    "profiling",
    "localStorage",
    "__Secure-better-auth.session_token",
    "__Secure-better-auth.two_factor",
    "Cloudflare Turnstile",
    "eikon-theme (localStorage)",
    "eikon-music-enabled (localStorage)",
  ]) {
    assert.ok(source.includes(text), `missing notice content: ${text}`);
  }
});

test("terms keep therapeutic documents and a minor's consent outside the scheduling app", async () => {
  const source = await readFile(new URL("../src/lib/site-content.ts", import.meta.url), "utf8");

  assert.match(source, /Minori și documente terapeutice/);
  assert.match(source, /Minors and therapeutic documents/);
  assert.match(source, /outside the application/);
  assert.match(source, /în afara aplicației/);
});

test("privacy notice links are prominent in registration, sign-in, Google sign-in, and booking", async () => {
  const files = await Promise.all([
    readFile(
      new URL("../src/app/[locale]/(auth)/register/RegisterForm.tsx", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../src/app/[locale]/(auth)/login/LoginForm.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/GoogleSignInButton.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/BookingCalendar.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/[locale]/client/profile/page.tsx", import.meta.url), "utf8"),
  ]);

  for (const source of files)
    assert.match(source, /politica-de-confidentialitate|\/api\/privacy\/export/);
  const protectedContent = await readFile(
    new URL("../src/lib/protected-content.ts", import.meta.url),
    "utf8",
  );
  assert.match(protectedContent, /Download your data/);
  assert.match(files[4], /\/api\/privacy\/export/);
});

test("the public home page no longer renders therapy testimonials", async () => {
  const [content, component] = await Promise.all([
    readFile(new URL("../src/lib/site-content.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/components/PublicContent.tsx", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(content, /testimonialsTitle|testimonials:/);
  assert.doesNotMatch(component, /testimonial/i);
});
