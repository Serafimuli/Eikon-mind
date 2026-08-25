"use client"

import { useState } from "react"
import { authClient } from "@/lib/auth-client"

export function TwoFactorSetup({ enabled }: { enabled: boolean }) {
  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")
  const [uri, setUri] = useState("")
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  const start = async () => {
    setBusy(true); setError("")
    const result = await authClient.twoFactor.enable({ password, method: "totp" })
    setBusy(false)
    if (result.error || result.data?.method !== "totp") return setError(result.error?.message ?? "Could not start TOTP setup")
    setUri(result.data.totpURI)
    setBackupCodes(result.data.backupCodes)
    setPassword("")
  }
  const verify = async () => {
    setBusy(true); setError("")
    const result = await authClient.twoFactor.verifyTotp({ code, trustDevice: false })
    setBusy(false)
    if (result.error) return setError(result.error.message ?? "Invalid code")
    window.location.reload()
  }

  if (enabled) return <p className="success">Authenticator-app TOTP is enabled. Keep your backup codes in an approved password manager.</p>
  return <section className="card"><h2>Authenticator app required before staff promotion</h2><p>Set up TOTP now. Save the backup codes once; they cannot be shown again.</p>{!uri ? <><label>Current password<input value={password} onChange={(event)=>setPassword(event.target.value)} type="password" minLength={12} autoComplete="current-password"/></label><button type="button" className="button" disabled={busy || password.length < 12} onClick={start}>Create TOTP setup</button></> : <><p>Scan or add this URI in your authenticator app:</p><code className="wrap-code">{uri}</code><p><strong>Backup codes:</strong> {backupCodes.join(" · ")}</p><label>Authenticator code<input value={code} onChange={(event)=>setCode(event.target.value.replace(/\D/g, "").slice(0, 8))} inputMode="numeric" autoComplete="one-time-code"/></label><button type="button" className="button" disabled={busy || code.length < 6} onClick={verify}>Verify and enable</button></>}{error&&<p className="error">{error}</p>}</section>
}
