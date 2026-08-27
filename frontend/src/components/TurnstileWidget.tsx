"use client";

import { useEffect, useRef, useState } from "react";

type TurnstileApi = {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
      "timeout-callback": () => void;
    },
  ) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let turnstileScript: Promise<TurnstileApi> | undefined;

function loadTurnstileScript() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (turnstileScript) return turnstileScript;

  turnstileScript = new Promise<TurnstileApi>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-eikon-turnstile]");
    const script = existing ?? document.createElement("script");

    const loaded = () => {
      if (window.turnstile) resolve(window.turnstile);
      else reject(new Error("Turnstile did not initialize"));
    };
    const failed = () => reject(new Error("Turnstile could not be loaded"));

    script.addEventListener("load", loaded, { once: true });
    script.addEventListener("error", failed, { once: true });
    if (!existing) {
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.dataset.eikonTurnstile = "true";
      document.head.append(script);
    }
  }).catch((error) => {
    turnstileScript = undefined;
    throw error;
  });

  return turnstileScript;
}

export function TurnstileWidget({ onToken }: { onToken: (token: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let widgetId: string | undefined;
    let cancelled = false;

    const fail = () => {
      if (cancelled) return;
      onToken("");
      setStatus("error");
    };

    const load = async () => {
      try {
        const [response, turnstile] = await Promise.all([
          fetch("/api/public-config", { cache: "no-store" }),
          loadTurnstileScript(),
        ]);
        const config = (await response.json()) as { turnstileSitekey?: string };
        if (cancelled || !response.ok || !config.turnstileSitekey || !containerRef.current) {
          fail();
          return;
        }

        widgetId = turnstile.render(containerRef.current, {
          sitekey: config.turnstileSitekey,
          callback: (token) => {
            if (cancelled) return;
            setStatus("ready");
            onToken(token);
          },
          "expired-callback": fail,
          "error-callback": fail,
          "timeout-callback": fail,
        });
      } catch {
        fail();
      }
    };

    void load();
    return () => {
      cancelled = true;
      onToken("");
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [onToken]);

  return (
    <div aria-live="polite">
      <div ref={containerRef} />
      {status === "loading" && <p className="muted">Loading verification…</p>}
      {status === "error" && (
        <p className="error" role="alert">
          Verification could not be loaded. Refresh the page and try again.
        </p>
      )}
    </div>
  );
}
