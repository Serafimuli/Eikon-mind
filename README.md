# Eikon Mind

Eikon Mind is a bilingual Romanian and English website and appointment platform for a psychology practice. It combines a public information site with authenticated client and staff areas, privacy-conscious scheduling, and Cloudflare-hosted operations.

The application is built with Next.js App Router, OpenNext for Cloudflare, Cloudflare D1, Better Auth, Google Calendar, Resend, and Terraform.

## What is implemented

- Public Romanian and English service, practitioner, contact, booking, legal, and blog pages.
- Email/password and Google sign-in, email verification, password reset, and account management.
- Server-enforced USER, THERAPIST, and ADMIN roles; verified clients can book, while staff access requires verified email and TOTP.
- Google Calendar as the availability authority for client booking, staff scheduling, busy blocks, confirmations, moves, cancellations, synchronization, and watch renewal.
- Localized transactional email templates, with generic appointment messages that avoid clinical content.
- Authenticated, localized PDF exports of a user's reduced account and appointment data.
- D1 data minimization, encrypted two-factor material, durable rate limiting, security events, retention jobs, and Cloudflare security headers.
- Terraform-managed D1, Secrets Store, Turnstile, and narrowly scoped zone controls; GitHub Actions deployment workflows for development and production.

## Architecture at a glance

    Browser
      -> Cloudflare Turnstile and OpenNext application Worker
         -> D1: accounts, access control, appointments, opaque Calendar metadata
         -> Secrets Store: auth, Turnstile, Resend, and Google credentials
         -> Resend: transactional delivery
         -> Google Calendar: availability and managed appointment events

    Scheduled maintenance Worker
      -> Calendar synchronization and watch renewal
      -> retention and deletion tasks

See [Architecture](docs/architecture.md) for the data flow, route boundaries, and endpoint contracts.

## Repository layout

| Path | Purpose |
| --- | --- |
| [frontend/](frontend/) | Next.js/OpenNext application, migrations, Workers, scripts, and tests |
| [frontend/drizzle/](frontend/drizzle/) | D1 migrations 0000 through 0006, including security, Calendar, email quota, visibility, and profile-image changes |
| [frontend/workers/maintenance.ts](frontend/workers/maintenance.ts) | Fifteen-minute Calendar and retention Worker |
| [infra/terraform/](infra/terraform/) | Reusable Cloudflare module and development/production Terraform roots |
| [.github/workflows/](.github/workflows/) | Pull-request validation plus development and production deployment workflows |
| [docs/](docs/) | Architecture, development, operations, and historical compliance documentation |
| [DESIGN.md](DESIGN.md) | Implemented Eikon Mind UI design and accessibility guide |

## Documentation

- [Architecture](docs/architecture.md) — application areas, security boundaries, data model, integration flow, and APIs.
- [Development](docs/development.md) — local setup, environment variables, migrations, validation, and troubleshooting.
- [Operations](docs/operations.md) — Terraform ownership, secrets, delivery workflows, retention, monitoring, rollback, and rotation.
- [Design guide](DESIGN.md) — current visual system, responsive behavior, components, and content ownership.
- [GDPR audit, 14 September 2026](docs/compliance/gdpr-audit-2026-09-14.md) — retained historical legal-review snapshot; it is not a renewed assessment.

## Quick start

Prerequisites: Node.js 22, pnpm 10, and a local development configuration. Cloudflare/Wrangler, Terraform, and Playwright are installed through the project workflow when required.

~~~powershell
cd frontend
pnpm install --frozen-lockfile
Copy-Item .dev.vars.example .dev.vars
pnpm dev
~~~

Populate only local or test credentials in .dev.vars. Do not point local development at production D1, Secrets Store, Google Calendar, or Resend resources. The supplied Turnstile test credentials are local-only and are rejected outside APP_ENV=local.

Run the standard validation set from frontend:

~~~sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm security:audit
pnpm cf:build
pnpm test:e2e
~~~

The end-to-end command applies migrations only to Wrangler's local emulator, creates only fixed test fixtures, and verifies the documented Turnstile test configuration. More detail is in [Development](docs/development.md).

## Delivery and operational boundaries

Terraform provisions Cloudflare infrastructure but never stores secret values. The Wrangler configuration renderer turns Terraform's non-secret deployment output into ignored local configuration files; it binds secret *names* from the account Secrets Store.

Development deploys from main after infrastructure is ready and required Secret Store bindings exist. Production is manually dispatched from an allowed main-line commit SHA or protected release tag, creates a saved Terraform plan, waits for protected-environment review, then applies that exact plan and deploys both Workers. The detailed sequence and recovery guidance are in [Operations](docs/operations.md).

The code implements technical safeguards, not a legal determination. D1 EU jurisdiction limits D1 storage and replicas but does not guarantee EU/EEA-only processing. Cloudflare, Resend, and Google remain separate processors or recipients that require controller review of contracts, transfers, retention, notices, and operational procedures. Do not add clinical notes, diagnoses, therapy documents, or other special-category fields without separate legal, security, retention, and access-control review.

Provider capabilities, limits, and terms change independently of this repository. Consult the current official Cloudflare, Google, Resend, and HCP Terraform documentation before an operational or production decision.
