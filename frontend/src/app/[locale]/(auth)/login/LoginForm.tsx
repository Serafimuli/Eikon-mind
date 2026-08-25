"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { TurnstileWidget } from "@/components/TurnstileWidget"
import { authClient } from "@/lib/auth-client"
import type { Locale } from "@/lib/site-content"

export function LoginForm({ locale }: { locale: Locale }) {
  const router = useRouter()
  const search = useSearchParams()
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [captchaToken, setCaptchaToken] = useState("")
  const submit = async (form: FormData) => {
    if (!captchaToken) return setError("Complete the verification challenge")
    setBusy(true); setError("")
    const result = await authClient.signIn.email({
      email: String(form.get("email")),
      password: String(form.get("password")),
      callbackURL: `/${locale}/client`,
      fetchOptions: { headers: { "x-captcha-response": captchaToken } },
    })
    setBusy(false)
    if (result.error) return setError(result.error.message || "Sign-in failed")
    if ((result.data as { twoFactorRedirect?: boolean } | null)?.twoFactorRedirect) {
      router.replace(`/${locale}/two-factor`)
      return
    }
    const destination = search?.get("returnTo")
    router.replace(destination?.startsWith(`/${locale}/`) ? destination : `/${locale}/client`)
    router.refresh()
  }
  return <form action={submit} className="form-card auth-card"><p className="eyebrow">Eikon Mind</p><h1>{locale === "ro" ? "Bine ai revenit" : "Welcome back"}</h1><label>Email<input name="email" type="email" autoComplete="email" required/></label><label>{locale === "ro" ? "Parolă" : "Password"}<input name="password" type="password" minLength={12} autoComplete="current-password" required/></label><TurnstileWidget onToken={setCaptchaToken}/>{error && <p className="error">{error}</p>}<button className="button" disabled={busy || !captchaToken}>{busy ? "…" : (locale === "ro" ? "Autentificare" : "Sign in")}</button><p><Link href={`/${locale}/register`}>{locale === "ro" ? "Creează un cont" : "Create an account"}</Link></p></form>
}
