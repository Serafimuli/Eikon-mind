import "server-only"

import { getCloudflareContext } from "@opennextjs/cloudflare"

export function getRuntimeEnv(): CloudflareEnv {
  return getCloudflareContext().env as CloudflareEnv
}

export function getApplicationOrigin() {
  const env = getRuntimeEnv()
  const raw = env.BETTER_AUTH_URL?.trim() || "http://localhost:3000"
  const url = new URL(raw)
  if (env.APP_ENV === "production" && url.protocol !== "https:") {
    throw new Error("Production BETTER_AUTH_URL must use HTTPS")
  }
  return url.origin
}

export function defer(task: Promise<unknown>) {
  try {
    getCloudflareContext().ctx.waitUntil(task)
  } catch {
    // Local Next development has no Worker execution context. The caller has
    // already persisted the outbox job, so the scheduled worker will retry it.
  }
}
