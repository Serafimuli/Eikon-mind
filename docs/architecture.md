# Architecture

Eikon Mind is a Next.js 16 App Router application deployed as an OpenNext Cloudflare Worker. The public site and authenticated experience share one application, while a separate scheduled Worker handles Calendar maintenance and data retention.

## System context

    Browser
      -> Cloudflare Turnstile
      -> OpenNext application Worker
         -> Cloudflare D1
         -> Cloudflare Secrets Store bindings
         -> Resend transactional email API
         -> Google Calendar API

    Google Calendar webhook
      -> application Worker
      -> validated sync request

    Cloudflare Cron, every 15 minutes
      -> maintenance Worker
      -> Calendar synchronization, watch renewal, retention

Terraform creates the D1 database, account Secrets Store, Turnstile widget, and optional zoned-environment controls. Wrangler builds and deploys the two Workers from generated, non-secret configurations. See [Operations](operations.md) for ownership and release details.

## Application areas

| Area           | Routes                                                                            | Purpose                                                                                                                          |
| -------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Public site    | /ro, /en, and localized public slugs                                              | Static public content, service pages, contact, booking information, legal notices, and SEO metadata.                             |
| Authentication | /[locale]/login, register, reset-password, verify-email, two-factor, and continue | Better Auth credential and Google flows, verification, password recovery, and second-factor challenges.                          |
| Client area    | /[locale]/client                                                                  | Account profile, privacy export, appointment list/detail, cancellation, rescheduling, and booking.                               |
| Staff area     | /[locale]/admin                                                                   | Appointment calendar, confirmations, moves, cancellations, busy blocks, dashboard, and administrator-only staff-role management. |
| API routes     | /api                                                                              | Better Auth, availability, booking, Calendar webhook, privacy export, and public Turnstile configuration.                        |

The root route redirects to Romanian by default and uses the eikon-locale cookie to retain an English preference. Public content and static route parameters are defined in frontend/src/lib/site-content.ts. Private copy is defined separately in frontend/src/lib/protected-content.ts.

## Identity and access control

Better Auth uses D1 through the Drizzle adapter. Credential accounts require passwords of 12 to 128 characters and use the application password implementation. Google OAuth is configured server-side.

Roles are server-controlled:

| Role      | Capabilities                                                                                                 |
| --------- | ------------------------------------------------------------------------------------------------------------ |
| USER      | Manage an account, export personal data, and—after email verification—book and manage eligible appointments. |
| THERAPIST | Use the staff Calendar after email verification and TOTP enrollment.                                         |
| ADMIN     | All therapist capabilities plus staff-role management.                                                       |

Role changes and protected routes are enforced by server components, route handlers, and server actions. Client-side navigation is a presentation layer only.

Turnstile protects the sign-up, sign-in, password-reset, and verification-resend endpoints. Two-factor authentication uses encrypted backup codes, a five-failure lockout, a ten-minute challenge cookie, and no trusted-device period. The application also uses Better Auth database rate limiting, strict same-origin behavior, secure production cookies, private no-store responses, CSP nonces, HSTS in deployed environments, frame denial, content-type protection, and restrictive referrer and permissions policies.

## Data model and privacy boundary

D1 holds only application data required for account and scheduling operations:

- Better Auth user, account, session, verification, rate-limit, and encrypted two-factor records.
- Server-owned roles, names, verified email state, and minimal security-event identifiers.
- Appointment client/therapist references, validated service category, time range, status, and timestamps.
- Opaque Google event identifiers, ETags, managed-item type, and Calendar synchronization/watch metadata.
- Email quota counters and account-deletion requests.

The application does not store appointment notes, clinical notes, diagnoses, medical history, therapy documents, or profile images. The user export excludes authentication secrets, sessions, provider tokens, security events, internal identifiers, staff data, and other clients' data.

D1 is configured with EU jurisdiction and disabled read replication. That restricts D1 storage and replicas, but does not by itself establish EU/EEA-only processing. Controller obligations and the dated audit remain in [the compliance record](compliance/gdpr-audit-2026-09-14.md).

## Scheduling and Calendar integration

Google Calendar is the availability authority. Client slot discovery queries Google FreeBusy; D1 is not used to reopen or advertise stored availability slots.

For a client booking, the application:

