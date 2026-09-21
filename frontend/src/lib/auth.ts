import "server-only";

import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import type { DBAdapter, DBTransactionAdapter } from "@better-auth/core/db/adapter";
import type { BetterAuthOptions } from "@better-auth/core";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { captcha, twoFactor } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import {
  passwordChangedEmail,
  securityEmail,
  sendTransactionalEmail,
} from "@/lib/integrations/email";
import { emailLocaleFromContext, emailLocaleFromRequest } from "@/lib/integrations/email-locale";
import { defer, getApplicationOrigin, getRuntimeEnv } from "@/lib/platform-env";
import { sessions } from "@/lib/db/schema";
import * as schema from "@/lib/db/schema";
import { hashPassword, verifyPassword } from "@/lib/security/password";
import { recordSecurityEvent } from "@/lib/security/events";
import { resolveSecret } from "@/lib/runtime-secret";

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

function googleProfileName(value: string | undefined, fallback: string) {
  return value?.trim().slice(0, 80) || fallback;
}

function omitProfileImage<T extends Record<string, unknown>>(data: T): T {
  const withoutProfileImage = { ...data };
  delete withoutProfileImage.image;
  return withoutProfileImage as T;
}

type AuthAdapter = DBAdapter<BetterAuthOptions>;
type AuthTransactionAdapter = DBTransactionAdapter<BetterAuthOptions>;

function withoutStoredProfileImages(adapter: AuthAdapter): AuthAdapter;
function withoutStoredProfileImages(adapter: AuthTransactionAdapter): AuthTransactionAdapter;
function withoutStoredProfileImages(
  adapter: AuthAdapter | AuthTransactionAdapter,
): AuthAdapter | AuthTransactionAdapter {
  const profileImageFreeAdapter = {
    ...adapter,
    create: (input: Parameters<AuthAdapter["create"]>[0]) =>
      adapter.create({
        ...input,
        data: input.model === "user" ? omitProfileImage(input.data) : input.data,
      }),
    update: (input: Parameters<AuthAdapter["update"]>[0]) =>
      adapter.update({
        ...input,
        update: input.model === "user" ? omitProfileImage(input.update) : input.update,
      }),
    updateMany: (input: Parameters<AuthAdapter["updateMany"]>[0]) =>
      adapter.updateMany({
        ...input,
        update: input.model === "user" ? omitProfileImage(input.update) : input.update,
      }),
  };

  if (!("transaction" in adapter)) return profileImageFreeAdapter as AuthTransactionAdapter;

  return {
    ...profileImageFreeAdapter,
    transaction: <R>(callback: (transaction: AuthTransactionAdapter) => Promise<R>) =>
      adapter.transaction((transaction) => callback(withoutStoredProfileImages(transaction))),
  } as AuthAdapter;
}

export const getAuth = async () => {
  const env = getRuntimeEnv();
  const local = env.APP_ENV === "local";
  const deployed = !local;
  const baseURL = getApplicationOrigin();
  const [signingSecrets, turnstileSecret, googleClientId, googleClientSecret] = await Promise.all([
    resolveSecret(env.BETTER_AUTH_SECRETS, "BETTER_AUTH_SECRETS"),
    resolveSecret(env.TURNSTILE_SECRET, "TURNSTILE_SECRET"),
    resolveSecret(env.GOOGLE_CLIENT_ID, "GOOGLE_CLIENT_ID"),
    resolveSecret(env.GOOGLE_CLIENT_SECRET, "GOOGLE_CLIENT_SECRET"),
  ]);
  const usesOfficialTurnstileTestSitekey = env.TURNSTILE_SITEKEY === "1x00000000000000000000AA";
  const usesOfficialTurnstileTestSecret = turnstileSecret === "1x0000000000000000000000000000000AA";
  if (deployed && (usesOfficialTurnstileTestSitekey || usesOfficialTurnstileTestSecret)) {
    throw new Error("Cloudflare Turnstile test keys require APP_ENV=local");
  }
  const usesOfficialTurnstileTestKeys =
    local && usesOfficialTurnstileTestSitekey && usesOfficialTurnstileTestSecret;
  const databaseAdapter = drizzleAdapter(getDb(), {
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
  });
  const turnstileHostnames = [
    new URL(baseURL).hostname,
    // Cloudflare's dummy Siteverify response currently reports example.com.
    // Accept it only when both documented test credentials are active locally.
    ...(usesOfficialTurnstileTestKeys ? ["example.com"] : []),
  ];

  return betterAuth({
    appName: "Eikon Mind",
    baseURL,
    secrets: parseSigningKeys(signingSecrets),
    database: (options: BetterAuthOptions) => withoutStoredProfileImages(databaseAdapter(options)),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      password: { hash: hashPassword, verify: verifyPassword },
      autoSignIn: true,
      // A pending address must not prevent its owner from using their account.
      // Access to booking and staff capabilities remains guarded by the
      // server-side emailVerified checks in lib/session.ts.
      requireEmailVerification: false,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }, request) => {
        const message = securityEmail("reset", url, emailLocaleFromRequest(request));
        defer(sendTransactionalEmail(env, user.email, message), "password reset email");
      },
      resetPasswordTokenExpiresIn: 3600,
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      expiresIn: 3600,
      sendVerificationEmail: async ({ user, url }, request) => {
        const message = securityEmail("verify", url, emailLocaleFromRequest(request), user.name);
        defer(sendTransactionalEmail(env, user.email, message), "verification email");
      },
    },
    account: {
      // Social identities only require OIDC scopes, but Better Auth stores
      // provider tokens in the account row. Keep that material encrypted.
      encryptOAuthTokens: true,
    },
    socialProviders: {
      google: {
        clientId: googleClientId,
        clientSecret: googleClientSecret,
        prompt: "select_account",
        // The calendar integration uses the same OAuth client. Do not inherit
        // its grants into end-user sessions or persist them in auth accounts.
        includeGrantedScopes: false,
        mapProfileToUser: (profile) => ({
          // These fields are required by the existing user schema. Google
          // normally supplies them, but fall back safely for incomplete profiles.
          firstName: googleProfileName(profile.given_name, "Google"),
          lastName: googleProfileName(profile.family_name, "User"),
        }),
      },
    },
    user: {
      changeEmail: {
        // The default is verification-first. Do not permit a pending address
        // to replace the current one before the recipient proves control of it.
        enabled: true,
      },
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
      useSecureCookies: deployed,
      ipAddress: {
        ipAddressHeaders: ["cf-connecting-ip"],
        ipv6Subnet: 64,
      },
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "lax",
        secure: deployed,
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
      account: {
        update: {
          // Better Auth updates a credential account only after it has hashed
          // and accepted a new password. Query only the destination address;
          // the password hash and all other account material stay untouched.
          after: async (account, context) => {
            if (account.providerId !== "credential") return;
            const [recipient] = await getDb()
              .select({ email: schema.users.email })
              .from(schema.users)
              .where(eq(schema.users.id, account.userId))
              .limit(1);
            if (!recipient) return;

            defer(
              sendTransactionalEmail(
                env,
                recipient.email,
                passwordChangedEmail(emailLocaleFromContext(context)),
              ),
              "password updated email",
            );
          },
        },
      },
    },
    plugins: [
      captcha({
        provider: "cloudflare-turnstile",
        secretKey: turnstileSecret,
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
