# Eikon Mind on Cloudflare Workers

This repository deploys the existing Next.js App Router application with OpenNext and Wrangler. Terraform manages Cloudflare account/zone infrastructure; Wrangler builds OpenNext, applies D1 migrations, binds account-level secrets, and uploads/promotes Worker versions. No deployment has been performed by this repository.

## Architecture and security assessment

```text
Browser --HTTPS/Turnstile--> Cloudflare zone + rate-limit rules --> OpenNext Worker
                                                                  |-- D1 (EU jurisdiction, no replicas)
                                                                  |-- Secrets Store bindings
                                                                  |-- Email Sending binding
                                                                  `-- Google Calendar API (one-way, generic events)

Scheduled maintenance Worker ------------------------------------`-- D1 retention + Calendar outbox retries
```

The application stores the minimum account and scheduling data needed for an appointment: name, verified email, authentication records, role, availability time, appointment time/status, and an opaque Calendar event reference. It does **not** store appointment notes, clinical notes, medical history, diagnoses, or therapy details. Old free-text appointment notes are removed in `0001_production_security.sql`.

Controls implemented here include:

- D1 with `jurisdiction = "eu"` and disabled read replication.
- `USER`, `THERAPIST`, and `ADMIN` server-side roles; clients cannot submit roles.
- verified email, 12-character minimum passwords, reset-session revocation, Turnstile on authentication, TOTP plus backup codes before staff promotion, and account-level TOTP lockouts.
- HTTPS redirect, TLS 1.2 minimum, sensitive POST rate limiting, host-only secure Better Auth cookies in production, no-store private responses, CSP nonce, HSTS (without preload), `nosniff`, frame denial, referrer, and permissions policies.
- atomic D1 slot claim, calendar outbox/retry, recipient-validated generic email, retention/de-identification job, and no application logging of personal or health data.

Important limitations: D1 EU jurisdiction constrains D1 storage/replicas; it does not by itself constrain global Worker execution. Cloudflare Regional Services and Customer Metadata Boundary require an entitled Data Localization Suite contract and commercial/manual configuration. Email and Google are separate processors/recipients and require legal review. These measures reduce risk; they do not by themselves make the controller GDPR compliant.

## Repository layout

| Path | Purpose |
| --- | --- |
| `frontend/` | Existing Next.js/OpenNext application and D1 migrations |
| `frontend/drizzle/0001_production_security.sql` | Data-minimising schema migration |
| `frontend/workers/maintenance.ts` | Retention and Calendar-outbox scheduled Worker |
| `frontend/scripts/render-wrangler-config.mjs` | Renders ignored, non-secret Wrangler configs from Terraform outputs |
| `infra/terraform/modules/application` | Reusable Cloudflare D1/Turnstile/zone-controls module |
| `infra/terraform/env/dev` | HCP Terraform dev root and lock file |
| `infra/terraform/env/production` | HCP Terraform production root and lock file |
| `.github/workflows` | PR validation/plan, approved dev deploy, and manual production deploy |

## Terraform ownership

Terraform is pinned to `cloudflare/cloudflare` `~> 5.23.0`; the generated provider locks are committed in each environment root. It manages only:

- one D1 database per environment, protected from destroy;
- an account Secrets Store per environment account, protected from destroy;
- one managed Turnstile widget restricted to the configured hostname;
- `always_use_https`, `min_tls_version`, and an `http_ratelimit` zone ruleset for Better Auth and `/api/appointments/book` POSTs.

It does not create, transfer, or broadly modify DNS. Wrangler attaches the Worker route defined by the generated config. A Cloudflare ruleset phase is authoritative: before applying to an existing zone, import/reconcile the existing **`http_ratelimit` phase** ruleset with the Cloudflare provider and review the plan so existing rules are not removed. Other WAF phases are intentionally outside this module.

Cloudflare Secrets Store is currently limited to one store per account. Therefore true dev/production store isolation requires separate Cloudflare accounts (recommended). Do not configure both roots with the same account unless a shared store and namespacing have been formally accepted as a risk.

Cloudflare Email Sending domain onboarding, Google OAuth client consent, Data Localization Suite, HCP Terraform workspace protection, and secrets-store values are not Terraform resources in this implementation. They require Wrangler, the Cloudflare API/dashboard, GitHub Actions, or a manual operator procedure.

