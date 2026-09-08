import { appendFileSync, readFileSync } from "node:fs";

const requiredSecretNames = [
  "BETTER_AUTH_SECRETS",
  "TURNSTILE_SECRET",
  "RESEND_API_KEY",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REFRESH_TOKEN",
  "GOOGLE_CALENDAR_ID",
];

function requiredEnvironment(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

const [deploymentPath] = process.argv.slice(2);
if (!deploymentPath) {
  throw new Error("Usage: node check-dev-secret-store.mjs <deployment-output.json>");
}

const deploymentOutputs = JSON.parse(readFileSync(deploymentPath, "utf8"));
const deployment = deploymentOutputs.deployment?.value ?? deploymentOutputs.deployment;
if (!deployment?.account_id || !deployment?.secrets_store_id) {
  throw new Error("Terraform deployment output must include account_id and secrets_store_id");
}

const apiToken = requiredEnvironment("CLOUDFLARE_API_TOKEN");
const githubOutput = requiredEnvironment("GITHUB_OUTPUT");
const names = new Set();
let page = 1;
let totalPages = 1;

while (page <= totalPages) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(deployment.account_id)}/secrets_store/stores/${encodeURIComponent(deployment.secrets_store_id)}/secrets?per_page=100&page=${page}`,
    { headers: { authorization: `Bearer ${apiToken}` } },
  );
  if (!response.ok) {
    throw new Error(`Cloudflare Secrets Store list request failed with HTTP ${response.status}`);
  }

  const body = await response.json();
  if (body?.success !== true || !Array.isArray(body.result)) {
    throw new Error("Cloudflare Secrets Store list response was invalid");
  }
  for (const secret of body.result) {
    if (typeof secret?.name === "string") names.add(secret.name);
  }
  totalPages = body.result_info?.total_pages ?? 1;
  page += 1;
}

const missing = requiredSecretNames.filter((name) => !names.has(name));
const ready = missing.length === 0;
appendFileSync(githubOutput, `ready=${ready}\nmissing=${missing.join(",")}\n`);

if (ready) {
  console.log("Development Secrets Store contains every required Worker secret name");
} else {
  console.log(`Development Secrets Store is missing: ${missing.join(", ")}`);
}
