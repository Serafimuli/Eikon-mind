"use client"

import { useActionState } from "react"

type ActionState = { error: string }
type ServerAction = (formData: FormData) => Promise<unknown>

export function ActionForm({
  action,
  children,
  errorMessage = "The requested action could not be completed.",
  className,
}: {
  action: ServerAction
  children: React.ReactNode
  errorMessage?: string
  className?: string
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    async (_previous, formData) => {
      try {
        await action(formData)
        return { error: "" }
      } catch {
        return { error: errorMessage }
      }
    },
    { error: "" },
  )

  return (
    <form action={formAction} className={className} aria-live="polite">
      {children}
      {state.error && (
        <p className="error" role="alert">
          {state.error}
        </p>
      )}
      {pending && (
        <span className="muted" aria-live="polite">
          Working…
        </span>
      )}
    </form>
  )
}
