# Operations

This guide describes the implemented Cloudflare, Terraform, Wrangler, and GitHub Actions workflow. It does not replace controller, DPO, security, or provider-account procedures.

## Infrastructure ownership

Terraform is pinned in each environment root and manages:

- one D1 database with EU jurisdiction, disabled read replication, and destroy protection;
- one account-level Cloudflare Secrets Store with destroy protection;
- one managed Turnstile widget restricted to the configured hostname;
- for a zoned environment only, always-on HTTPS, TLS 1.2 minimum, and one narrow Free-plan-compatible sensitive-path rate-limit ruleset.

Terraform does not create or transfer zones, broadly manage DNS, configure third-party provider accounts, create secret values, or provision Resend and Google OAuth consent settings.

Development may be zone-less and run on workers.dev. Production requires an existing zone and uses a Worker Custom Domain. A Secrets Store is account-scoped, so use separate Cloudflare accounts for true development and production Secret Store isolation.

Before applying zone controls to an existing zone, import or reconcile its http_ratelimit ruleset. The managed phase is authoritative and may otherwise replace existing rules in that phase.

## Environment configuration and secrets

Terraform environment roots produce a non-secret deployment output. From frontend, render an ignored configuration only after obtaining that output:

~~~sh
node scripts/render-wrangler-config.mjs dev ../deployment.json
node scripts/render-wrangler-config.mjs production ../deployment.json
~~~

The renderer writes application and maintenance Worker configurations beneath frontend/.wrangler/generated/<environment>. It includes D1 bindings, public variables, and secret binding names, but never secret values.

Create the following application secret names in the matching account Secrets Store:

| Secret binding |
| --- |
| BETTER_AUTH_SECRETS |
| TURNSTILE_SECRET |
| RESEND_API_KEY |
| GOOGLE_CLIENT_ID |
| GOOGLE_CLIENT_SECRET |
| GOOGLE_REFRESH_TOKEN |
| GOOGLE_CALENDAR_ID |

Use Wrangler's interactive Secret Store flow or an approved operator process. Do not pass application secret values through shell history, Terraform variables, workflow inputs, committed files, or deployment artifacts. GitHub Actions holds only the separately scoped Terraform and deployment tokens required by its workflows. BETTER_AUTH_SECRETS supports versioned key rotation; retain the previous verifier key until the agreed session and two-factor transition window has elapsed.

The Google refresh token must grant offline access to both
`https://www.googleapis.com/auth/calendar.events` and
`https://www.googleapis.com/auth/calendar.freebusy`. The first scope permits the application to
manage its generic appointment events; the second permits privacy-minimized FreeBusy queries
without reading external event details. The broader
`https://www.googleapis.com/auth/calendar` scope is compatible but is not the recommended
least-privilege configuration. A refresh token issued before FreeBusy availability was introduced
must be re-authorized; refreshing an old token does not add scopes that were not originally granted.

Public configuration also requires the Terraform output for the account, D1 database, Secret Store, Turnstile site key, Worker name, hostname, email sender, operations mailbox, and retention values.

## Delivery workflows

### Pull requests

Pull request checks install locked dependencies and run formatting, linting, type checking, unit tests, dependency audit, OpenNext build, generated Worker configuration validation, Playwright, Terraform validation, dependency review, CodeQL, and security/SBOM workflows as configured in .github.

### Development

Deploy development runs on main or by manual dispatch:

1. Apply the development Terraform root through HCP Terraform.
2. Publish a short-lived non-secret bootstrap artifact if manual bootstrap was selected or required Secret Store names are missing.
3. Once all seven bindings exist, install and validate the application, build OpenNext, and render development Wrangler configuration.
4. Apply compatible remote D1 migrations.
5. Upload and promote the application and maintenance Worker versions, then deploy triggers.
6. Run D1, HTTP, asset, header, authentication-guard, public-config, and maintenance-schedule smoke checks.