## First-time setup

1. Create separate Cloudflare dev and production accounts where possible, plus existing zones/hostnames. Do not move the customer zone into Terraform.
2. Create an HCP Terraform organization and protected workspaces named `eikon-mind-dev` and `eikon-mind-production`. Replace `REPLACE_WITH_HCP_TERRAFORM_ORGANIZATION` in both environment roots with that organization name. Enable state encryption, MFA/SSO, least-privilege teams, state-version retention, and mandatory production approvals.
3. Configure protected HCP workspace variables from the matching `terraform.tfvars.example`. Production retention settings must be positive, DPO-approved values; the Terraform check rejects missing/zero values.
4. Authenticate Terraform with `CLOUDFLARE_API_TOKEN` supplied only at runtime, then initialize/apply the dev root. Review every plan; D1 and Secrets Store have `prevent_destroy`.

   ```sh
   terraform -chdir=infra/terraform/env/dev init
   terraform -chdir=infra/terraform/env/dev plan
   terraform -chdir=infra/terraform/env/dev apply
   terraform -chdir=infra/terraform/env/dev output -json > deployment.json
   ```

5. Render the ignored Wrangler files from that non-secret output. Never commit `.wrangler/generated` or `deployment.json`.

   ```sh
   cd frontend
   node scripts/render-wrangler-config.mjs dev ../deployment.json
   ```

