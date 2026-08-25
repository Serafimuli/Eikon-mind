import "server-only"

import { getCloudflareContext } from "@opennextjs/cloudflare"

export function getRuntimeEnv(): CloudflareEnv {
  return getCloudflareContext().env as CloudflareEnv
}

export function defer(task: Promise<unknown>) {
  try {
    getCloudflareContext().ctx.waitUntil(task)
  } catch {
    // Local Next development has no Worker execution context. The caller has
    // already persisted the outbox job, so the scheduled worker will retry it.
  }
}
