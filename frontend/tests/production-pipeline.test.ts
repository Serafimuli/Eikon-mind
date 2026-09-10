import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflowPath = new URL("../../.github/workflows/deploy-production.yml", import.meta.url);
const devWorkflowPath = new URL("../../.github/workflows/deploy-dev.yml", import.meta.url);
const hcpScriptPath = new URL("../../.github/scripts/configure-hcp-workspace.mjs", import.meta.url);
const smokeScriptPath = new URL("../scripts/smoke-production.mjs", import.meta.url);
const terraformPath = new URL("../../infra/terraform/env/production/main.tf", import.meta.url);
const applicationModulePath = new URL(
  "../../infra/terraform/modules/application/main.tf",
  import.meta.url,
);
const wranglerRendererPath = new URL("../scripts/render-wrangler-config.mjs", import.meta.url);

const [
  workflow,
  devWorkflow,
  hcpScript,
  smokeScript,
  terraform,
  applicationModule,
  wranglerRenderer,
] = await Promise.all([
  readFile(workflowPath, "utf8"),
  readFile(devWorkflowPath, "utf8"),
  readFile(hcpScriptPath, "utf8"),
  readFile(smokeScriptPath, "utf8"),
  readFile(terraformPath, "utf8"),
  readFile(applicationModulePath, "utf8"),
  readFile(wranglerRendererPath, "utf8"),
]);

test("production HCP organization is supplied explicitly by CI", () => {
  assert.doesNotMatch(terraform, /your-hcp-terraform-organization/);
  assert.match(terraform, /TF_CLOUD_ORGANIZATION/);
  assert.match(workflow, /TF_CLOUD_ORGANIZATION: \$\{\{ vars\.HCP_TERRAFORM_ORGANIZATION \}\}/);
});

test("application validation precedes a saved, reviewed Terraform plan", () => {
  const validation = workflow.indexOf(
    "Validate and build application before infrastructure planning",
  );
  const plan = workflow.indexOf(
    'terraform plan -input=false -out="$RUNNER_TEMP/production.tfplan"',
  );
  const reviewGate = workflow.indexOf("environment: production");
  const apply = workflow.indexOf(
    'terraform apply -input=false "$RUNNER_TEMP/production-plan/production.tfplan"',
  );

  assert.ok(validation >= 0 && validation < plan);
  assert.ok(plan < reviewGate && reviewGate < apply);
  assert.doesNotMatch(workflow, /-auto-approve/);
});

test("deployment refs are main-line SHAs or creation-restricted release tags", () => {
  const authorization = workflow.indexOf("Resolve and authorize immutable deployment ref");
  const lfsVerification = workflow.indexOf("uses: ./.github/actions/verify-lfs");

  assert.match(workflow, /merge-base --is-ancestor "\$resolved_sha" origin\/main/);
  assert.match(workflow, /refs\/tags\/release-\*/);
  assert.match(workflow, /\.target == "tag" and \.enforcement == "active"/);
  assert.match(workflow, /\.type == "creation"/);
  assert.ok(authorization >= 0 && authorization < lfsVerification);
});

test("remote HCP runs receive a sensitive Cloudflare environment variable", () => {
  assert.match(hcpScript, /executionMode !== "remote"/);
  assert.match(hcpScript, /HCP_TERRAFORM_WORKING_DIRECTORY/);
  assert.match(hcpScript, /"working-directory": workingDirectory/);
  assert.match(hcpScript, /key: variableKey/);
  assert.match(hcpScript, /category: "env"/);
  assert.match(hcpScript, /sensitive: true/);
});

test("pnpm is available before setup-node enables pnpm caching", () => {
  for (const pipeline of [workflow, devWorkflow]) {
    let start = 0;
    while (true) {
      const setupNode = pipeline.indexOf("uses: actions/setup-node", start);
      if (setupNode === -1) break;

      const previousPnpmSetup = pipeline.lastIndexOf("uses: pnpm/action-setup", setupNode);
      assert.ok(previousPnpmSetup >= start && previousPnpmSetup < setupNode);
      start = setupNode + 1;
    }
  }
});

test("development bootstrap creates a pnpm cache directory and reports its Secrets Store ID", () => {
  const pnpmStore = devWorkflow.indexOf("Create pnpm store directory");
  const setupNode = devWorkflow.indexOf("uses: actions/setup-node", pnpmStore);

  assert.ok(pnpmStore >= 0 && pnpmStore < setupNode);
  assert.match(devWorkflow, /jq -r '\.deployment\.value\.secrets_store_id'/);
  assert.match(devWorkflow, /Secrets Store ID:/);
});

