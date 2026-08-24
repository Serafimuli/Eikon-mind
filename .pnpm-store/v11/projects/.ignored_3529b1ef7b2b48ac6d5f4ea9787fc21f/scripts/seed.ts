export {}
/**
 * Seeds a running local OpenNext Worker. The development-only endpoint uses
 * Better Auth itself, so demo passwords are hashed by the configured provider.
 */
const base = process.env.SEED_URL ?? "http://127.0.0.1:8787"
const response = await fetch(`${base}/api/dev/seed`, { method: "POST" })
if (!response.ok) throw new Error(`Seed failed (${response.status}): ${await response.text()}`)
console.log(await response.text())
