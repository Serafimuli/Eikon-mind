"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { useTurnstileChallenge } from "@/hooks/useTurnstileChallenge";
import { authClient } from "@/lib/auth-client";
import type { Locale } from "@/lib/site-content";

export function ResetPasswordForm({
  locale,
  token,
  initialError = "",
}: {
  locale: Locale;
  token: string;
  initialError?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const captcha = useTurnstileChallenge();
  const [message, setMessage] = useState("");
  const [error, setError] = useState(
    initialError
      ? locale === "ro"
        ? "Linkul de resetare este invalid sau expirat."
        : "That reset link is invalid or expired."
      : "",
  );
  const [busy, setBusy] = useState(false);

  const requestReset = async () => {
    if (!captcha.token)
      return setError(
        locale === "ro" ? "Finalizează verificarea." : "Complete the verification challenge.",
      );
    setBusy(true);
    setError("");
    const result = await authClient.requestPasswordReset({
      email,
      redirectTo: `/${locale}/reset-password`,
      fetchOptions: { headers: { "x-captcha-response": captcha.token } },
    });
    setBusy(false);
    if (result.error) {
      captcha.reset();
      return setError(
        locale === "ro" ? "Nu am putut procesa cererea." : "We could not process that request.",
      );
    }
    setMessage(
      locale === "ro"
        ? "Dacă adresa există, vei primi un email cu pașii următori."
        : "If that address exists, you will receive reset instructions.",
    );
  };

  const resetPassword = async () => {
    setBusy(true);
    setError("");
    const result = await authClient.resetPassword({
      newPassword: password,
      token,
    });
    setBusy(false);
    if (result.error)
      return setError(
        locale === "ro"
          ? "Linkul de resetare este invalid sau expirat."
          : "That reset link is invalid or expired.",
      );
    router.replace(`/${locale}/login?reset=complete`);
  };

  return (
    <main className="private-shell">
      <section className="form-card auth-card" aria-live="polite">
        <p className="eyebrow">Eikon Mind</p>
        <h1>
          {token
            ? locale === "ro"
              ? "Alege o parolă nouă"
              : "Choose a new password"
            : locale === "ro"
              ? "Resetează parola"
              : "Reset your password"}
        </h1>
        {token ? (
          <>
            <p className="muted">
              {locale === "ro"
                ? "Parola trebuie să aibă cel puțin 12 caractere."
                : "Your password must contain at least 12 characters."}
            </p>
            <label>
              {locale === "ro" ? "Parolă nouă" : "New password"}
              <input
                type="password"
                minLength={12}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button
              className="button"
              type="button"
              disabled={busy || password.length < 12}
              onClick={resetPassword}
            >
              {busy ? "…" : locale === "ro" ? "Schimbă parola" : "Set password"}
            </button>
          </>
        ) : (
          <>
            <p>
              {locale === "ro"
                ? "Introdu adresa contului. Răspunsul este același indiferent dacă adresa există."
                : "Enter your account email. The response is the same whether the address exists."}
            </p>
            <label>
              Email
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <TurnstileWidget key={captcha.generation} onToken={captcha.setToken} />
            {message && (
              <p className="success" role="status">
                {message}
              </p>
            )}
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button
              className="button"
              type="button"
              disabled={busy || !email || !captcha.token}
              onClick={requestReset}
            >
              {busy ? "…" : locale === "ro" ? "Trimite linkul" : "Send reset link"}
            </button>
          </>
        )}
        <p>
          <Link href={`/${locale}/login`}>
            {locale === "ro" ? "Înapoi la autentificare" : "Back to sign in"}
          </Link>
        </p>
      </section>
    </main>
  );
}
