"use client";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Locale } from "@/lib/site-content";

export function LogoutButton({ locale, label }: { locale: Locale; label: string }) {
  const r = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const errorMessage =
    locale === "ro"
      ? "Nu am putut încheia sesiunea. Verifică conexiunea și încearcă din nou."
      : "We could not end your session. Check your connection and try again.";

  const signOut = async () => {
    setBusy(true);
    setError("");
    try {
      const result = await authClient.signOut();
      if (result.error) {
        setError(errorMessage);
        return;
      }
      r.replace(`/${locale}`);
      r.refresh();
    } catch {
      setError(errorMessage);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="logout-action">
      <button
        className="button button--secondary button--small"
        type="button"
        onClick={() => void signOut()}
        disabled={busy}
      >
        {busy ? "…" : label}
      </button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
