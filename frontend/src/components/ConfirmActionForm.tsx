"use client";

import { useId, useState } from "react";
import { ActionForm } from "@/components/ActionForm";
import type { Locale } from "@/lib/site-content";
import { getProtectedCopy } from "@/lib/protected-content";

type ServerAction = (formData: FormData) => Promise<unknown>;

export function ConfirmActionForm({
  action,
  locale,
  triggerLabel,
  confirmationMessage,
  confirmLabel,
  errorMessage,
  disabled = false,
  describedBy,
  triggerClassName = "button button--secondary button--small",
  confirmClassName = "button button--danger button--small",
  className = "confirm-action",
}: {
  action: ServerAction;
  locale: Locale;
  triggerLabel: string;
  confirmationMessage: string;
  confirmLabel: string;
  errorMessage: string;
  disabled?: boolean;
  describedBy?: string;
  triggerClassName?: string;
  confirmClassName?: string;
  className?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const confirmationId = useId();
  const copy = getProtectedCopy(locale).common;

  if (!confirming) {
    return (
      <div className={className}>
        <button
          className={triggerClassName}
          type="button"
          disabled={disabled}
          aria-describedby={describedBy}
          onClick={() => setConfirming(true)}
        >
          {triggerLabel}
        </button>
      </div>
    );
  }

  return (
    <ActionForm action={action} errorMessage={errorMessage} locale={locale} className={className}>
      <p className="confirm-action__message" id={confirmationId}>
        {confirmationMessage}
      </p>
      <div className="confirm-action__buttons" aria-describedby={confirmationId}>
        <button className={confirmClassName} type="submit">
          {confirmLabel}
        </button>
        <button
          className="button button--secondary button--small"
          type="button"
          onClick={() => setConfirming(false)}
        >
          {copy.back}
        </button>
      </div>
    </ActionForm>
  );
}
