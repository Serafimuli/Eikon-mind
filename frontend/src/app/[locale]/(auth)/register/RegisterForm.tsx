"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { useTurnstileChallenge } from "@/hooks/useTurnstileChallenge";
import { authClient, authFetchOptions } from "@/lib/auth-client";
import { localizedInputHandlers } from "@/lib/localized-validation";
import { securityCopy, type Locale } from "@/lib/site-content";

export function RegisterForm({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [firstNameValue, setFirstNameValue] = useState("");
  const [lastNameValue, setLastNameValue] = useState("");
  const [email, setEmail] = useState("");
  const captcha = useTurnstileChallenge();
  const copy = securityCopy[locale];
  const validation = localizedInputHandlers(locale);

  const submit = async (form: FormData) => {
    if (!captcha.token) return setError(copy.captchaRequired);
    setBusy(true);
    setError("");
    const firstName = String(form.get("firstName") ?? "").trim();
    const lastName = String(form.get("lastName") ?? "").trim();
    try {
      const result = await authClient.signUp.email({
        email: String(form.get("email")),
        password: String(form.get("password")),
        name: `${firstName} ${lastName}`,
        callbackURL: `/${locale}/client/profile`,
        firstName,
        lastName,
        fetchOptions: authFetchOptions(locale, { "x-captcha-response": captcha.token }),
      } as never);
      if (result.error) {
        captcha.reset();
        return setError(
          result.error.status >= 500 ? copy.registrationUnavailable : copy.registrationFailed,
        );
      }
      router.replace(`/${locale}/client/profile`);
    } catch {
      captcha.reset();
      setError(copy.registrationUnavailable);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form action={submit} className="form-card auth-card">
      <p className="eyebrow">Eikon Mind</p>
      <h1>{locale === "ro" ? "Creează un cont" : "Create your account"}</h1>
      <label>
        {locale === "ro" ? "Prenume" : "First name"}
        <input
          name="firstName"
          autoComplete="given-name"
          value={firstNameValue}
          onChange={(event) => setFirstNameValue(event.target.value)}
          required
          {...validation}
        />
      </label>
      <label>
        {locale === "ro" ? "Nume" : "Last name"}
        <input
          name="lastName"
          autoComplete="family-name"
          value={lastNameValue}
          onChange={(event) => setLastNameValue(event.target.value)}
          required
          {...validation}
        />
      </label>
      <label>
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          {...validation}
        />
      </label>
      <label>
        {locale === "ro" ? "Parolă" : "Password"}
        <input
          name="password"
          type="password"
          minLength={12}
          autoComplete="new-password"
          required
          {...validation}
        />
      </label>
      <p className="muted">
        {locale === "ro" ? "Folosește cel puțin 12 caractere." : "Use at least 12 characters."}
      </p>
      <p className="muted">
        <Link href={`/${locale}/politica-de-confidentialitate`}>
          {locale === "ro"
            ? "Citește informarea privind prelucrarea datelor înainte de creare cont."
            : "Read the data-processing notice before creating an account."}
        </Link>
      </p>
      <TurnstileWidget key={captcha.generation} locale={locale} onToken={captcha.setToken} />
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button className="button" type="submit" disabled={busy || !captcha.token}>
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
