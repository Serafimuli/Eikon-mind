import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const rendererPath = new URL("../scripts/render-wrangler-config.mjs", import.meta.url);

const baseDeployment = {
  account_id: "00000000000000000000000000000000",
  d1_database_id: "00000000-0000-0000-0000-000000000000",
  d1_database_name: "eikon-mind-test",
  secrets_store_id: "00000000000000000000000000000000",
  turnstile_sitekey: "0x4AAAAAAACI",
  worker_name: "eikon-mind-test",
  hostname: "eikon-mind-test.eikon-dev.workers.dev",
  email_from_address: "onboarding@resend.dev",
  operations_mailbox: "operations@example.com",
  retention: {
    appointment_days: 30,
    cancelled_appointment_days: 14,
    deidentified_record_days: 30,
    audit_event_days: 14,
  },
};

async function render(environment: "dev" | "production", deployment: Record<string, unknown>) {
  const directory = await mkdtemp(join(tmpdir(), "eikon-mind-wrangler-"));
  const outputsPath = join(directory, "deployment.json");
  const configDirectory = join(directory, "config");

  try {
    await writeFile(outputsPath, JSON.stringify({ deployment: { value: deployment } }));
    const child = spawn(process.execPath, [
      fileURLToPath(rendererPath),
      environment,
      outputsPath,
      configDirectory,
    ]);
    const [exitCode] = await new Promise<[number | null, NodeJS.Signals | null]>(
      (resolve, reject) => {
        child.once("error", reject);
        child.once("exit", (code, signal) => resolve([code, signal]));
      },
    );
    assert.equal(exitCode, 0, "Wrangler config renderer must succeed");
    return JSON.parse(await readFile(join(configDirectory, "wrangler.jsonc"), "utf8"));
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
}

test("zone-less dev uses workers.dev and does not create a custom-domain route", async () => {
  const config = await render("dev", { ...baseDeployment, environment: "dev" });

  assert.equal(config.workers_dev, true);
  assert.equal(config.routes, undefined);
  assert.equal(config.vars.BETTER_AUTH_URL, "https://eikon-mind-test.eikon-dev.workers.dev");
});

test("zoned environments retain custom-domain routing", async () => {
  const config = await render("production", {
    ...baseDeployment,
    environment: "production",
    hostname: "app.example.com",
    zone_id: "00000000000000000000000000000000",
  });

  assert.equal(config.workers_dev, false);
  assert.deepEqual(config.routes, [{ pattern: "app.example.com", custom_domain: true }]);
});