test("zone rate limiting stays within the Cloudflare Free plan feature set", () => {
  assert.doesNotMatch(applicationModule, /http\.request\.method/);
  assert.doesNotMatch(applicationModule, /uri\.path matches/);
  assert.match(applicationModule, /starts_with\(http\.request\.uri\.path/);
  assert.match(applicationModule, /period\s+= 10/);
  assert.match(applicationModule, /requests_per_period\s+= 10/);
  assert.match(applicationModule, /mitigation_timeout\s+= 10/);
});

test("application Worker uses workers.dev only for zone-less development", () => {
  assert.match(
    wranglerRenderer,
    /routes: \[\{ pattern: deployment\.hostname, custom_domain: true \}\]/,
  );
  assert.match(
    wranglerRenderer,
    /const usesWorkersDev = environment === "dev" && !deployment\.zone_id/,
  );
  assert.match(wranglerRenderer, /\? \{ workers_dev: true \}/);
  assert.match(wranglerRenderer, /workers_dev: false,/);
  assert.doesNotMatch(wranglerRenderer, /deployment\.hostname}\/\*/);
  assert.doesNotMatch(wranglerRenderer, /zone_id: deployment\.zone_id/);
});

test("Worker configuration uses only the hard-capped Resend Free email integration", () => {
  assert.match(wranglerRenderer, /"RESEND_API_KEY"/);
  assert.match(wranglerRenderer, /FREE_TIER_ONLY: "true"/);
  assert.doesNotMatch(wranglerRenderer, /send_email|TRANSACTIONAL_EMAIL|OPERATIONS_EMAIL/);
});

test("Worker upload precedes migration and promotion with the deploy credential", () => {
  const upload = workflow.indexOf("Upload application and maintenance Worker versions");
  const migration = workflow.indexOf("Apply backwards-compatible D1 migrations");
  const promotion = workflow.indexOf("Promote reviewed versions and deploy triggers");
  const migrationBlock = workflow.slice(migration, promotion);

  assert.ok(upload >= 0 && upload < migration && migration < promotion);
  assert.match(migrationBlock, /CLOUDFLARE_DEPLOY_API_TOKEN/);
});

test("production smoke coverage includes assets, headers, config, auth, D1, and maintenance", () => {
  for (const expected of [
    'fetchOrigin("/")',
    "/assets/eikon-mind-mark.png",
    "89504e470d0a1a0a",
    "content-security-policy",
    "strict-transport-security",
    "/api/public-config",
    "/api/auth/get-session",
    "/en/client",
    "/schedules",
    "*/15 * * * *",
  ]) {
    assert.ok(smokeScript.includes(expected), `smoke script is missing ${expected}`);
  }
  assert.match(workflow, /SELECT 1 AS healthy/);
});

test("development deployment uses the complete smoke suite and deploy credential", () => {
  assert.match(devWorkflow, /workflow_dispatch:/);
  assert.match(devWorkflow, /options: \[bootstrap, deploy\]/);
  assert.match(devWorkflow, /HCP_TERRAFORM_WORKSPACE: eikon-mind-dev/);
  assert.match(devWorkflow, /HCP_TERRAFORM_WORKING_DIRECTORY: infra\/terraform\/env\/dev/);
  assert.match(devWorkflow, /Check development Secret Store readiness/);
  assert.match(devWorkflow, /Publish bootstrap deployment details/);
  assert.match(devWorkflow, /steps\.secret_store\.outputs\.ready != 'true'/);
  assert.match(devWorkflow, /steps\.secret_store\.outputs\.ready == 'true'/);
  assert.match(devWorkflow, /name: Development application, database, and maintenance smoke tests/);
  assert.match(
    devWorkflow,
    /CLOUDFLARE_API_TOKEN: \$\{\{ secrets\.CLOUDFLARE_DEPLOY_API_TOKEN \}\}/,
  );
  assert.match(devWorkflow, /SELECT 1 AS healthy/);
  assert.match(devWorkflow, /scripts\/smoke-production\.mjs/);
  assert.match(devWorkflow, /Apply compatible D1 migrations[\s\S]*?CLOUDFLARE_DEPLOY_API_TOKEN/);
});

test("development deployment initializes Workers before using version promotions", () => {
  assert.match(devWorkflow, /Worker that does not yet exist/);
  assert.match(devWorkflow, /wrangler deploy --config "\$config" --tag "\$tag"/);
  assert.match(devWorkflow, /wrangler versions upload --config "\$config"/);
  assert.match(devWorkflow, /wrangler versions deploy --config "\$config"/);
  assert.match(devWorkflow, /wrangler triggers deploy --config "\$config"/);
});
