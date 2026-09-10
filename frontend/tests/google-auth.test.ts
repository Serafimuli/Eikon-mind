import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Google authentication uses server-only credentials and safe profile fields", async () => {
  const source = await readFile(new URL("../src/lib/auth.ts", import.meta.url), "utf8");

  assert.match(source, /resolveSecret\(env\.GOOGLE_CLIENT_ID, "GOOGLE_CLIENT_ID"\)/);
  assert.match(source, /resolveSecret\(env\.GOOGLE_CLIENT_SECRET, "GOOGLE_CLIENT_SECRET"\)/);
  assert.match(source, /socialProviders:\s*\{\s*google:/);
  assert.match(source, /encryptOAuthTokens: true/);
  assert.match(source, /includeGrantedScopes: false/);
  assert.match(source, /googleProfileName\(profile\.given_name, "Google"\)/);
  assert.match(source, /googleProfileName\(profile\.family_name, "User"\)/);
});

test("both auth forms offer Google sign-in through the shared component", async () => {
  const [login, register, button] = await Promise.all([
    readFile(new URL("../src/app/[locale]/(auth)/login/LoginForm.tsx", import.meta.url), "utf8"),
    readFile(
      new URL("../src/app/[locale]/(auth)/register/RegisterForm.tsx", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../src/components/GoogleSignInButton.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(login, /<GoogleSignInButton/);
  assert.match(register, /<GoogleSignInButton/);
  assert.match(button, /authClient\.signIn\.social/);
  assert.match(button, /provider: "google"/);
  assert.match(button, /newUserCallbackURL: callbackURL/);
});

test("Google callbacks stay private and redirect according to the authenticated role", async () => {
  const [continuation, middleware, client] = await Promise.all([
    readFile(new URL("../src/app/[locale]/(auth)/continue/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/middleware.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/lib/auth-client.ts", import.meta.url), "utf8"),
  ]);

  assert.match(continuation, /getCurrentUser/);
  assert.match(continuation, /redirect\(authDestination\(locale, user\.role, query\.returnTo\)/);
  assert.match(middleware, /two-factor\|continue/);
  assert.match(client, /return `\/\$\{locale\}\/continue\$\{suffix\}`/);
});
