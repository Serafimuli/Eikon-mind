"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { useTurnstileChallenge } from "@/hooks/useTurnstileChallenge";
import { authClient } from "@/lib/auth-client";
import { securityCopy, type Locale } from "@/lib/site-content";

export function RegisterForm({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const captcha = useTurnstileChallenge();
  const copy = securityCopy[locale];

  const submit = async (form: FormData) => {
    if (!captcha.token) return setError(copy.captchaRequired);
    setBusy(true);
    setError("");
    const firstName = String(form.get("firstName") ?? "").trim();
    const lastName = String(form.get("lastName") ?? "").trim();
    const result = await authClient.signUp.email({
      email: String(form.get("email")),
      password: String(form.get("password")),
      name: `${firstName} ${lastName}`,
      callbackURL: `/${locale}/verify-email`,
      firstName,
      lastName,
      fetchOptions: { headers: { "x-captcha-response": captcha.token } },
    } as never);
    setBusy(false);
    if (result.error) {
      captcha.reset();
      return setError(copy.registrationFailed);
    }
    router.replace(`/${locale}/verify-email`);
  };

  return (
    <form action={submit} className="form-card auth-card">
      <p className="eyebrow">Eikon Mind</p>
      <h1>{locale === "ro" ? "Creează un cont" : "Create your account"}</h1>
      <label>
        {locale === "ro" ? "Prenume" : "First name"}
        <input name="firstName" autoComplete="given-name" required />
      </label>
      <label>
        {locale === "ro" ? "Nume" : "Last name"}
        <input name="lastName" autoComplete="family-name" required />
      </label>
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
          autoComplete="new-password"
          required
        />
      </label>
      <p className="muted">
        {locale === "ro" ? "Folosește cel puțin 12 caractere." : "Use at least 12 characters."}
      </p>
      <TurnstileWidget key={captcha.generation} onToken={captcha.setToken} />
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button className="button" disabled={busy || !captcha.token}>
        {busy ? "…" : locale === "ro" ? "Înregistrează-te" : "Register"}
      </button>
      <div className="auth-divider" aria-hidden="true">
        <span>{locale === "ro" ? "sau" : "or"}</span>
      </div>
      <GoogleSignInButton
        locale={locale}
        disabled={busy}
        onError={() => setError(copy.registrationFailed)}
      />
      <p>
        <Link href={`/${locale}/login`}>
          {locale === "ro" ? "Ai deja cont? Autentifică-te" : "Already have an account? Sign in"}
        </Link>
      </p>
    </form>
  );
}
