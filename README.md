# Eikon Mind on Cloudflare Workers

This repository deploys the existing Next.js App Router application with OpenNext and Wrangler. Terraform manages Cloudflare account/zone infrastructure; Wrangler builds OpenNext, applies D1 migrations, binds account-level secrets, and uploads/promotes Worker versions. No deployment has been performed by this repository.

## Architecture and security assessment

```text
Browser --HTTPS/Turnstile--> Cloudflare Custom Domain + rate-limit rule --> OpenNext Worker
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
- versioned scrypt password hashes using a unique 128-bit salt (`N=16384`, `r=8`, `p=5`, 64-byte output), encrypted TOTP/backup-code material, and multi-key Better Auth signing-key rotation.
- HTTPS redirect, TLS 1.2 minimum, Free-plan-compatible path rate limiting for sensitive POST endpoints, host-only secure Better Auth cookies in production, no-store private responses, CSP nonce, HSTS (without preload), `nosniff`, frame denial, referrer, and permissions policies.
- atomic D1 slot claim and state transitions, leased/idempotent Calendar outbox retries, recipient-validated generic email, privacy-minimal security events, retention/de-identification jobs, and no application logging of personal or health data.
- server-rendered account security pages cover email verification, password reset, role-aware post-login routing, staff TOTP challenges, and one-time backup-code enrolment; role changes revoke existing sessions.

Important limitations: D1 EU jurisdiction constrains D1 storage/replicas; it does not by itself constrain global Worker execution. Cloudflare Regional Services and Customer Metadata Boundary require an entitled Data Localization Suite contract and commercial/manual configuration. Email and Google are separate processors/recipients and require legal review. These measures reduce risk; they do not by themselves make the controller GDPR compliant.

## Repository layout

| Path | Purpose |
| --- | --- |
| `frontend/` | Existing Next.js/OpenNext application and D1 migrations |
| `frontend/drizzle/0001_production_security.sql` through `0003_security_hardening.sql` | Data minimisation, legacy-auth consistency, durable rate limits, Better Auth 1.7 compatibility, audit events, and idempotent integration jobs |
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
- `always_use_https`, `min_tls_version`, and one Cloudflare Free-plan-compatible `http_ratelimit` zone rule for Better Auth and `/api/appointments/book` paths.

Terraform does not create, transfer, or broadly modify DNS. Wrangler attaches the application Worker as a Custom Domain, and Cloudflare creates the hostname's DNS record and certificate. The hostname must belong to the supplied active zone and must not already have a conflicting CNAME. A Cloudflare ruleset phase is authoritative: before applying to an existing zone, import/reconcile the existing **`http_ratelimit` phase** ruleset with the Cloudflare provider and review the plan so existing rules are not removed. Other WAF phases are intentionally outside this module.

The Free zone plan permits one rate-limit rule using URI paths and IP counting, with fixed 10-second counting and mitigation periods. It does not permit matching the HTTP method or using the `matches` regular-expression operator. The rule therefore counts all requests to the application's POST-only sensitive paths and blocks an IP for 10 seconds after more than 10 matching requests in 10 seconds. Better Auth's durable database rate limits and Turnstile remain the authoritative application controls.

Cloudflare Secrets Store is currently limited to one store per account. Therefore true dev/production store isolation requires separate Cloudflare accounts (recommended). Do not configure both roots with the same account unless a shared store and namespacing have been formally accepted as a risk.

Cloudflare Email Sending domain onboarding, Google OAuth client consent, Data Localization Suite, HCP Terraform workspace protection, and secrets-store values are not Terraform resources in this implementation. They require Wrangler, the Cloudflare API/dashboard, GitHub Actions, or a manual operator procedure.

## First-time setup

1. Create separate Cloudflare dev and production accounts where possible and activate the required zones. Reserve an unused hostname in each zone for the Worker Custom Domain; do not create a CNAME for it. Do not move the customer zone into Terraform.
2. Create an HCP Terraform organization and protected workspaces named `eikon-mind-dev` and `eikon-mind-production`. Set the repository variable `HCP_TERRAFORM_ORGANIZATION` to the real organization name; production supplies it through `TF_CLOUD_ORGANIZATION` instead of committing a placeholder or tenant name. Enable state encryption, MFA/SSO, least-privilege teams, state-version retention, and mandatory production approvals.
3. Configure protected HCP workspace variables from the matching `terraform.tfvars.example`. Production retention settings must be positive, controller/DPO-approved values; the Terraform check rejects missing/zero values and an empty external approval reference.
4. Store `TF_API_TOKEN` and `CLOUDFLARE_TERRAFORM_API_TOKEN` as repository secrets available to the production plan job. That job writes the Cloudflare credential to the remote `eikon-mind-production` HCP workspace as a sensitive `CLOUDFLARE_API_TOKEN` environment variable through the HCP API; the credential is not inherited from the local GitHub process. Authenticate and initialize/apply the dev root separately. Review every plan; D1 and Secrets Store have `prevent_destroy`.
5. Protect `refs/tags/release-*` with an active repository tag ruleset. Configure required reviewers on the GitHub `production` environment and require them to inspect the production plan job summary or its one-day plan artifact before approving the apply job.

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

   Required names are `BETTER_AUTH_SECRETS`, `TURNSTILE_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, and `GOOGLE_CALENDAR_ID`. Better Auth uses its native comma-separated rotation format, for example `2:<new-random-32+-character-key>,1:<previous-key>`; the highest version signs new material while retained versions continue to verify existing sessions and encrypted 2FA data. Versions must be unique positive integers. The Turnstile widget secret is sensitive Terraform state: restrict HCP access and copy it only once into Secrets Store through the prompt.
