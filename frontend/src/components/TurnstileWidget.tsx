"use client"

import { useEffect, useId, useState } from "react"

declare global {
  interface Window {
    turnstile?: {
      render: (element: string | HTMLElement, options: { sitekey: string; callback: (token: string) => void; "expired-callback": () => void }) => string
      remove: (widgetId: string) => void
    }
  }
}

export function TurnstileWidget({ onToken }: { onToken: (token: string) => void }) {
  const domId = useId().replace(/:/g, "")
  const [sitekey, setSitekey] = useState("")

  useEffect(() => {
    let widgetId: string | undefined
    let cancelled = false
    const load = async () => {
      const response = await fetch("/api/public-config", { cache: "no-store" })
      const config = (await response.json()) as { turnstileSitekey?: string }
      if (!response.ok || !config.turnstileSitekey || cancelled) return
      setSitekey(config.turnstileSitekey)
      const render = () => {
        if (cancelled || !window.turnstile) return
        widgetId = window.turnstile.render(domId, {
          sitekey: config.turnstileSitekey!,
          callback: onToken,
          "expired-callback": () => onToken(""),
        })
      }
      if (window.turnstile) return render()
      const script = document.createElement("script")
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
      script.async = true
      script.defer = true
      script.onload = render
      document.head.append(script)
    }
    void load()
    return () => {
      cancelled = true
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId)
    }
  }, [domId, onToken])

  return <div aria-live="polite"><div id={domId}/>{!sitekey && <p className="muted">Loading verification…</p>}</div>
}
