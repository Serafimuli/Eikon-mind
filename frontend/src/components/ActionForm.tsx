"use client";

import { unstable_rethrow } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
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
  preserveValuesOnError = false,
}: {
  action: ServerAction;
  children: React.ReactNode;
  errorMessage?: string;
  className?: string;
  locale: Locale;
  preserveValuesOnError?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const submittedValues = useRef<Map<string, string[]> | null>(null);
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

  useEffect(() => {
    if (pending || !preserveValuesOnError) return;
    if (!state.error) {
      submittedValues.current = null;
      return;
    }

    const form = formRef.current;
    if (!form || !submittedValues.current) return;
    for (const [name, values] of submittedValues.current) {
      const field = form.elements.namedItem(name);
      const value = values[0] ?? "";
      if (
        field instanceof HTMLInputElement ||
        field instanceof HTMLSelectElement ||
        field instanceof HTMLTextAreaElement
      ) {
        field.value = value;
      }
    }
  }, [pending, preserveValuesOnError, state]);

  const pendingMessage = getProtectedCopy(locale).common.pending;

  return (
    <form
      ref={formRef}
      action={formAction}
      className={className}
      aria-busy={pending}
      aria-live="polite"
      data-pending={pending || undefined}
      onSubmit={(event) => {
        if (pending) {
          event.preventDefault();
          return;
        }
        if (preserveValuesOnError) {
          const values = new Map<string, string[]>();
          for (const [name, value] of new FormData(event.currentTarget).entries()) {
            if (typeof value !== "string") continue;
            values.set(name, [...(values.get(name) ?? []), value]);
          }
          submittedValues.current = values;
        }
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
