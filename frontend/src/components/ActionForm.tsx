"use client";

import { unstable_rethrow } from "next/navigation";
import { useActionState } from "react";
import type { Locale } from "@/lib/site-content";
import { getProtectedCopy } from "@/lib/protected-content";

type ActionState = { error: string };
type ServerAction = (formData: FormData) => Promise<unknown>;

export function ActionForm({
  action,
  children,
  errorMessage = "The requested action could not be completed.",
  className,
  locale,
}: {
  action: ServerAction;
  children: React.ReactNode;
  errorMessage?: string;
  className?: string;
  locale: Locale;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    async (_previous, formData) => {
      try {
        await action(formData);
        return { error: "" };
      } catch (error) {
        unstable_rethrow(error);
        return { error: errorMessage };
      }
    },
    { error: "" },
  );

  const pendingMessage = getProtectedCopy(locale).common.pending;

  return (
    <form
      action={formAction}
      className={className}
      aria-busy={pending}
      aria-live="polite"
      data-pending={pending || undefined}
      onSubmit={(event) => {
        if (pending) event.preventDefault();
      }}
    >
      <fieldset className="action-form__controls" disabled={pending}>
        {children}
      </fieldset>
      {state.error && (
        <p className="error" role="alert">
          {state.error}
        </p>
      )}
      {pending && (
        <span className="action-form__pending" role="status">
          {pendingMessage}
        </span>
      )}
    </form>
  );
}
