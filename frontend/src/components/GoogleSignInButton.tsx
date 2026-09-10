"use client";

import { useState } from "react";
import { authClient, googleAuthContinuationURL } from "@/lib/auth-client";
import type { Locale } from "@/lib/site-content";

type GoogleSignInButtonProps = {
  locale: Locale;
  returnTo?: string | null;
  disabled?: boolean;
  onError?: () => void;
};

export function GoogleSignInButton({
  locale,
  returnTo,
  disabled = false,
  onError,
}: GoogleSignInButtonProps) {
  const [busy, setBusy] = useState(false);

  const continueWithGoogle = async () => {
    setBusy(true);
    try {
      const callbackURL = googleAuthContinuationURL(locale, returnTo);
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL,
        newUserCallbackURL: callbackURL,
        errorCallbackURL: `/${locale}/login?oauthError=1`,
      });
      if (result.error) onError?.();
    } catch {
      onError?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      className="button button--secondary auth-google-button"
      type="button"
      disabled={busy || disabled}
      onClick={continueWithGoogle}
    >
      <span aria-hidden="true" className="auth-google-mark">
        G
      </span>
      {busy ? "…" : locale === "ro" ? "Continuă cu Google" : "Continue with Google"}
    </button>
  );
}
