import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
    image: text("image"),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    // This is always server-owned. Better Auth is configured with input: false.
    role: text("role", { enum: ["USER", "THERAPIST", "ADMIN"] })
      .notNull()
      .default("USER"),
    twoFactorEnabled: integer("two_factor_enabled", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [uniqueIndex("user_email_unique").on(table.email)],
);

export const sessions = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    token: text("token").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("session_token_unique").on(table.token),
    index("session_user_idx").on(table.userId),
  ],
);

export const accounts = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    issuer: text("issuer").notNull(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp_ms" }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    uniqueIndex("account_issuer_id_unique").on(table.issuer, table.accountId),
    index("account_user_idx").on(table.userId),
  ],
);

export const verifications = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }),
});

// Better Auth's distributed rate limiter. Rows are short-lived and contain a
// route/IP-derived key only; session records continue to discard IP/user-agent.
export const rateLimit = sqliteTable(
  "rateLimit",
  {
    id: text("id").primaryKey(),
    key: text("key").notNull(),
    count: integer("count").notNull(),
    lastRequest: integer("lastRequest").notNull(),
  },
  (table) => [uniqueIndex("rate_limit_key_unique").on(table.key)],
);

// One non-personal aggregate row prevents the application from exceeding the
// Resend Free daily or monthly transactional-email allowance.
export const emailQuotaUsage = sqliteTable("email_quota_usage", {
  id: text("id").primaryKey(),
  dayKey: text("day_key").notNull(),
  dayCount: integer("day_count").notNull(),
  monthKey: text("month_key").notNull(),
  monthCount: integer("month_count").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const appointments = sqliteTable(
  "appointment",
  {
    id: text("id").primaryKey(),
    // Null after a completed deletion request; no contact or health data remains.
    clientId: text("client_id").references(() => users.id, { onDelete: "set null" }),
    therapistId: text("therapist_id").references(() => users.id, { onDelete: "set null" }),
    availabilitySlotId: text("availability_slot_id").unique(),
    serviceCode: text("service_code").notNull().default("STANDARD"),
    startsAt: integer("starts_at", { mode: "timestamp_ms" }).notNull(),
    endsAt: integer("ends_at", { mode: "timestamp_ms" }).notNull(),
    status: text("status", { enum: ["REQUESTED", "CONFIRMED", "COMPLETED", "CANCELLED"] })
      .notNull()
      .default("REQUESTED"),
    cancelledAt: integer("cancelled_at", { mode: "timestamp_ms" }),
    clientHiddenAt: integer("client_hidden_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    uniqueIndex("appointment_availability_slot_unique").on(table.availabilitySlotId),
    index("appointment_client_starts_idx").on(table.clientId, table.startsAt),
    index("appointment_client_visible_idx").on(
      table.clientId,
      table.clientHiddenAt,
      table.startsAt,
    ),
    index("appointment_therapist_starts_idx").on(table.therapistId, table.startsAt),
    index("appointment_status_starts_idx").on(table.status, table.startsAt),
  ],
);

export const availabilitySlots = sqliteTable(
  "availability_slot",
  {
    id: text("id").primaryKey(),
    therapistId: text("therapist_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    startsAt: integer("starts_at", { mode: "timestamp_ms" }).notNull(),
    endsAt: integer("ends_at", { mode: "timestamp_ms" }).notNull(),
    state: text("state", { enum: ["OPEN", "RESERVED", "BLOCKED"] })
      .notNull()
      .default("OPEN"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    uniqueIndex("availability_therapist_window_unique").on(
      table.therapistId,
      table.startsAt,
      table.endsAt,
    ),
    index("availability_open_starts_idx").on(table.state, table.startsAt),
  ],
);

// Better Auth two-factor plugin schema. Secrets and backup codes are never
// selected by application code and are not emitted in logs.
export const twoFactor = sqliteTable(
  "twoFactor",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    secret: text("secret").notNull(),
    backupCodes: text("backupCodes").notNull(),
    verified: integer("verified", { mode: "boolean" }).notNull().default(true),
    failedVerificationCount: integer("failedVerificationCount").notNull().default(0),
    lockedUntil: integer("lockedUntil", { mode: "timestamp_ms" }),
  },
  (table) => [index("two_factor_user_idx").on(table.userId)],
);

export const calendarEventReferences = sqliteTable(
  "calendar_event_reference",
  {
    id: text("id").primaryKey(),
    appointmentId: text("appointment_id")
      .notNull()
      .references(() => appointments.id, { onDelete: "cascade" }),
    provider: text("provider", { enum: ["GOOGLE"] })
      .notNull()
      .default("GOOGLE"),
    eventId: text("event_id").notNull(),
    syncStatus: text("sync_status", { enum: ["PENDING", "SYNCED", "FAILED", "CANCELLED"] })
      .notNull()
      .default("PENDING"),
    lastSyncedAt: integer("last_synced_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    uniqueIndex("calendar_event_appointment_unique").on(table.appointmentId),
    uniqueIndex("calendar_event_provider_event_unique").on(table.provider, table.eventId),
  ],
);

// Minimal integration outbox: references only, no message, calendar content,
// recipient address, notes, or health information.
export const integrationJobs = sqliteTable(
  "integration_job",
  {
    id: text("id").primaryKey(),
    appointmentId: text("appointment_id")
      .notNull()
      .references(() => appointments.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["CALENDAR_UPSERT", "CALENDAR_CANCEL"] }).notNull(),
    attempts: integer("attempts").notNull().default(0),
    state: text("state", {
      enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"],
    })
      .notNull()
      .default("PENDING"),
    notBeforeAt: integer("not_before_at", { mode: "timestamp_ms" }).notNull(),
    leaseExpiresAt: integer("lease_expires_at", { mode: "timestamp_ms" }),
    processedAt: integer("processed_at", { mode: "timestamp_ms" }),
    alertedAt: integer("alerted_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("integration_jobs_pending_idx").on(table.state, table.notBeforeAt),
    uniqueIndex("integration_job_appointment_kind_unique").on(table.appointmentId, table.kind),
  ],
);

export const securityEvents = sqliteTable(
  "security_event",
  {
    id: text("id").primaryKey(),
    eventType: text("event_type", {
      enum: [
        "AUTHENTICATION_FAILURE",
        "AUTHENTICATION_LOCKOUT",
        "ACCESS_DENIED",
        "INVALID_STATE_TRANSITION",
        "ROLE_CHANGED",
        "ACCOUNT_DELETED",
        "INTEGRATION_FAILED",
      ],
    }).notNull(),
    severity: text("severity", {
      enum: ["INFO", "WARNING", "CRITICAL"],
    }).notNull(),
    outcome: text("outcome", {
      enum: ["SUCCESS", "DENIED", "FAILED"],
    }).notNull(),
    actorUserId: text("actor_user_id"),
    subjectUserId: text("subject_user_id"),
    resourceId: text("resource_id"),
    correlationId: text("correlation_id").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("security_event_created_idx").on(table.createdAt),
    index("security_event_type_created_idx").on(table.eventType, table.createdAt),
  ],
);

export const accountDeletionRequests = sqliteTable(
  "account_deletion_request",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    requestedAt: integer("requested_at", { mode: "timestamp_ms" }).notNull(),
    completedAt: integer("completed_at", { mode: "timestamp_ms" }),
  },
  (table) => [uniqueIndex("account_deletion_user_unique").on(table.userId)],
);