The development workflow uses a workers.dev endpoint when the development zone ID is absent; it uses a custom domain when a zone is configured.

### Production

Production is manual and accepts only an allowed main-line commit SHA or an active protected refs/tags/release-* tag:

1. Check out and authorize the immutable ref.
2. Install, validate, test, audit, and build the application before Terraform planning.
3. Configure the HCP workspace credential and generate a saved Terraform plan with a one-day review artifact.
4. Obtain protected production-environment approval, then apply only that saved plan.
5. Rebuild, render production Wrangler configuration, and upload both Worker versions.
6. Apply backwards-compatible D1 migrations.
7. Promote both versions, deploy their triggers, and execute the smoke suite.

Production retention values must be positive and accompanied by a non-secret external controller/DPO approval reference. The production Terraform check enforces this input requirement.

## Scheduled maintenance and retention

The maintenance Worker has the cron expression */15 * * * *. It:

- synchronizes managed Google Calendar events and renews the Calendar watch;
- deletes expired sessions and verification records;
- removes cancelled appointments after RETENTION_CANCELLED_APPOINTMENT_DAYS;
- removes requested, confirmed, and completed appointments after RETENTION_APPOINTMENT_DAYS;
- removes unreferenced legacy availability rows after the normal appointment cutoff;
- removes stale managed Calendar references, audit events, and rate-limit records;
- deletes users with aged account-deletion requests after RETENTION_DEIDENTIFIED_RECORD_DAYS.

Retention uses strict older-than comparisons, so an item at a cutoff survives until a later execution. There is no per-record legal-hold mechanism. Any preservation requirement must be addressed by an approved operational process before relying on deletion behavior.

## Monitoring and recovery

The delivery smoke script checks the public origin, security headers, asset serving, public Turnstile configuration, anonymous authentication state, protected-route redirect behavior, D1 connectivity, and maintenance cron presence. Monitor GitHub Actions outcomes, Cloudflare Worker health, D1 errors, Calendar synchronization failures, and the privacy-minimized security-event records through approved operational tools.

For code-only rollback, select a known-good Worker version and use the Wrangler rollback command with the generated configuration. Roll the application and maintenance Workers independently when necessary. A code rollback must not be used to reverse a D1 migration or restore deleted data.

D1 recovery, including Time Travel or an encrypted export/restore process, is an incident-response action because it can overwrite current data. Follow approved controller/DPO and restoration procedures; do not place database exports in source control or ordinary CI artifacts.

## Credential rotation

For each credential:

1. Add the replacement value to the appropriate Secrets Store binding through an approved interactive process.
2. Deploy and smoke-test the affected Worker.
3. Revoke the previous credential at the relevant provider only after the replacement is confirmed.

For Google Calendar, authorize the configured Calendar account again using the same OAuth client,
request offline access and explicit consent for the `calendar.events` and `calendar.freebusy` scopes,
then replace `GOOGLE_REFRESH_TOKEN` in the matching Secrets Store. Deploy both application and
maintenance Workers and verify that the therapist week displays a known external busy interval and
that a managed appointment can still be created, moved, and cancelled. Calendar diagnostics record
only the failed operation, HTTP status, and provider reason; never place tokens, calendar IDs, event
data, or provider response descriptions in logs.

For Better Auth, add a higher unique versioned signing key while retaining the previous key, deploy and validate authentication and TOTP, wait for the agreed transition period or revoke sessions deliberately, then remove the retired key in a later release. Rotate Turnstile in Cloudflare and update TURNSTILE_SECRET immediately. Keep Terraform, deployment, and Secret Store rotation tokens separate and minimally scoped.

## Operational limits

The implementation intentionally fails closed when its free-tier email configuration or quota guard is not satisfied. Provider limits, pricing, feature eligibility, and terms are external to the repository and can change. Confirm the current official Cloudflare, Google Calendar, Resend, and HCP Terraform documentation before production changes; do not rely on historical quota figures in repository documentation.
