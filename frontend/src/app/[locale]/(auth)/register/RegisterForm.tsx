"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { TurnstileWidget } from "@/components/TurnstileWidget"
import { authClient } from "@/lib/auth-client"
import type { Locale } from "@/lib/site-content"

export function RegisterForm({ locale }: { locale: Locale }) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [captchaToken, setCaptchaToken] = useState("")
  const submit = async (form: FormData) => {
    if (!captchaToken) return setError("Complete the verification challenge")
    setBusy(true); setError("")
    const firstName = String(form.get("firstName"))
    const lastName = String(form.get("lastName"))
    const result = await authClient.signUp.email({
      email: String(form.get("email")),
      password: String(form.get("password")),
      name: `${firstName} ${lastName}`,
      firstName,
      lastName,
      fetchOptions: { headers: { "x-captcha-response": captchaToken } },
    } as never)
    setBusy(false)
    if (result.error) return setError(result.error.message || "Registration failed")
    router.replace(`/${locale}/client/profile`)
    router.refresh()
  }
  return <form action={submit} className="form-card auth-card"><p className="eyebrow">Eikon Mind</p><h1>{locale === "ro" ? "Creează un cont" : "Create your account"}</h1><label>{locale === "ro" ? "Prenume" : "First name"}<input name="firstName" autoComplete="given-name" required/></label><label>{locale === "ro" ? "Nume" : "Last name"}<input name="lastName" autoComplete="family-name" required/></label><label>Email<input name="email" type="email" autoComplete="email" required/></label><label>{locale === "ro" ? "Parolă" : "Password"}<input name="password" type="password" minLength={12} autoComplete="new-password" required/></label><p className="muted">Use at least 12 characters.</p><TurnstileWidget onToken={setCaptchaToken}/>{error && <p className="error">{error}</p>}<button className="button" disabled={busy || !captchaToken}>{busy ? "…" : (locale === "ro" ? "Înregistrează-te" : "Register")}</button><p><Link href={`/${locale}/login`}>{locale === "ro" ? "Ai deja cont? Autentifică-te" : "Already have an account? Sign in"}</Link></p></form>
}
