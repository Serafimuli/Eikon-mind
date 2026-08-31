import assert from "node:assert/strict";

const [originValue, accountId, maintenanceWorkerName] = process.argv.slice(2);
const cloudflareToken = process.env.CLOUDFLARE_API_TOKEN?.trim();
if (!originValue || !accountId || !maintenanceWorkerName || !cloudflareToken) {
  throw new Error(
    "Usage: smoke-production.mjs <origin> <account-id> <maintenance-worker-name> with CLOUDFLARE_API_TOKEN",
  );
}

const origin = new URL(originValue).origin;

async function fetchCustomDomain(path, { attempts = 30, delayMs = 10_000 } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(`${origin}${path}`);
      if (response.status === 200) return response;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  throw new Error(`Custom Domain did not become ready after ${(attempts * delayMs) / 1000}s`, {
    cause: lastError,
  });
}

// The first request is the Custom Domain readiness check. DNS propagation and
// certificate issuance can lag behind the Worker deployment by several minutes.
const page = await fetchCustomDomain("/");
assert.equal(page.status, 200, "public page must return HTTP 200");
assert.match(page.headers.get("content-security-policy") ?? "", /default-src 'self'/);
assert.match(page.headers.get("strict-transport-security") ?? "", /max-age=31536000/);
assert.equal(page.headers.get("x-content-type-options"), "nosniff");
assert.equal(page.headers.get("x-frame-options"), "DENY");
assert.equal(page.headers.get("referrer-policy"), "strict-origin-when-cross-origin");

const asset = await fetch(`${origin}/assets/eikon-mind-mark.png`);
assert.equal(asset.status, 200, "LFS-managed image must return HTTP 200");
const signature = Buffer.from(await asset.arrayBuffer())
  .subarray(0, 8)
  .toString("hex");
assert.equal(signature, "89504e470d0a1a0a", "deployed image must have a PNG signature");

const publicConfig = await fetch(`${origin}/api/public-config`);
assert.equal(publicConfig.status, 200, "public configuration must return HTTP 200");
assert.match(publicConfig.headers.get("cache-control") ?? "", /no-store/);
const publicConfigBody = await publicConfig.json();
assert.ok(
  typeof publicConfigBody.turnstileSitekey === "string" && publicConfigBody.turnstileSitekey.length,
  "public configuration must expose a Turnstile site key",
);

const session = await fetch(`${origin}/api/auth/get-session`);
assert.equal(session.status, 200, "authentication session endpoint must return HTTP 200");
assert.equal(await session.json(), null, "anonymous session must be null");

const protectedPage = await fetch(`${origin}/en/client`, { redirect: "manual" });
assert.ok(
  [302, 303, 307, 308].includes(protectedPage.status),
  "client page must redirect anonymously",
);
const redirect = new URL(protectedPage.headers.get("location") ?? "", origin);
assert.equal(redirect.origin, origin, "authentication redirect must stay on the production origin");
assert.equal(redirect.pathname, "/en/login");
assert.equal(redirect.searchParams.get("returnTo"), "/en/client/book");

const schedules = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/workers/scripts/${encodeURIComponent(maintenanceWorkerName)}/schedules`,
  { headers: { authorization: `Bearer ${cloudflareToken}` } },
);
assert.equal(schedules.status, 200, "maintenance schedules API must return HTTP 200");
const scheduleBody = await schedules.json();
assert.equal(scheduleBody.success, true, "maintenance schedules API must report success");
assert.ok(
  scheduleBody.result?.schedules?.some(({ cron }) => cron === "*/15 * * * *"),
  "maintenance Worker must have the expected cron trigger",
);

console.log("Production HTTP, asset, auth guard, security header, and maintenance checks passed");
