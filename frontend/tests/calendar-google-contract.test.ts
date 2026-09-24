import assert from "node:assert/strict";
import test from "node:test";
import {
  assertGoogleCalendarScopes,
  GOOGLE_CALENDAR_EVENTS_SCOPE,
  GOOGLE_CALENDAR_FREEBUSY_SCOPE,
  GOOGLE_CALENDAR_SCOPE,
  googleCalendarErrorDetails,
  GoogleCalendarIntegrationError,
  googleCalendarRequestError,
  parseGoogleFreeBusyResponse,
} from "../src/lib/integrations/calendar-google-contract";

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