1. Accepts verified USER sessions only.
2. Allows one-hour weekday slots between 09:00 and 19:00 in Europe/Bucharest, at least 24 hours ahead and within 60 days.
3. Checks Google FreeBusy immediately before creation.
4. Requires one of the six service categories (Adult, Addiction, Teen, Family, Senior, or Professional Training), then creates a REQUESTED appointment and an opaque managed Google event in one coordinated workflow; it removes the D1 appointment if event publication fails.

For newly client-booked appointments, the Google Calendar event title is derived from the authenticated client's server-side account name and its description contains the localized service category. Email addresses and clinical details are not sent. The responsible controller approved this disclosure and the Romanian and English privacy notices describe it. Existing events are not backfilled: legacy `STANDARD` appointments, therapist-created appointments, and busy blocks retain generic Calendar details. Approval and moves update event timing or status without replacing its title or description. The client can see the selected category in appointment details and in the personal data export.

Staff can create confirmed appointments and busy blocks, approve pending appointments, move managed items, or cancel them. The therapist calendar displays a Monday-to-Friday time grid, defaults to 09:00–19:00, expands around events outside that range, and offers a weekend view for existing Saturday and Sunday appointments. Overlapping events receive separate lanes. The responsive view keeps management actions outside the time-positioned event cards.

Calendar changes received through a validated webhook or scheduled synchronization update the matching D1 metadata and appointment state where appropriate. Account anonymization and appointment retention delete application-managed Google events before deleting their D1 references. If Google Calendar is temporarily unavailable, cleanup remains queued in the retained records and the next maintenance run retries it.

The maintenance Worker runs every 15 minutes. It synchronizes managed Calendar events, renews the Calendar watch when needed, and performs retention tasks. The webhook validates the stored Google channel ID, resource ID, and channel token before requesting a sync.

## Transactional email

Resend is used only for transactional account, appointment, and operations email. Delivery requires FREE_TIER_ONLY=true and fails closed when the configured application quota has been exhausted. Local development validates messages but does not contact Resend.

Templates support Romanian and English. Authentication and staff-triggered appointment actions use the request locale, and client rescheduling passes that locale to its cancellation notification. When no locale context is available, including asynchronous Calendar synchronization, English is the application default. Appointment messages are intentionally generic and direct recipients back to their authenticated account rather than carrying scheduling or clinical detail.

## Existing HTTP contracts

These endpoints are implemented contracts, not a public third-party API. Their authorization and validation must remain intact.

| Endpoint                                       | Contract                                                                                                                                                                                                                                                                                                                                                    |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET /api/public-config                         | Returns the public Turnstile site key with no-store caching.                                                                                                                                                                                                                                                                                                |
| GET /api/calendar/availability?date=YYYY-MM-DD | Requires a verified USER session; returns available one-hour Calendar slots for a valid date or an unavailable/error response.                                                                                                                                                                                                                              |
| POST /api/appointments/book                    | Requires a verified USER session; accepts a strict JSON object containing an ISO timestamp with offset in startsAt, a required serviceType code (`ADULT`, `ADDICTION`, `TEEN`, `FAMILY`, `SENIOR`, or `PROFESSIONAL_TRAINING`), and an optional UUID rescheduleFromAppointmentId. Returns an appointment identifier or a safe validation/conflict response. |
| POST /api/calendar/webhook                     | Accepts only a stored Google watch channel/resource/token combination; queues synchronization and returns 204, otherwise 403.                                                                                                                                                                                                                               |
| GET /api/privacy/export?locale=ro or en        | Requires an authenticated session; returns a private, downloadable localized PDF containing the reduced export scope for that user.                                                                                                                                                                                                                         |
| /api/auth/[...all]                             | Better Auth-managed authentication endpoints. Do not bypass them with duplicate identity routes.                                                                                                                                                                                                                                                            |

## Schema evolution

The migrations in frontend/drizzle are append-only deployment history:

| Migration group   | Current purpose                                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- |
| 0000              | Original schema baseline.                                                                                        |
| 0001 through 0003 | Data minimization, role and authentication consistency, security hardening, durable limits, and security events. |
| 0004              | Client appointment visibility.                                                                                   |
| 0005              | Free-tier email quota and Google-Calendar-authoritative scheduling metadata.                                     |
| 0006              | Removal of profile-image storage.                                                                                |

Migrations must remain compatible with both uploaded Worker versions during a release. Never use a code rollback to reverse a schema or data migration.
