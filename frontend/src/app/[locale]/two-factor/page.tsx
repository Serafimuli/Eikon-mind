"use client"

import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { authClient } from "@/lib/auth-client"

export default function TwoFactorChallenge() {
  const router = useRouter()
  const params = useParams<{ locale: string }>()
  const [code, setCode] = useState("")
  const [backupCode, setBackupCode] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const verify = async () => {
    setBusy(true); setError("")
    const result = backupCode
      ? await authClient.twoFactor.verifyBackupCode({ code: backupCode })
      : await authClient.twoFactor.verifyTotp({ code, trustDevice: false })
    setBusy(false)
    if (result.error) return setError(result.error.message ?? "Verification failed")
    router.replace(`/${params.locale}/client`)
    router.refresh()
  }
  return <main className="private-shell"><section className="form-card"><p className="eyebrow">Eikon Mind</p><h1>Two-factor verification</h1><p>Use a current authenticator-app code, or a backup code.</p><label>Authenticator code<input value={code} onChange={(event)=>{setCode(event.target.value.replace(/\D/g, "").slice(0,8));setBackupCode("")}} inputMode="numeric" autoComplete="one-time-code"/></label><label>Backup code<input value={backupCode} onChange={(event)=>{setBackupCode(event.target.value);setCode("")}} autoComplete="one-time-code"/></label>{error&&<p className="error">{error}</p>}<button className="button" type="button" disabled={busy || (!code && !backupCode)} onClick={verify}>{busy?"…":"Verify"}</button></section></main>
}
