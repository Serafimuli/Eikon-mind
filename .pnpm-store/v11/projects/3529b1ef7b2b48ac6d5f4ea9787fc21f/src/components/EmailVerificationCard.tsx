"use client"

import { useState } from "react"
import { TurnstileWidget } from "@/components/TurnstileWidget"
import { authClient } from "@/lib/auth-client"
import type { Locale } from "@/lib/site-content"

export function EmailVerificationCard({
  email,
  verified,
  locale,
}: {
  email: string
  verified: boolean
  locale: Locale
}) {
  const [captchaToken, setCaptchaToken] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  if (verified)
    return (
      <p className="success" role="status">
        {locale === "ro"
          ? "Adresa de email este verificată."
          : "Email address verified."}
      </p>
    )

  const resend = async () => {
    if (!captchaToken)
      return setError(
        locale === "ro"
          ? "Finalizează verificarea."
          : "Complete the verification challenge.",
      )
    setBusy(true)
    setError("")
    const result = await authClient.sendVerificationEmail({
      email,
      callbackURL: `/${locale}/verify-email`,
      fetchOptions: { headers: { "x-captcha-response": captchaToken } },
    })
    setBusy(false)
    if (result.error)
      return setError(
        locale === "ro"
          ? "Nu am putut retrimite emailul."
          : "We could not resend that email.",
      )
    setMessage(
      locale === "ro"
        ? "Dacă adresa este eligibilă, vei primi un nou email."
        : "If the address is eligible, a new email will be sent.",
    )
  }

  return (
    <section className="card" aria-live="polite">
      <h2>
        {locale === "ro" ? "Verificarea emailului" : "Email verification"}
      </h2>
      <p>
        {locale === "ro"
          ? "Verifică adresa înainte de a face o programare."
          : "Verify your address before booking an appointment."}
      </p>
      <TurnstileWidget onToken={setCaptchaToken} />
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
        className="button button--secondary"
        type="button"
        disabled={busy || !captchaToken}
        onClick={resend}
      >
        {busy
          ? "…"
          : locale === "ro"
            ? "Retrimite emailul"
            : "Resend verification email"}
      </button>
    </section>
  )
}
