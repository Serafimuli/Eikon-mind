"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { useTurnstileChallenge } from "@/hooks/useTurnstileChallenge";
import { authClient, resolveAuthDestination } from "@/lib/auth-client";
import { securityCopy, type Locale } from "@/lib/site-content";

export function LoginForm({ locale }: { locale: Locale }) {
  const router = useRouter();
  const search = useSearchParams();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const captcha = useTurnstileChallenge();
  const copy = securityCopy[locale];

  const submit = async (form: FormData) => {
    if (!captcha.token) return setError(copy.captchaRequired);
    setBusy(true);
    setError("");
    const result = await authClient.signIn.email({
      email: String(form.get("email")),
      password: String(form.get("password")),
      callbackURL: `/${locale}/client`,
      fetchOptions: { headers: { "x-captcha-response": captcha.token } },
    });
    setBusy(false);
    if (result.error) {
      captcha.reset();
      return setError(copy.signInFailed);
    }

    const returnTo = search?.get("returnTo");
    if ((result.data as { twoFactorRedirect?: boolean } | null)?.twoFactorRedirect) {
      router.replace(
        `/${locale}/two-factor${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`,
      );
      return;
    }
    try {
      router.replace(await resolveAuthDestination(locale, returnTo));
    } catch {
      router.replace(`/${locale}/client`);
    }
  };

  return (
    <form action={submit} className="form-card auth-card">
      <p className="eyebrow">Eikon Mind</p>
      <h1>{locale === "ro" ? "Bine ai revenit" : "Welcome back"}</h1>
      <label>
        Email
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        {locale === "ro" ? "Parolă" : "Password"}
        <input
          name="password"
          type="password"
          minLength={12}
          autoComplete="current-password"
          required
        />
      </label>
      <TurnstileWidget key={captcha.generation} onToken={captcha.setToken} />
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button className="button" disabled={busy || !captcha.token}>
        {busy ? "…" : locale === "ro" ? "Autentificare" : "Sign in"}
      </button>
      <p>
        <Link href={`/${locale}/reset-password`}>
          {locale === "ro" ? "Ai uitat parola?" : "Forgot your password?"}
        </Link>
      </p>
      <p>
        <Link href={`/${locale}/register`}>
          {locale === "ro" ? "Creează un cont" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