9. Run the D1 migration and deploy through the approved workflow. After a verified user has enrolled TOTP, bootstrap exactly one first administrator:

   ```sh
   pnpm exec wrangler d1 migrations apply eikon-mind-dev --remote --config .wrangler/generated/dev/wrangler.jsonc
   node scripts/bootstrap-first-admin.mjs .wrangler/generated/dev/wrangler.jsonc <verified-totp-user-uuid>
   ```

   The command is conditional: it refuses to create a second first admin, an unverified user, or a user without TOTP. Further staff changes happen only in `/admin/staff` and require a verified, TOTP-enrolled user.

## Local development

Copy `frontend/.dev.vars.example` to an ignored `frontend/.dev.vars` and supply development/test values. Use a separate local D1 database; never connect local development to production. The example contains Cloudflare's documented always-pass Turnstile test pair and must never be deployed.

```sh
cd frontend
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm security:audit
pnpm cf:build
pnpm test:e2e
```

`pnpm test:e2e` applies migrations only to Wrangler's local D1 emulator, resets only fixed `e2e.*@example.invalid` fixture identities, and runs desktop/mobile Chromium accessibility checks plus authenticated client and therapist/2FA journeys. It refuses non-local bindings or non-test Turnstile credentials. Unit tests cover salted password verification and its CPU budget, role isolation, valid state transitions, strict request parsing, Bucharest DST behavior, header injection, redirect safety, and migration policies.

Next.js 16 deprecates `middleware.ts` in favor of Node.js `proxy.ts`. OpenNext Cloudflare 1.20.2 still rejects Proxy builds, so the small header/CSP entry point remains Edge middleware until upstream support lands; authoritative authentication and authorization checks remain in Server Components, Actions, and Route Handlers.

ESLint 9.39.5 is the final 9.x release and is retained temporarily because the `eslint-plugin-import`, `eslint-plugin-jsx-a11y`, and `eslint-plugin-react` versions supplied by the current Next.js config do not yet declare ESLint 10 compatibility. Upgrade that toolchain together once those peers support ESLint 10; forcing the major today produces an unsupported, non-terminating lint run.

## GitHub configuration and least privilege

Keep these secrets at repository/environment scope, never in source code:

| GitHub secret/configuration | Used for | Minimum Cloudflare scope |
| --- | --- | --- |
| `TF_API_TOKEN` | HCP Terraform authentication | HCP workspace run/plan/apply only |
| `CLOUDFLARE_TERRAFORM_API_TOKEN` | Terraform plan/apply | D1 Write; Secrets Store Write; Turnstile Sites Write; Zone Settings Write; Zone WAF Write, scoped to the environment account/zone |
| `CLOUDFLARE_DEPLOY_API_TOKEN` | D1 migration and Worker versions/Custom Domains/triggers | Workers Scripts Write; D1 Write; Workers Routes Write for the target zone only |
| HCP workspace variables | account/zone/hostname/sender/retention | non-secret values only; restrict workspace read access anyway |
| Cloudflare Secrets Store | application credentials and signing material | not stored in GitHub |

