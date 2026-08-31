import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";

const hcpScript = new URL("../../.github/scripts/configure-hcp-production.mjs", import.meta.url);
const smokeScript = new URL("../scripts/smoke-production.mjs", import.meta.url);

function restoreEnvironment(context: TestContext, values: Record<string, string | undefined>) {
  const originals = Object.fromEntries(Object.keys(values).map((key) => [key, process.env[key]]));
  Object.assign(process.env, values);
  context.after(() => {
    for (const [key, value] of Object.entries(originals)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
}

test("HCP setup creates the provider token as a sensitive remote workspace env variable", async (t) => {
  restoreEnvironment(t, {
    TF_CLOUD_ORGANIZATION: "real-production-org",
    HCP_TERRAFORM_TOKEN: "hcp-token",
    CLOUDFLARE_PROVIDER_TOKEN: "cloudflare-provider-token",
  });

  const requests: Array<{ url: string; init?: RequestInit }> = [];
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    requests.push({ url, init });
    if (url.endsWith("/organizations/real-production-org/workspaces/eikon-mind-production")) {
      return Response.json({
        data: { id: "workspace-1", attributes: { "execution-mode": "remote" } },
      });
    }
    if (url.endsWith("/workspaces/workspace-1/vars") && !init?.method) {
      return Response.json({ data: [], links: { next: null } });
    }
    if (url.endsWith("/workspaces/workspace-1/vars") && init?.method === "POST") {
      return Response.json({ data: { id: "var-1" } }, { status: 201 });
    }
    return new Response(null, { status: 404 });
  });

  await import(`${hcpScript.href}?case=create`);

  assert.equal(requests.length, 3);
  assert.equal(requests[2].init?.method, "POST");
  const requestBody = JSON.parse(String(requests[2].init?.body));
  assert.deepEqual(requestBody.data.attributes, {
    key: "CLOUDFLARE_API_TOKEN",
    value: "cloudflare-provider-token",
    description: "Cloudflare provider credential for remote production Terraform runs",
    category: "env",
    hcl: false,
    sensitive: true,
  });
});

test("production smoke checks pass against representative HTTP and Cloudflare responses", async (t) => {
  restoreEnvironment(t, { CLOUDFLARE_API_TOKEN: "deployment-token" });
  const originalArgv = process.argv;
  process.argv = [
    "node",
    "smoke-production.mjs",
    "https://production.example",
    "account-1",
    "eikon-mind-production-maintenance",
  ];
  t.after(() => {
    process.argv = originalArgv;
  });

  const visited: string[] = [];
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL) => {
    const url = String(input);
    visited.push(url);
    if (url === "https://production.example/") {
      return new Response("ok", {
        status: 200,
        headers: {
          "content-security-policy": "default-src 'self'",
          "strict-transport-security": "max-age=31536000; includeSubDomains",
          "x-content-type-options": "nosniff",
          "x-frame-options": "DENY",
          "referrer-policy": "strict-origin-when-cross-origin",
        },
      });
    }
    if (url === "https://production.example/assets/eikon-mind-mark.png") {
      return new Response(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    }
    if (url === "https://production.example/api/public-config") {
      return Response.json(
        { turnstileSitekey: "turnstile-site-key" },
        { headers: { "cache-control": "no-store" } },
      );
    }
    if (url === "https://production.example/api/auth/get-session") {
      return Response.json(null);
    }
    if (url === "https://production.example/en/client") {
      return new Response(null, {
        status: 307,
        headers: {
          location: "https://production.example/en/login?returnTo=%2Fen%2Fclient%2Fbook",
        },
      });
    }
    if (
      url ===
      "https://api.cloudflare.com/client/v4/accounts/account-1/workers/scripts/eikon-mind-production-maintenance/schedules"
    ) {
      return Response.json({
        success: true,
        result: { schedules: [{ cron: "*/15 * * * *" }] },
      });
    }
    return new Response(null, { status: 404 });
  });

  await import(`${smokeScript.href}?case=success`);

  assert.equal(visited.length, 6);
});
