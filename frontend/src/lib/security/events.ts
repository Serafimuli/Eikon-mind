import "server-only";

import { getDb } from "@/lib/db";
import { securityEvents } from "@/lib/db/schema";
import { sendOperationsEmail } from "@/lib/integrations/email";
import { defer, getRuntimeEnv } from "@/lib/platform-env";

export type SecurityEventType =
  | "AUTHENTICATION_FAILURE"
  | "AUTHENTICATION_LOCKOUT"
  | "ACCESS_DENIED"
  | "INVALID_STATE_TRANSITION"
  | "ROLE_CHANGED"
  | "ACCOUNT_DELETED"
  | "INTEGRATION_FAILED";

export type SecurityEventSeverity = "INFO" | "WARNING" | "CRITICAL";
export type SecurityEventOutcome = "SUCCESS" | "DENIED" | "FAILED";

export type SecurityEventInput = {
  eventType: SecurityEventType;
  severity: SecurityEventSeverity;
  outcome: SecurityEventOutcome;
  actorUserId?: string | null;
  subjectUserId?: string | null;
  resourceId?: string | null;
  correlationId?: string;
};

export function securityEventValues(input: SecurityEventInput) {
  return {
    id: crypto.randomUUID(),
    eventType: input.eventType,
    severity: input.severity,
    outcome: input.outcome,
    actorUserId: input.actorUserId ?? null,
    subjectUserId: input.subjectUserId ?? null,
    resourceId: input.resourceId ?? null,
    correlationId: input.correlationId ?? crypto.randomUUID(),
    createdAt: new Date(),
  } as const;
}

export async function recordSecurityEvent(input: SecurityEventInput) {
  await getDb().insert(securityEvents).values(securityEventValues(input));
}

export function alertCriticalSecurityEvent(eventType: SecurityEventType) {
  const message = `A critical ${eventType} event was recorded. Review the privacy-minimized security audit.`;
  defer(
    sendOperationsEmail(getRuntimeEnv(), `Eikon Mind security alert: ${eventType}`, message),
    "security operations email",
  );
}
