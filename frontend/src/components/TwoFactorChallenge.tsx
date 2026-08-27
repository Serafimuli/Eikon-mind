"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient, resolveAuthDestination } from "@/lib/auth-client";
import type { Locale } from "@/lib/site-content";

export function TwoFactorChallenge({ locale, returnTo }: { locale: Locale; returnTo: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const verify = async () => {
    setBusy(true);
    setError("");
    const result = backupCode
      ? await authClient.twoFactor.verifyBackupCode({
          code: backupCode,
          trustDevice: false,
        })
      : await authClient.twoFactor.verifyTotp({ code, trustDevice: false });
    setBusy(false);
    if (result.error)
      return setError(locale === "ro" ? "Verificarea nu a reușit." : "Verification failed.");
    try {
      router.replace(await resolveAuthDestination(locale, returnTo));
    } catch {
      router.replace(`/${locale}/client`);
    }
  };

  return (
    <section className="form-card auth-card" aria-live="polite">
      <p className="eyebrow">Eikon Mind</p>
      <h1>{locale === "ro" ? "Verificare în doi pași" : "Two-factor verification"}</h1>
      <p>
        {locale === "ro"
          ? "Folosește un cod din aplicația de autentificare sau un cod de rezervă."
          : "Use a current authenticator-app code or a backup code."}
      </p>
      <label>
        {locale === "ro" ? "Codul aplicației" : "Authenticator code"}
        <input
          value={code}
          onChange={(event) => {
            setCode(event.target.value.replace(/\D/g, "").slice(0, 8));
            setBackupCode("");
          }}
          inputMode="numeric"
          autoComplete="one-time-code"
        />
      </label>
      <label>
        {locale === "ro" ? "Cod de rezervă" : "Backup code"}
        <input
          value={backupCode}
          onChange={(event) => {
            setBackupCode(event.target.value);
            setCode("");
          }}
          autoComplete="one-time-code"
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
        disabled={busy || (!code && !backupCode)}
        onClick={verify}
      >
        {busy ? "…" : locale === "ro" ? "Verifică" : "Verify"}
      </button>
    </section>
  );
}
