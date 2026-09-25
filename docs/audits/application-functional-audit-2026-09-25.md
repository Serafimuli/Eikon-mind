# Eikon Mind application functional audit

**Audit date:** 2026-09-25  
**Scope:** Public and legal pages, authentication, client, therapist, and administrator experiences in Romanian and English; visible controls, route guards, server actions, API handlers, and evidence for apparently unused code.  
**Result:** Existing automated checks passed. Public pages and administrator views were confirmed in Edge on dev. The Edge session did not provide stable client and therapist identities, so remote role workflows are marked **Not verified**; isolated local E2E fixtures provide supplemental coverage.

## Executive summary

- Public English and Romanian content, legal-page coverage, role-aware route behavior, calendar layouts, profile/privacy screens, and the fixture-based appointment journeys passed the applicable browser or unit checks.
- On the dev deployment, Edge verified the English landing page, About Me in both locales, the administrator dashboard and staff list, and calendar weekend visibility. The visible role badge and protected route behavior showed the Edge session was Administrator; attempts to visit the client area returned to the administrator area. Client and therapist dev flows therefore remain **Not verified**, not failed.
- No remote appointment-changing submission, account/security change, staff-role change, appointment deletion, or busy-block submission was made.
- One user-facing redundancy was confirmed: staff see “Appointments” and “Calendar” navigation links with the same destination. One older calendar component has no source importer and appears orphaned. Two policy helpers have no production call sites and are candidates for owner review.
- Lint, the non-incremental TypeScript check, 91 unit tests, and the isolated-fixture E2E suite passed. E2E reported 63 passed, 19 expected project-scoped skips, and 0 failures.

## Status definitions

- **Pass:** Observed working in the stated environment, or covered successfully by the stated isolated test.
- **Fail:** Reproduced defect in the stated environment.
- **Not verified:** Evidence was unavailable, the correct role/account could not be established, or an external or mutating action was intentionally not submitted.

## Feature matrix

| Feature | Status | Role / locale / route | Observed result and reproduction notes |
|---|---|---|---|
| Public landing and localized content | **Pass** | Public; EN and RO; `/en`, `/ro`, localized public routes | E2E rendered all 30 localized public pages and checked responsive layout and serious accessibility issues. Edge loaded `/en`; About Me loaded at `/en/despre-mine` and `/ro/despre-mine` after switching locale. |
| About Me and locale switch | **Pass** | Public; EN → RO; `/en/despre-mine`, `/ro/despre-mine` | Edge showed the expected localized heading after each navigation. |
| Legal notices and cookie/privacy content | **Pass** | Public; EN and RO; localized legal pages | Local E2E checked required English legal notice content, both-language cookie details on mobile, and that the local runtime uses the essential auth cookie and only stores a theme after a choice. Full live legal-page review was not performed. |
| Sign-in, registration, and verification UI | **Pass** for checked UI; external flows **Not verified** | Anonymous; EN and RO; localized auth routes | Local E2E checked the privacy notice before Google sign-in and Turnstile failure/retry behavior in both locales. Real Google sign-in, outbound verification/reset email delivery, and external identity-provider completion were not exercised on dev. |
| Two-factor setup and profile controls | **Pass** for screen behavior; account changes **Not verified** | Client fixture; localized client profile/two-factor routes | Local E2E checked responsive/accessibility behavior and that TOTP setup shows a QR code and per-code copy controls without exposing the provisioning URI. No real account/security change was submitted. |
| Unauthenticated and unauthorized route guards | **Pass** | Anonymous and fixture roles; EN and RO; client/admin protected routes | Local E2E checked unauthenticated redirection to localized sign-in and unauthorized-role redirection with an explanation. On dev, the Administrator session was redirected away from `/en/client/book`; this does not verify the client role. |
| Client dashboard, appointments, booking, and rescheduling | **Pass** in local fixtures; dev **Not verified** | Client fixture; primarily EN role journey; `/[locale]/client`, `/client/book`, `/client/appointments`, appointment detail/reschedule | Isolated E2E booked a disposable slot and rescheduled it to another slot. The dev Edge session resolved to Administrator, so no client dev journey was run. |
| Client cancellation/removal behavior | **Pass** in local fixture; dev **Not verified** | Client and therapist fixtures; appointment detail/calendar | The isolated role journey checked that removing a replacement hides it from the client and releases its slot, and that a cancelled appointment leaves the active therapist calendar. No deletion or cancellation was submitted on dev. |
| Therapist calendar layout and approval | **Pass** in local fixtures; dev **Not verified** | Therapist fixture; EN/RO layout states; `/[locale]/admin/appointments` | E2E checked overlapping appointments and accessible week layout across locales, themes, and widths; the assigned therapist confirmed a replacement request in the disposable appointment journey. Edge did not provide a stable therapist role. |
| Therapist-created appointment, busy-time block, and move controls | **Not verified** | Therapist; `/[locale]/admin/appointments` | These mutation paths were not submitted. The remote therapist identity was unavailable, and the plan requires busy-block inspection without submission. |
| Administrator dashboard | **Pass** | Administrator; EN; `/en/admin` | Edge displayed the administrator dashboard and upcoming appointment content. Fixture E2E checked dashboard totals and administrator context. |
| Administrator staff list and role eligibility | **Pass** for view/eligibility; role changes **Not verified** | Administrator; EN; `/en/admin/staff` | Edge loaded the staff list. Eligibility was reflected in disabled/enabled role-change controls. No role was changed. |
| Administrator calendar navigation | **Pass** for view controls | Administrator; EN; `/en/admin/appointments` | Previous/next and weekend visibility controls worked. “Show weekends” displayed a seven-day range and “Hide weekends” returned to a five-day range. No appointment was changed. |
| Administrator appointment creation and busy-block management | **Not verified** | Administrator; EN; `/en/admin/appointments` | The admin view exposed calendar navigation; source sets `canManage` only for the therapist role. No create or block submission was attempted. |
| Privacy export | **Pass** in local fixtures; dev **Not verified** | Authenticated client fixture; EN and RO; `/api/privacy/export` | E2E verified authentication is required and the response returns localized PDF attachments. No live personal-data export was requested. |

