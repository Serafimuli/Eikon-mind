import { useState, SubmitEvent } from "react"
import { Link, useNavigate } from "react-router"
import { useApp } from "@/contexts/AppContext"
import { isValidEmail } from "./auth.utils"

export default function Login() {
  const { tr, login } = useApp()
  const a = tr.auth
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string
    password?: string
  }>({})

  const validate = () => {
    const e: typeof fieldErrors = {}
    if (!email) e.email = a.errors.required
    else if (!isValidEmail(email)) e.email = a.errors.email
    if (!password) e.password = a.errors.required
    return e
  }

  const handleSubmit = async (ev: SubmitEvent) => {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) {
      setFieldErrors(e)
      return
    }
    setLoading(true)
    setError(null)
    await new Promise((r) => setTimeout(r, 500))
    const result = login(email, password)
    setLoading(false)
    if (!result.success) {
      setError(result.error || "Error")
      return
    }
    navigate(result.user?.role === "admin" ? "/admin" : "/client")
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
            {a.login}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{a.loginSub}</p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4"
        >
          {error && (
            <div
              role="alert"
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-lg"
            >
              {error}
            </div>
          )}

          <div>
            <label className="form-label" htmlFor="email">
              {a.email}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setFieldErrors((p) => ({ ...p, email: undefined }))
              }}
              className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all ${
                fieldErrors.email
                  ? "border-red-400 focus:ring-red-300"
                  : "border-border"
              }`}
              placeholder="name@example.com"
            />
            {fieldErrors.email && (
              <p className="text-xs text-red-500 mt-1" role="alert">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label
                className="block text-sm font-medium text-foreground"
                htmlFor="password"
              >
                {a.password}
              </label>
              <button
                type="button"
                className="text-xs text-primary hover:underline"
              >
                {a.forgot}
              </button>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setFieldErrors((p) => ({ ...p, password: undefined }))
              }}
              className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all ${
                fieldErrors.password
                  ? "border-red-400 focus:ring-red-300"
                  : "border-border"
              }`}
              placeholder="••••••••"
            />
            {fieldErrors.password && (
              <p className="text-xs text-red-500 mt-1" role="alert">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="rounded border-border accent-primary"
            />
            <span className="text-sm text-muted-foreground">{a.remember}</span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-3 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 mt-1 flex items-center justify-center gap-2"
          >
            {loading && (
              <span className="inline-block w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
            )}
            {a.loginBtn}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {a.noAccount}{" "}
          <Link
            to="/register"
            className="text-primary font-semibold hover:underline"
          >
            {a.createLink}
          </Link>
        </p>

        <div className="mt-8 bg-muted rounded-xl p-4 text-xs text-muted-foreground space-y-0.5">
          <p className="font-semibold text-foreground mb-1">{a.demo}</p>
          <p>{a.demoClient}</p>
          <p>{a.demoAdmin}</p>
        </div>
      </div>
    </div>
  )
}
