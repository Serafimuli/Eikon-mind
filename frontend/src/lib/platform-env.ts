import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

export type RuntimeCloudflareEnv = CloudflareEnv & { E2E_CALENDAR_MOCK?: string };

export function getRuntimeEnv(): RuntimeCloudflareEnv {
  const env = getCloudflareContext().env as CloudflareEnv;
  if (
    env.APP_ENV === "local" &&
    typeof process !== "undefined" &&
    process.env["E2E_CALENDAR_MOCK"] === "true"
  ) {
    return { ...env, E2E_CALENDAR_MOCK: "true" };
  }
  return env;
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
