import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflowPath = new URL("../../.github/workflows/deploy-production.yml", import.meta.url);
const hcpScriptPath = new URL(
  "../../.github/scripts/configure-hcp-production.mjs",
  import.meta.url,
);
const smokeScriptPath = new URL("../scripts/smoke-production.mjs", import.meta.url);
const terraformPath = new URL("../../infra/terraform/env/production/main.tf", import.meta.url);

const [workflow, hcpScript, smokeScript, terraform] = await Promise.all([
  readFile(workflowPath, "utf8"),
  readFile(hcpScriptPath, "utf8"),
  readFile(smokeScriptPath, "utf8"),
  readFile(terraformPath, "utf8"),
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
  assert.match(hcpScript, /key: variableKey/);
  assert.match(hcpScript, /category: "env"/);
  assert.match(hcpScript, /sensitive: true/);
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
