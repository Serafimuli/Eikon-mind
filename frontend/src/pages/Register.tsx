import { useState, SubmitEvent } from "react"
import { Link, useNavigate } from "react-router"
import { useApp } from "@/contexts/AppContext"
import type { RegisterForm } from "./auth.types"
import { validateRegisterForm } from "./auth.utils"
import RegisterField from "./auth/RegisterField"

export default function Register() {
  const { tr, register } = useApp()
  const a = tr.auth
  const navigate = useNavigate()

  const [form, setForm] = useState<RegisterForm>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirm: "",
  })
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((p) => ({ ...p, [field]: e.target.value }))
    setErrors((p) => {
      const n = { ...p }
      delete n[field]
      return n
    })
  }

  const handleSubmit = async (ev: SubmitEvent) => {
    ev.preventDefault()
    const e = validateRegisterForm(form, agreed, a.errors)
    if (Object.keys(e).length) {
      setErrors(e)
      return
    }
    setLoading(true)
    setServerError(null)
    await new Promise((r) => setTimeout(r, 500))
    const result = register({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      password: form.password,
    })
    setLoading(false)
    if (!result.success) {
      setServerError(result.error || "Error")
      return
    }
    setSuccess(true)
    setTimeout(() => navigate("/login"), 1800)
  }

  if (success) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center py-12 px-4">
        <div className="text-center animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-2xl">
            ✓
          </div>
          <h2 className="font-display text-xl font-semibold text-foreground mb-2">
            {a.success.accountCreated}
          </h2>
          <p className="text-sm text-muted-foreground">
            Redirecting to login…
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center py-12 px-4 animate-fade-in">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="font-display font-bold text-primary text-xl">
              A
            </span>
          </div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            {a.register}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{a.registerSub}</p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4"
        >
          {serverError && (
            <div
              role="alert"
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-lg"
            >
              {serverError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <RegisterField
              id="firstName"
              label={a.firstName}
              autoComplete="given-name"
              value={form.firstName}
              onChange={set("firstName")}
              error={errors.firstName}
            />
            <RegisterField
              id="lastName"
              label={a.lastName}
              autoComplete="family-name"
              value={form.lastName}
              onChange={set("lastName")}
              error={errors.lastName}
            />
          </div>
          <RegisterField
            id="email"
            label={a.email}
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            value={form.email}
            onChange={set("email")}
            error={errors.email}
          />
          <RegisterField
            id="password"
            label={a.password}
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={form.password}
            onChange={set("password")}
            error={errors.password}
          />
          <RegisterField
            id="confirm"
            label={a.confirmPassword}
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={form.confirm}
            onChange={set("confirm")}
            error={errors.confirm}
          />

          <div>
            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => {
                  setAgreed(e.target.checked)
                  setErrors((p) => {
                    const n = { ...p }
                    delete n.terms
                    return n
                  })
                }}
                className="mt-0.5 rounded border-border accent-primary"
              />
              <span className="text-sm text-muted-foreground">
                {a.agree}{" "}
                <Link to="/terms" className="text-primary hover:underline">
                  {a.termsLink}
                </Link>{" "}
                {a.andThe}{" "}
                <Link
                  to="/privacy"
                  className="text-primary hover:underline"
                >
                  {a.privacyLink}
                </Link>
              </span>
            </label>
            {errors.terms && (
              <p className="text-xs text-red-500 mt-1" role="alert">
                {errors.terms}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-3 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 mt-1 flex items-center justify-center gap-2"
          >
            {loading && (
              <span className="inline-block w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
            )}
            {a.registerBtn}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {a.hasAccount}{" "}
          <Link
            to="/login"
            className="text-primary font-semibold hover:underline"
          >
            {a.loginLink}
          </Link>
        </p>
      </div>
    </div>
  )
}
