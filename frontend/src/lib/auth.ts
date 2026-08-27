import "server-only";

import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { captcha, twoFactor } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { securityEmail, sendTransactionalEmail } from "@/lib/integrations/email";
import { defer, getApplicationOrigin, getRuntimeEnv } from "@/lib/platform-env";
import { sessions } from "@/lib/db/schema";
import * as schema from "@/lib/db/schema";
import { hashPassword, verifyPassword } from "@/lib/security/password";
import { recordSecurityEvent } from "@/lib/security/events";

export function parseSigningKeys(raw: string | undefined) {
  const keys = raw
    ?.split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const separator = entry.indexOf(":");
      const version = Number(entry.slice(0, separator));
      const value = entry.slice(separator + 1);
      if (!Number.isSafeInteger(version) || version < 1 || value.length < 32) {
        throw new Error(
          "BETTER_AUTH_SECRETS entries must use <positive-version>:<32+-character-key>",
        );
      }
      return { version, value };
    });

  if (!keys?.length) {
    throw new Error("BETTER_AUTH_SECRETS must provide at least one versioned key");
  }
  if (new Set(keys.map((key) => key.version)).size !== keys.length) {
    throw new Error("BETTER_AUTH_SECRETS versions must be unique");
  }
  return keys;
}

export const getAuth = () => {
  const env = getRuntimeEnv();
  const production = env.APP_ENV === "production";
  const baseURL = getApplicationOrigin();
  const usesOfficialTurnstileTestKeys =
    !production &&
    env.TURNSTILE_SITEKEY === "1x00000000000000000000AA" &&
    env.TURNSTILE_SECRET === "1x0000000000000000000000000000000AA";
  const turnstileHostnames = [
    new URL(baseURL).hostname,
    // Cloudflare's dummy Siteverify response currently reports example.com.
    // Accept it only when both documented test credentials are active locally.
    ...(usesOfficialTurnstileTestKeys ? ["example.com"] : []),
  ];

  return betterAuth({
    appName: "Eikon Mind",
    baseURL,
    secrets: parseSigningKeys(env.BETTER_AUTH_SECRETS),
    database: drizzleAdapter(getDb(), {
      provider: "sqlite",
      // Better Auth 1.7 resolves tables by its singular model names. Keep the
      // application's plural exports while mapping the adapter explicitly.
      schema: {
        user: schema.users,
        session: schema.sessions,
        account: schema.accounts,
        verification: schema.verifications,
        rateLimit: schema.rateLimit,
        twoFactor: schema.twoFactor,
      },
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      password: { hash: hashPassword, verify: verifyPassword },
      autoSignIn: true,
      requireEmailVerification: true,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        const message = securityEmail("reset", url);
        defer(
          sendTransactionalEmail(env, user.email, message.subject, message.body),
          "password reset email",
        );
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        const message = securityEmail("verify", url);
        defer(
          sendTransactionalEmail(env, user.email, message.subject, message.body),
          "verification email",
        );
      },
    },
    user: {
      additionalFields: {
        firstName: {
          type: "string",
          required: true,
          input: true,
          validator: { input: z.string().trim().min(1).max(80) },
        },
        lastName: {
          type: "string",
          required: true,
          input: true,
          validator: { input: z.string().trim().min(1).max(80) },
        },
        role: { type: "string", required: false, input: false, defaultValue: "USER" },
      },
    },
    trustedOrigins: [baseURL],
    onAPIError: {
      onError: () => {
        defer(
          recordSecurityEvent({
            eventType: "AUTHENTICATION_FAILURE",
            severity: "WARNING",
            outcome: "FAILED",
          }),
          "authentication security audit",
        );
      },
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 60,
    },
    advanced: {
      useSecureCookies: production,
      ipAddress: {
        ipAddressHeaders: ["cf-connecting-ip"],
        ipv6Subnet: 64,
      },
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "lax",
        secure: production,
      },
    },
    databaseHooks: {
      session: {
        create: {
          // Better Auth writes these optional values by default. They are not
          // needed by Eikon Mind, so clear them immediately to minimise data.
          after: async (session) => {
            if (!session) return;
            await getDb()
              .update(sessions)
              .set({ ipAddress: null, userAgent: null })
              .where(eq(sessions.id, session.id));
          },
        },
      },
    },
    plugins: [
      captcha({
        provider: "cloudflare-turnstile",
        secretKey: env.TURNSTILE_SECRET,
        endpoints: [
          "/sign-up/email",
          "/sign-in/email",
          "/request-password-reset",
          "/send-verification-email",
        ],
        allowedHostnames: turnstileHostnames,
      }),
      twoFactor({
        issuer: "Eikon Mind",
        backupCodeOptions: { storeBackupCodes: "encrypted" },
        accountLockout: { enabled: true, maxFailedAttempts: 5, durationSeconds: 900 },
        twoFactorCookieMaxAge: 600,
        trustDeviceMaxAge: 0,
      }),
      nextCookies(),
    ],
  });
};
