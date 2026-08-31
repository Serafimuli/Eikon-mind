import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

export function getRuntimeEnv(): CloudflareEnv {
  return getCloudflareContext().env as CloudflareEnv;
}

export function getApplicationOrigin() {
  const env = getRuntimeEnv();
  const raw = env.BETTER_AUTH_URL?.trim() || "http://localhost:3000";
  const url = new URL(raw);
  if (env.APP_ENV !== "local" && url.protocol !== "https:") {
    throw new Error("Deployed BETTER_AUTH_URL must use HTTPS");
  }
  return url.origin;
}

export function defer(task: Promise<unknown>, label = "background task") {
  const handledTask = task.catch(() => {
    console.error(`${label} failed`);
  });
  try {
    getCloudflareContext().ctx.waitUntil(handledTask);
  } catch {
    // Local Next development has no Worker execution context. The promise is
    // already running and has a sanitized rejection handler attached above.
  }
}