## Route, guard, action, and API map

Source review found the following application surfaces relevant to this audit:

- Public pages: localized home and CMS-style slug pages under `src/app/[locale]/(public)`; root About and Services routes redirect to localized content.
- Authentication: localized login, registration, continuation, password-reset, email-verification, and two-factor routes under `src/app/[locale]/(auth)` and adjacent auth pages.
- Client: dashboard, booking, appointment list/detail/reschedule, and profile under `src/app/[locale]/client`.
- Staff/admin: dashboard, appointments/calendar, and staff under `src/app/[locale]/admin`. The admin layout calls `requireStaff`; the client layout calls `requireUser`.
- Server actions in `src/app/[locale]/actions.ts`: staff approval, calendar move/cancel/create, busy-block creation, appointment status, own-appointment cancel/delete, staff-role change, and account-deletion request.
- API handlers: auth and auth destination, appointment booking, calendar availability and webhook, privacy export, and public config.

Local tests exercised role guards, booking/rescheduling/approval/cancellation on disposable data, privacy export authorization, calendar layout/scheduling logic, staff eligibility UI, and auth retry states. Remote dev API side effects and external service delivery were not independently verified.

## Unused or unreachable candidates

### Confirmed source-level orphan

- **P3 maintenance candidate:** `src/components/TherapistWeekCalendar.tsx` exports the older `TherapistWeekCalendar` implementation but has no importer in the application source or tests. The active `src/app/[locale]/admin/appointments/page.tsx` imports `TherapistWeekCalendarGrid` from `src/components/TherapistWeekCalendarGrid.tsx`. Confirm references and intended compatibility before removal; this audit made no code changes.

### Candidate test-only helpers

- **P3 review candidate:** `canStaffTransitionAppointment` and `STAFF_APPOINTMENT_TRANSITIONS` in `src/lib/appointment-types.ts`, and `canManageTherapist` in `src/lib/roles.ts`, have references in their defining module and security unit tests but no production call sites in the scanned source tree. They may be deliberate testable policy helpers. Confirm ownership and whether the production path enforces equivalent rules before treating them as dead code.

### Visible but redundant UI

- **P3 usability issue:** In `src/components/PrivateHeader.tsx`, administrator and therapist navigation labels “Appointments” and “Calendar” point to the same `/[locale]/admin/appointments` route. The duplicate was visible in the live administrator navigation. Remove one label or give each a distinct destination if both concepts are intended.

### Intentionally inactive/redirected elements

- Staff role-change buttons disabled for ineligible accounts were consistent with eligibility state; this is not classified as a defect.
- Root `/about` and `/services` pages redirect to localized pages; source review confirms these are intentional routes, not unreachable pages.
- The live admin calendar did not expose therapist-only management controls; source passes `canManage={staff.role === "THERAPIST"}`. No acceptance requirement established that administrators should create or move calendar items, so this is recorded as role behavior rather than a defect.

## Verification evidence and caveats

| Check | Result | Notes |
|---|---|---|
| `pnpm run lint` | **Pass** | Completed successfully. |
| TypeScript | **Pass with equivalent command** | Package `pnpm run typecheck` could not write `tsconfig.tsbuildinfo` in the read-only workspace and returned EPERM. Running `node .\node_modules\typescript\bin\tsc --noEmit --incremental false` completed successfully with no diagnostics. |
| `pnpm run test:unit` | **Pass** | 91 passed, 0 failed. |
| `pnpm run test:e2e` | **Pass** | 82 total: 63 passed, 19 skipped by desktop/mobile project scoping, 0 failed. Used the local isolated fixture and `E2E_CALENDAR_MOCK=true`; this is supplemental evidence, not a substitute for dev role checks. |
| Edge on dev | **Partial pass / role-limited** | Confirmed public EN/RO navigation and administrator dashboard/staff/calendar. The browser tabs resolved to the Administrator role; client/therapist dev scenarios are **Not verified**. Public-page console logs were empty during the checked navigation. |
| Source reachability scan | **Pass with candidates** | Scanned 99 application/workers TS/TSX files; found the single unimported calendar component above. A textual call-site scan found the two test-only policy helper candidates. |

The local E2E run also emitted a transient `TypeError: Cannot read properties of undefined (reading 'home')` at `src/app/[locale]/page.tsx:23` in the Next dev-server output. The localized public route checks passed, and this error was not observed in the Edge dev-page console. Treat it as a **P3 investigation item, not a confirmed defect**; reproduce under the local harness before changing the page.

## Recommended follow-up

1. Re-run client and therapist dev checks in Edge sessions whose displayed role badges reliably show the intended role.
2. With dedicated disposable appointments and action-time confirmation, exercise remote booking, rescheduling, therapist approval/cancellation, and any eligible staff-created appointment workflow; inspect busy-block UI without submitting it as planned.
3. Confirm the intended staff navigation and either remove the duplicate link or give Calendar a separate route.
4. Ask maintainers whether the orphan calendar component and test-only policy helpers should be removed or wired into runtime paths.
5. Investigate the local dev-server `home` TypeError if it recurs outside the successful test sweep.

