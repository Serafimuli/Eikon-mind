import assert from "node:assert/strict";
import test from "node:test";
import {
  assertGoogleCalendarScopes,
  GOOGLE_CALENDAR_EVENTS_SCOPE,
  GOOGLE_CALENDAR_FREEBUSY_SCOPE,
  GOOGLE_CALENDAR_SCOPE,
  isCalendarTestMockEnabled,
  googleCalendarErrorDetails,
  GoogleCalendarIntegrationError,
  googleCalendarRequestError,
  managedGoogleEventPayload,
  parseGoogleFreeBusyResponse,
} from "../src/lib/integrations/calendar-google-contract";
import { appointmentServiceDescription } from "../src/lib/appointment-types";

test("Google Calendar authorization accepts the recommended combined scopes and broad scope", () => {
  assert.doesNotThrow(() =>
    assertGoogleCalendarScopes(`${GOOGLE_CALENDAR_EVENTS_SCOPE} ${GOOGLE_CALENDAR_FREEBUSY_SCOPE}`),
  );
  assert.doesNotThrow(() => assertGoogleCalendarScopes(GOOGLE_CALENDAR_SCOPE));
});

test("Google Calendar authorization rejects grants missing either required capability", () => {
  assert.throws(
    () => assertGoogleCalendarScopes(GOOGLE_CALENDAR_FREEBUSY_SCOPE),
    (error: unknown) =>
      error instanceof GoogleCalendarIntegrationError &&
      error.operation === "oauth-refresh" &&
      error.reason === "missing_event_write_scope",
  );
  assert.throws(
    () => assertGoogleCalendarScopes(GOOGLE_CALENDAR_EVENTS_SCOPE),
    (error: unknown) =>
      error instanceof GoogleCalendarIntegrationError &&
      error.operation === "oauth-refresh" &&
      error.reason === "missing_freebusy_scope",
  );
  assert.throws(
    () => assertGoogleCalendarScopes(undefined),
    (error: unknown) =>
      error instanceof GoogleCalendarIntegrationError && error.reason === "missing_scope",
  );
});

test("client Calendar payloads use the account name and localized service category", () => {
  const shared = {
    kind: "APPOINTMENT" as const,
    appointmentId: "appointment-id",
    startsAt: new Date("2027-03-02T08:00:00.000Z"),
    endsAt: new Date("2027-03-02T09:00:00.000Z"),
    status: "REQUESTED" as const,
    summary: "Ada Lovelace",
  };
  const english = managedGoogleEventPayload({
    ...shared,
    description: appointmentServiceDescription("ADULT", "en"),
  });
  const romanian = managedGoogleEventPayload({
    ...shared,
    description: appointmentServiceDescription("ADDICTION", "ro"),
  });

  assert.equal(english.summary, "Ada Lovelace");
  assert.equal(english.description, "Service type: Adult");
  assert.equal(romanian.summary, "Ada Lovelace");
  assert.equal(romanian.description, "Tipul serviciului: Dependență");
  assert.equal(english.visibility, "private");
  assert.equal(english.transparency, "opaque");
  assert.equal(english.extendedProperties.private.eikonMindAppointmentId, "appointment-id");
});

test("therapist-created appointments and busy blocks remain generic Calendar events", () => {
  const shared = {
    startsAt: new Date("2027-03-02T08:00:00.000Z"),
    endsAt: new Date("2027-03-02T09:00:00.000Z"),
    status: "CONFIRMED" as const,
  };
  const therapistAppointment = managedGoogleEventPayload({ ...shared, kind: "APPOINTMENT" });
  const busyBlock = managedGoogleEventPayload({
    ...shared,
    kind: "BLOCK",
    summary: "A client name that must not be used",
    description: "A client service that must not be used",
  });

  assert.equal(therapistAppointment.summary, "Reserved time");
  assert.equal("description" in therapistAppointment, false);
  assert.equal(busyBlock.summary, "Reserved time");
  assert.equal("description" in busyBlock, false);
});

test("Calendar event mocks require both local mode and the explicit E2E flag", () => {
  assert.equal(isCalendarTestMockEnabled({ APP_ENV: "local", E2E_CALENDAR_MOCK: "true" }), true);
  assert.equal(isCalendarTestMockEnabled({ APP_ENV: "local" }), false);
  assert.equal(
    isCalendarTestMockEnabled({ APP_ENV: "development", E2E_CALENDAR_MOCK: "true" }),
    false,
  );
});

test("OAuth and FreeBusy request failures expose only sanitized diagnostic fields", () => {
  const oauth = googleCalendarRequestError("oauth-refresh", 400, {
    error: "invalid_grant",
    error_description: "sensitive provider description",
    access_token: "must-not-be-logged",
  });
  const freeBusy = googleCalendarRequestError("freebusy-query", 403, {
    error: {
      message: "sensitive provider message",
      errors: [{ reason: "insufficientPermissions", message: "sensitive detail" }],
    },
  });

  assert.deepEqual(googleCalendarErrorDetails(oauth, "oauth-refresh"), {
    operation: "oauth-refresh",
    status: 400,
    reason: "invalid_grant",
  });
  assert.deepEqual(googleCalendarErrorDetails(freeBusy, "freebusy-query"), {
    operation: "freebusy-query",
    status: 403,
    reason: "insufficientPermissions",
  });
  assert.doesNotMatch(
    JSON.stringify(googleCalendarErrorDetails(oauth, "oauth-refresh")),
    /token|sensitive/,
  );
  assert.doesNotMatch(
    JSON.stringify(googleCalendarErrorDetails(freeBusy, "freebusy-query")),
    /message|sensitive/,
  );
});

test("FreeBusy parser rejects calendar-level errors returned with HTTP 200", () => {
  assert.throws(
    () =>
      parseGoogleFreeBusyResponse(
        {
          calendars: {
            "calendar@example.com": {
              errors: [{ domain: "global", reason: "notFound" }],
            },
          },
        },
        "calendar@example.com",
      ),
    (error: unknown) =>
      error instanceof GoogleCalendarIntegrationError &&
      error.operation === "freebusy-query" &&
      error.status === 200 &&
      error.reason === "notFound",
  );
});

test("FreeBusy parser returns valid intervals without exposing event details", () => {
  const intervals = parseGoogleFreeBusyResponse(
    {
      calendars: {
        "calendar@example.com": {
          busy: [
            {
              start: "2026-09-24T07:00:00.000Z",
              end: "2026-09-24T08:00:00.000Z",
            },
          ],
        },
      },
    },
    "calendar@example.com",
  );

  assert.deepEqual(intervals, [
    {
      start: new Date("2026-09-24T07:00:00.000Z"),
      end: new Date("2026-09-24T08:00:00.000Z"),
    },
  ]);
  assert.deepEqual(
    parseGoogleFreeBusyResponse(
      { calendars: { "calendar@example.com": {} } },
      "calendar@example.com",
    ),
    [],
  );
});
