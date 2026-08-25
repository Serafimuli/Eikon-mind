"use client"

import { useState } from "react"
import { authClient } from "@/lib/auth-client"
import type { Locale } from "@/lib/site-content"

export function TwoFactorSetup({ enabled, locale }: { enabled: boolean; locale: Locale }) {
  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")
  const [uri, setUri] = useState("")
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  const start = async () => {
    setBusy(true)
    setError("")
    const result = await authClient.twoFactor.enable({ password, method: "totp" })
    setBusy(false)
    if (result.error || result.data?.method !== "totp") return setError(locale === "ro" ? "Configurarea TOTP nu a reușit." : "Could not start TOTP setup.")
    setUri(result.data.totpURI)
    setBackupCodes(result.data.backupCodes)
    setPassword("")
  }

  const verify = async () => {
    setBusy(true)
    setError("")
    const result = await authClient.twoFactor.verifyTotp({ code, trustDevice: false })
    setBusy(false)
    if (result.error) return setError(locale === "ro" ? "Codul nu este valid." : "That code is not valid.")
    window.location.reload()
  }

  if (enabled) return <section className="card" aria-live="polite"><h2>{locale === "ro" ? "Autentificare cu doi factori" : "Two-factor authentication"}</h2><p className="success" role="status">{locale === "ro" ? "TOTP este activ. Păstrează codurile de rezervă într-un manager de parole aprobat." : "Authenticator-app TOTP is enabled. Keep your backup codes in an approved password manager."}</p></section>

  return <section className="card" aria-live="polite">
    <h2>{locale === "ro" ? "Activează TOTP" : "Enable TOTP"}</h2>
    <p>{locale === "ro" ? "TOTP este obligatoriu înainte de promovarea la terapeut sau administrator. Codurile de rezervă sunt afișate o singură dată." : "TOTP is required before promotion to therapist or administrator. Backup codes are shown once."}</p>
    {!uri ? <>
      <label>{locale === "ro" ? "Parola curentă" : "Current password"}<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" minLength={12} autoComplete="current-password" /></label>
      <button type="button" className="button" disabled={busy || password.length < 12} onClick={start}>{busy ? "…" : (locale === "ro" ? "Generează configurarea" : "Create TOTP setup")}</button>
    </> : <>
      <p>{locale === "ro" ? "Scanează sau adaugă acest URI în aplicația de autentificare:" : "Scan or add this URI in your authenticator app:"}</p>
      <code className="wrap-code">{uri}</code>
      <p><strong>{locale === "ro" ? "Coduri de rezervă:" : "Backup codes:"}</strong> {backupCodes.join(" · ")}</p>
      <label>{locale === "ro" ? "Codul aplicației" : "Authenticator code"}<input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 8))} inputMode="numeric" autoComplete="one-time-code" /></label>
      <button type="button" className="button" disabled={busy || code.length < 6} onClick={verify}>{busy ? "…" : (locale === "ro" ? "Verifică și activează" : "Verify and enable")}</button>
    </>}
    {error && <p className="error" role="alert">{error}</p>}
  </section>
}