Use distinct Terraform, deploy, and secrets-rotation Cloudflare tokens. The rotation operator token requires only `Secrets Store Write` (and `Turnstile Sites Write` when rotating a widget); it must not receive Workers/D1/zone permissions. Restrict all tokens to their corresponding account and zone and set expiry/review dates.

Configure GitHub `development` and `production` environments with required reviewers and an active tag ruleset for `refs/tags/release-*`. The production workflow accepts only a full commit SHA that is an ancestor of `main`, or a release tag covered by that active ruleset. It validates the application before generating a saved remote plan, publishes the plan for review, and lets the protected production job apply only that plan. It then uploads both Worker versions before migrating D1, promotes them, attaches triggers, and runs application, asset, header, auth guard, database, and maintenance-trigger smoke checks. All third-party actions are pinned to immutable commit SHAs; Dependabot should keep those pins current. PR checks include formatting, lint, type checking, behavioral tests, dependency audit/review, responsive Playwright journeys, Terraform validation, CodeQL, Gitleaks, and a CycloneDX SBOM artifact.

## Deployment, rollback, backup, and rotation

The production deployment order is: application validation/build → saved remote Terraform plan → human plan review/environment approval → repeatable application build → apply that saved plan → render config → Worker version upload → D1 migration → version promotion/triggers → application/database/maintenance smoke tests. Migrations must remain expand/contract and backward-compatible with both the old and uploaded Worker versions during a rollout. Do not use a code rollback to undo a schema/data migration.

- Code rollback: identify the known-good Worker version and run `pnpm exec wrangler rollback <version-id> --config <generated-config>`. Roll back the maintenance Worker independently if necessary.
- D1 recovery: D1 Time Travel is the short operational recovery baseline (plan availability/retention depends on Cloudflare plan). A restore overwrites the target database, so it is an incident-response/DPO-approved action, not routine application rollback.
- Longer backup: export D1 deliberately, encrypt it, and store it only in approved EU-controlled storage with access logging and a documented restoration test. Example: `pnpm exec wrangler d1 export eikon-mind-production --remote --output approved-encrypted-transfer.sql`. Do not put exports in GitHub Actions artifacts unless the storage, retention, encryption, and access review are explicitly approved.
- Secret rotation: add a new Secrets Store secret value using the prompt-only command; update the binding/config only if the name changes; upload and promote a Worker version; smoke-test; revoke the former credential at Google/Cloudflare. For Better Auth, prepend a new higher `version:key` while retaining the previous key, deploy and validate authentication/2FA, allow the agreed session lifetime to elapse (or deliberately revoke sessions), then remove the retired version in a later deployment. Never reuse a version number. Rotate Turnstile through Cloudflare and update `TURNSTILE_SECRET` immediately.

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

### Retention behavior requiring controller/DPO approval

The scheduled maintenance Worker applies the following strict older-than rules. A record exactly on a cutoff is retained until a later run. The production `retention_approval_reference` must point to an external approval record that covers both these rules and the configured day values; do not put names, signatures, or other personal data in Git or Terraform state.

| Data | Deletion rule |
| --- | --- |
| `CANCELLED` appointments | Delete when `updated_at < now - RETENTION_CANCELLED_APPOINTMENT_DAYS`. |
| `REQUESTED`, `CONFIRMED`, and `COMPLETED` appointments | Delete when `starts_at < now - RETENTION_APPOINTMENT_DAYS`. A forgotten past `CONFIRMED` appointment therefore cannot remain indefinitely. |
| Availability slots | Delete when `ends_at < now - RETENTION_APPOINTMENT_DAYS`, but only after no appointment references the slot. |
| Calendar references | Delete after their appointment has been deleted. |
| Completed or acknowledged-failed integration jobs | Delete after the normal appointment period, using `processed_at` or `created_at` respectively. |
| Security events | Delete when `created_at < now - RETENTION_AUDIT_EVENT_DAYS`. |
| Expired verification/session and stale rate-limit records | Delete after expiry, or after one day for rate-limit records. |
| Users with approved account-deletion requests | Delete when the request is older than `RETENTION_DEIDENTIFIED_RECORD_DAYS`; database cascades/restrictions then apply. |

Any legal preservation exception requires an approved operational hold that prevents this maintenance job from deleting the affected records; the current Worker has no per-record legal-hold flag. The controller/DPO must approve this limitation or require a hold mechanism before production rollout.
