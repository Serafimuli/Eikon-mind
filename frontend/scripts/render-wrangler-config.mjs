import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const [environment, terraformOutputsPath, targetDirectory] = process.argv.slice(2);

if (!environment || !terraformOutputsPath) {
  throw new Error(
    "Usage: node scripts/render-wrangler-config.mjs <dev|production> <terraform-output.json> [target-directory]",
  );
}

const rawOutputs = JSON.parse(readFileSync(terraformOutputsPath, "utf8"));
const deployment = rawOutputs.deployment?.value ?? rawOutputs.deployment;
const required = [
  "account_id",
  "d1_database_id",
  "d1_database_name",
  "secrets_store_id",
  "turnstile_sitekey",
  "worker_name",
  "hostname",
  "zone_id",
  "email_from_address",
  "operations_mailbox",
  "retention",
];

for (const key of required) {
  if (deployment?.[key] === undefined || deployment[key] === "") {
    throw new Error(`Terraform output deployment.${key} is required`);
  }
}

if (deployment.environment !== environment) {
  throw new Error(`Expected ${environment} output, received ${deployment.environment}`);
}

const target = resolve(
  targetDirectory ?? `.wrangler/generated/${environment}`,
  "wrangler.jsonc",
);
const configDirectory = dirname(target);
// Generated configs live at frontend/.wrangler/generated/<environment>.
const root = "../../../";

const secretBindings = [
  "BETTER_AUTH_SECRETS",
  "TURNSTILE_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REFRESH_TOKEN",
  "GOOGLE_CALENDAR_ID",
].map((secret_name) => ({
  binding: secret_name,
  store_id: deployment.secrets_store_id,
  secret_name,
}));

const common = {
  account_id: deployment.account_id,
  compatibility_date: "2026-08-25",
  compatibility_flags: ["nodejs_compat"],
  d1_databases: [
    {
      binding: "DB",
      database_name: deployment.d1_database_name,
      database_id: deployment.d1_database_id,
      migrations_dir: `${root}drizzle`,
    },
  ],
  secrets_store_secrets: secretBindings,
  vars: {
    APP_ENV: environment,
    BETTER_AUTH_URL: `https://${deployment.hostname}`,
    TURNSTILE_SITEKEY: deployment.turnstile_sitekey,
    EMAIL_FROM_ADDRESS: deployment.email_from_address,
    OPERATIONS_MAILBOX: deployment.operations_mailbox,
    RETENTION_APPOINTMENT_DAYS: String(deployment.retention.appointment_days),
    RETENTION_CANCELLED_APPOINTMENT_DAYS: String(deployment.retention.cancelled_appointment_days),
    RETENTION_DEIDENTIFIED_RECORD_DAYS: String(deployment.retention.deidentified_record_days),
    RETENTION_AUDIT_EVENT_DAYS: String(deployment.retention.audit_event_days),
  },
};

const emailBindings = [
  { name: "TRANSACTIONAL_EMAIL", allowed_sender_addresses: [deployment.email_from_address] },
  {
    name: "OPERATIONS_EMAIL",
    allowed_sender_addresses: [deployment.email_from_address],
    destination_address: deployment.operations_mailbox,
  },
];

const applicationConfig = {
  $schema: `${root}node_modules/wrangler/config-schema.json`,
  ...common,
  name: deployment.worker_name,
  main: `${root}.open-next/worker.js`,
  workers_dev: false,
  routes: [{ pattern: `${deployment.hostname}/*`, zone_id: deployment.zone_id }],
  assets: { directory: `${root}.open-next/assets`, binding: "ASSETS" },
  send_email: emailBindings,
};

const maintenanceConfig = {
  $schema: `${root}node_modules/wrangler/config-schema.json`,
  ...common,
  name: `${deployment.worker_name}-maintenance`,
  main: `${root}workers/maintenance.ts`,
  workers_dev: false,
  triggers: { crons: ["*/15 * * * *"] },
  send_email: emailBindings,
};

mkdirSync(configDirectory, { recursive: true, mode: 0o700 });
writeFileSync(target, `${JSON.stringify(applicationConfig, null, 2)}\n`, { mode: 0o600 });
writeFileSync(
  resolve(configDirectory, "wrangler-maintenance.jsonc"),
  `${JSON.stringify(maintenanceConfig, null, 2)}\n`,
  { mode: 0o600 },
);

console.log(`Rendered non-secret ${environment} Wrangler configuration in ${configDirectory}`);
