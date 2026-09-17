"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { authClient } from "@/lib/auth-client";
import type { Locale } from "@/lib/site-content";

export function TwoFactorSetup({ enabled, locale }: { enabled: boolean; locale: Locale }) {
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [uri, setUri] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copyError, setCopyError] = useState("");
  const copyResetTimer = useRef<number | null>(null);

  const copyText = {
    copy: locale === "ro" ? "Copiază codul de rezervă" : "Copy backup code",
    copied: locale === "ro" ? "Cod de rezervă copiat." : "Backup code copied.",
    error:
      locale === "ro" ? "Codul de rezervă nu a putut fi copiat." : "Could not copy backup code.",
  };

  useEffect(() => {
    return () => {
      if (copyResetTimer.current !== null) window.clearTimeout(copyResetTimer.current);
    };
  }, []);

  const start = async () => {
    setBusy(true);
    setError("");
    const result = await authClient.twoFactor.enable({ password, method: "totp" });
    setBusy(false);
    if (result.error || result.data?.method !== "totp")
      return setError(
        locale === "ro" ? "Configurarea TOTP nu a reușit." : "Could not start TOTP setup.",
      );
    setUri(result.data.totpURI);
    setBackupCodes(result.data.backupCodes);
    setPassword("");
  };

  const verify = async () => {
    setBusy(true);
    setError("");
    const result = await authClient.twoFactor.verifyTotp({ code, trustDevice: false });
    setBusy(false);
    if (result.error)
      return setError(locale === "ro" ? "Codul nu este valid." : "That code is not valid.");
    window.location.reload();
  };

  const copyBackupCode = async (backupCode: string) => {
    setCopyError("");
    if (copyResetTimer.current !== null) {
      window.clearTimeout(copyResetTimer.current);
      copyResetTimer.current = null;
    }

    try {
      await navigator.clipboard.writeText(backupCode);
      setCopiedCode(backupCode);
      copyResetTimer.current = window.setTimeout(() => {
        setCopiedCode((current) => (current === backupCode ? null : current));
        copyResetTimer.current = null;
      }, 1600);
    } catch {
      setCopiedCode(null);
      setCopyError(copyText.error);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void (uri ? verify() : start());
  };

  if (enabled)
    return (
      <section className="card profile-card profile-card--security" aria-live="polite">
        <h2>{locale === "ro" ? "Autentificare cu doi factori" : "Two-factor authentication"}</h2>
        <p className="success" role="status">
          {locale === "ro"
            ? "TOTP este activ. Păstrează codurile de rezervă într-un manager de parole aprobat."
            : "Authenticator-app TOTP is enabled. Keep your backup codes in an approved password manager."}
        </p>
      </section>
    );

  return (
    <form className="card profile-card profile-card--security" aria-live="polite" onSubmit={submit}>
      <h2>{locale === "ro" ? "Activează TOTP" : "Enable TOTP"}</h2>
      <p>
        {locale === "ro"
          ? "TOTP este obligatoriu înainte de promovarea la terapeut sau administrator. Codurile de rezervă sunt afișate o singură dată."
          : "TOTP is required before promotion to therapist or administrator. Backup codes are shown once."}
      </p>
      {!uri ? (
        <>
          <label>
            {locale === "ro" ? "Parola curentă" : "Current password"}
            <input
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              minLength={12}
              required
              autoComplete="current-password"
            />
          </label>
          <button type="submit" className="button" disabled={busy || password.length < 12}>
            {busy ? "…" : locale === "ro" ? "Generează configurarea" : "Create TOTP setup"}
          </button>
        </>
      ) : (
        <>
          <p>
            {locale === "ro"
              ? "Scanează codul QR cu aplicația de autentificare."
              : "Scan this QR code with your authenticator app."}
          </p>
          <div className="two-factor-qr">
            <QRCodeSVG
              value={uri}
              size={224}
              level="M"
              includeMargin
              role="img"
              title={locale === "ro" ? "Cod QR pentru configurarea TOTP" : "TOTP setup QR code"}
            />
          </div>
          <div className="backup-codes">
            <strong>{locale === "ro" ? "Coduri de rezervă" : "Backup codes"}</strong>
            <p>
              {locale === "ro"
                ? "Păstrează-le într-un manager de parole aprobat. Sunt afișate o singură dată."
                : "Keep them in an approved password manager. They are shown only once."}
            </p>
            <ul>
              {backupCodes.map((backupCode) => (
                <li key={backupCode}>
                  <span>{backupCode}</span>
                  <button
                    type="button"
                    className="backup-code-copy"
                    aria-label={copiedCode === backupCode ? copyText.copied : copyText.copy}
                    title={copiedCode === backupCode ? copyText.copied : copyText.copy}
                    onClick={() => void copyBackupCode(backupCode)}
                  >
                    {copiedCode === backupCode ? (
                      <svg viewBox="0 0 24 24" fill="none" focusable="false" aria-hidden="true">
                        <path
                          d="m5 12 4 4L19 6"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" focusable="false" aria-hidden="true">
                        <rect
                          x="8"
                          y="8"
                          width="10"
                          height="10"
                          rx="1.5"
                          stroke="currentColor"
                          strokeWidth="1.6"
                        />
                        <path
                          d="M16 8V6.5A1.5 1.5 0 0 0 14.5 5h-8A1.5 1.5 0 0 0 5 6.5v8A1.5 1.5 0 0 0 6.5 16H8"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                  </button>
                </li>
              ))}
            </ul>
            {(copyError || copiedCode) && (
              <p
                className={`backup-codes__feedback ${copyError ? "error" : "success"}`}
                role={copyError ? "alert" : "status"}
                aria-live="polite"
              >
                {copyError || copyText.copied}
              </p>
            )}
          </div>
          <label>
            {locale === "ro" ? "Codul aplicației" : "Authenticator code"}
            <input
              name="code"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 8))}
              inputMode="numeric"
              minLength={6}
              required
              autoComplete="one-time-code"
            />
          </label>
          <button type="submit" className="button" disabled={busy || code.length < 6}>
            {busy ? "…" : locale === "ro" ? "Verifică și activează" : "Verify and enable"}
          </button>
        </>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