6. In Cloudflare Email Sending, manually onboard and verify the sending domain and `noreply@<domain>`. Workers Paid is required for unrestricted transactional delivery. The deployment binds `TRANSACTIONAL_EMAIL` to the approved sender only, and `OPERATIONS_EMAIL` to the approved sender and one configured operations mailbox. Application code derives customer recipients from the authenticated server-side record; it never accepts a recipient from a form.
7. Create a dedicated Google OAuth client and refresh token with only the Calendar scope/calendar needed by this application. Give it access only to a dedicated calendar. Calendar events are generic `Reserved time` events with an opaque ID and no client name, email, service, notes, or clinical data.
8. Populate the Secrets Store interactively—never use `--value` in shell history and never put values in Terraform, `.tfvars`, GitHub secrets, or Git. For each secret use Wrangler's prompt-only command:

   ```sh
   pnpm exec wrangler secrets-store secret create <STORE_ID> --name <SECRET_NAME> --scopes workers --remote
   ```

   Required names are `BETTER_AUTH_SECRETS`, `TURNSTILE_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, and `GOOGLE_CALENDAR_ID`. Use `BETTER_AUTH_SECRETS` as a versioned active value, e.g. `v1:<random-32+-character-key>`. The Turnstile widget secret is sensitive Terraform state: restrict HCP access and copy it only once into Secrets Store through the prompt.
9. Run the D1 migration and deploy through the approved workflow. After a verified user has enrolled TOTP, bootstrap exactly one first administrator:

   ```sh
   pnpm exec wrangler d1 migrations apply eikon-mind-dev --remote --config .wrangler/generated/dev/wrangler.jsonc
   node scripts/bootstrap-first-admin.mjs .wrangler/generated/dev/wrangler.jsonc <verified-totp-user-uuid>
   ```

   The command is conditional: it refuses to create a second first admin, an unverified user, or a user without TOTP. Further staff changes happen only in `/admin/staff` and require a verified, TOTP-enrolled user.

## Local development

Copy `frontend/.dev.vars.example` to an ignored `frontend/.dev.vars` and supply development/test values. Use a separate local D1 database; never connect local development to production. The app needs a real dev/test Turnstile configuration for authentication.

```sh
cd frontend
pnpm install --frozen-lockfile
pnpm cf:build
pnpm exec wrangler d1 migrations apply eikon-mind-dev --local --config wrangler.jsonc
pnpm cf:preview
```

Run `pnpm lint`, `pnpm test`, and `node node_modules/typescript/bin/tsc --noEmit` before a change. The security tests cover role isolation rules, notes removal, and the D1 conditional slot claim; CI additionally validates OpenNext and generated Wrangler configuration.

## GitHub configuration and least privilege

Keep these secrets at repository/environment scope, never in source code:

| GitHub secret/configuration | Used for | Minimum Cloudflare scope |
| --- | --- | --- |
| `TF_API_TOKEN` | HCP Terraform authentication | HCP workspace run/plan/apply only |
| `CLOUDFLARE_TERRAFORM_API_TOKEN` | Terraform plan/apply | D1 Write; Secrets Store Write; Turnstile Sites Write; Zone Settings Write; Zone WAF Write, scoped to the environment account/zone |
| `CLOUDFLARE_DEPLOY_API_TOKEN` | D1 migration and Worker versions/routes/triggers | Workers Scripts Write; D1 Write; Workers Routes Write for the target zone only |
| HCP workspace variables | account/zone/hostname/sender/retention | non-secret values only; restrict workspace read access anyway |
| Cloudflare Secrets Store | application credentials and signing material | not stored in GitHub |

Use distinct Terraform, deploy, and secrets-rotation Cloudflare tokens. The rotation operator token requires only `Secrets Store Write` (and `Turnstile Sites Write` when rotating a widget); it must not receive Workers/D1/zone permissions. Restrict all tokens to their corresponding account and zone and set expiry/review dates.

Configure GitHub `development` and `production` environments with required reviewers. The production workflow accepts a commit SHA or protected release tag, rejects `main`, serializes deployments, applies Terraform/migrations, uploads versioned Workers, promotes the reviewed tag, attaches triggers, and runs an HTTPS smoke check. A PR without protected secrets performs format/validation and reports that the remote speculative plan is skipped; trusted PRs run the dev HCP speculative plan.

## Deployment, rollback, backup, and rotation

The deployment order is: Terraform apply → render config → test/build → D1 migration → Worker version upload → version promotion/triggers → HTTPS smoke test. Migrations must remain expand/contract and backward-compatible with the deployed Worker during a rollout. Do not use a code rollback to undo a schema/data migration.

- Code rollback: identify the known-good Worker version and run `pnpm exec wrangler rollback <version-id> --config <generated-config>`. Roll back the maintenance Worker independently if necessary.
- D1 recovery: D1 Time Travel is the short operational recovery baseline (plan availability/retention depends on Cloudflare plan). A restore overwrites the target database, so it is an incident-response/DPO-approved action, not routine application rollback.
- Longer backup: export D1 deliberately, encrypt it, and store it only in approved EU-controlled storage with access logging and a documented restoration test. Example: `pnpm exec wrangler d1 export eikon-mind-production --remote --output approved-encrypted-transfer.sql`. Do not put exports in GitHub Actions artifacts unless the storage, retention, encryption, and access review are explicitly approved.
- Secret rotation: add a new Secrets Store secret value using the prompt-only command; update the binding/config only if the name changes; upload and promote a Worker version; smoke-test; revoke the former credential at Google/Cloudflare. Better Auth accepts one active signing key, so rotate it as a planned session-revocation event: deploy the new versioned active key, revoke sessions, then remove the old value from the operator's secure rotation record. Rotate Turnstile through Cloudflare and update `TURNSTILE_SECRET` immediately.

## GDPR and security checklist for the controller

Before production, a responsible human must validate and document all of the following:

- controller/processor roles, Cloudflare and Google DPAs, subprocessor list, transfer assessment, and whether Data Localization Suite is required;
- lawful basis, purpose limitation, transparency notices, cookie text, and any consent requirements with qualified legal counsel;
- a DPIA/assessment of necessity, especially because appointment data can reveal a relationship with a therapy practice;
- approved retention values, legal preservation exceptions, data-subject access/erasure/export workflow, identity verification, and deletion evidence;
- staff access approval/revocation, TOTP/backup-code custody, administrator separation, training, and periodic access review;
- incident/breach response, monitoring runbook, secure logging policy, support procedure, and restoration exercise;
- Google Calendar data minimization and OAuth consent-screen/legal review; no clinical data in Calendar or email;
- production security review of CSP compatibility, rate-limit thresholds, Turnstile hostname restrictions, email sender/domain restriction, and every Terraform plan.

Do not add clinical notes or health fields to D1 as a convenience. Any proposal to collect special-category data requires a separate legal, security, retention, and access-control review.
