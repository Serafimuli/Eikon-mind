# Development

This guide covers local development of the application under frontend. Use only local or test infrastructure; do not connect a development machine to production D1, Secret Store, Calendar, or Resend resources.

## Prerequisites

- Node.js 22, matching the GitHub Actions runtime.
- pnpm 10.
- A supported local environment for the Cloudflare/Wrangler tooling installed by the workspace.
- Chromium dependencies only when running the Playwright suite.

Install dependencies from the frontend directory:

~~~sh
pnpm install --frozen-lockfile
~~~

## Local configuration

Create the ignored local configuration from the committed example:

~~~powershell
Copy-Item .dev.vars.example .dev.vars
~~~

The example contains the complete set of local binding names. Replace only values intended for development or tests.

| Group | Variables |
| --- | --- |
| Application and auth | APP_ENV, BETTER_AUTH_URL, BETTER_AUTH_SECRETS |
| Turnstile | TURNSTILE_SECRET, TURNSTILE_SITEKEY |
| Email and operations | FREE_TIER_ONLY, EMAIL_FROM_ADDRESS, OPERATIONS_MAILBOX, RESEND_API_KEY |
| Google Calendar | GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, GOOGLE_CALENDAR_ID |
| Retention | RETENTION_APPOINTMENT_DAYS, RETENTION_CANCELLED_APPOINTMENT_DAYS, RETENTION_DEIDENTIFIED_RECORD_DAYS, RETENTION_AUDIT_EVENT_DAYS |

Set APP_ENV to local. The sample Turnstile site key and secret are Cloudflare's documented always-pass test pair. They are required for the local end-to-end suite and must never be deployed. Local email rendering validates the message but does not call Resend.

Do not commit .dev.vars, generated Wrangler configuration, Terraform state, deployment output, credentials, secrets, exports, or test artifacts.

## Everyday commands

~~~sh
pnpm dev
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm security:audit
pnpm cf:build
~~~

Use pnpm cf:preview to preview an OpenNext Cloudflare build locally. The root wrangler.jsonc is a development template only; environment-specific deployment configurations are generated from Terraform output as described in [Operations](operations.md).

## Database and migrations

Apply the D1 history only to the local Wrangler emulator:

~~~sh
pnpm db:migrate:local
~~~

The migration files are ordered deployment history. Do not edit an applied migration or use a local migration command against a remote database. Create future migrations additively and keep the old and new Worker versions compatible for the duration of a release.

The current history runs from 0000_initial.sql to 0006_remove_user_profile_image.sql. The two 0005 migrations cover the email quota and Google-Calendar-authoritative scheduling changes.

The seed script is intended for local data:

~~~sh
pnpm db:seed
~~~

The first administrator bootstrap command is an operational action against a generated remote configuration, not a normal local-development step. It is documented in [Operations](operations.md).

## Tests

Unit tests exercise the security, role, schema, email, Calendar scheduling, privacy-export, worker configuration, deployment-pipeline, and retention contracts:

~~~sh
pnpm test:unit
~~~

The end-to-end suite starts from safe local state:

~~~sh
pnpm test:e2e
~~~

Before Playwright runs, its preparation script creates .dev.vars from the example if needed, verifies APP_ENV=local and the Turnstile test pair, applies migrations to local D1, and seeds fixed e2e.*@example.invalid identities. It then runs desktop and mobile browser journeys, including accessibility checks. It refuses non-local or non-test Turnstile configuration.

Run the standard release validation set when a change affects application behavior:

~~~sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm security:audit
pnpm cf:build
pnpm test:e2e
~~~

## Development constraints

- Server-only modules, database access, secrets, Calendar credentials, and email delivery code must remain server-side.
- All content-changing routes must preserve server-side session and role checks. Hiding a control in the UI is not authorization.
- Add public strings in matching Romanian and English content models. Preserve locale-aware URLs, metadata, dates, and transactional email context.
- Preserve the data-minimization boundary: do not add clinical fields or free-text appointment notes.
- Use Europe/Bucharest helpers for scheduling and test daylight-saving transitions.
- Keep calendar availability Google-authoritative. Do not reintroduce locally maintained client slot inventory.

## Next.js and OpenNext compatibility

Next.js 16 calls the successor to middleware a proxy, but the current OpenNext Cloudflare adapter requires the Edge-compatible middleware.ts entry point. The middleware owns request headers, CSP nonce generation, security headers, locale detection, and private-cache headers; server components, actions, and route handlers remain the authoritative access-control layer.

Do not rename the entry point to proxy.ts until the deployed OpenNext adapter supports that output and the Worker build, security tests, and deployment configuration have been verified together.
