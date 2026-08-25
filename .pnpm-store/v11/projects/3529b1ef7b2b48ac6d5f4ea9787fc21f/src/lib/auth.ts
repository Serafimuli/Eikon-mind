import "server-only"

import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { betterAuth } from "better-auth"
import { nextCookies } from "better-auth/next-js"
import { captcha, twoFactor } from "better-auth/plugins"
import { eq } from "drizzle-orm"
import { getDb } from "@/lib/db"
import { securityEmail, sendTransactionalEmail } from "@/lib/integrations/email"
import { getRuntimeEnv } from "@/lib/platform-env"
import { sessions } from "@/lib/db/schema"
import * as schema from "@/lib/db/schema"

function currentSigningKey(raw: string | undefined) {
  // Store a versioned comma-separated value such as v2:<key>,v1:<retiring-key>.
  // Better Auth accepts one active HMAC key; keep the prior version only during
  // the documented transition, then revoke all sessions before removing it.
  const first = raw?.split(",")[0]?.trim()
  const key = first?.includes(":") ? first.slice(first.indexOf(":") + 1) : first
  if (!key || key.length < 32) throw new Error("BETTER_AUTH_SECRETS must provide an active 32+ character signing key")
  return key
}

export const getAuth = () => {
  const env = getRuntimeEnv()
  const production = env.APP_ENV === "production"
  const baseURL = env.BETTER_AUTH_URL ?? "http://localhost:3000"
  if (production && !baseURL.startsWith("https://")) {
    throw new Error("Production BETTER_AUTH_URL must use HTTPS")
  }

  return betterAuth({
    secret: currentSigningKey(env.BETTER_AUTH_SECRETS),
    database: drizzleAdapter(getDb(), { provider: "sqlite", schema }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      autoSignIn: true,
      requireEmailVerification: true,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        const message = securityEmail("reset", url)
        await sendTransactionalEmail(env, user.email, message.subject, message.body)
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        const message = securityEmail("verify", url)
        await sendTransactionalEmail(env, user.email, message.subject, message.body)
      },
    },
    user: {
      additionalFields: {
        firstName: { type: "string", required: true, input: true },
        lastName: { type: "string", required: true, input: true },
        role: { type: "string", required: false, input: false, defaultValue: "USER" },
      },
    },
    trustedOrigins: [baseURL],
    advanced: {
      useSecureCookies: production,
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
            if (!session) return
            await getDb().update(sessions).set({ ipAddress: null, userAgent: null }).where(eq(sessions.id, session.id))
          },
        },
      },
    },
    plugins: [
      captcha({
        provider: "cloudflare-turnstile",
        secretKey: env.TURNSTILE_SECRET,
        endpoints: ["/sign-up/email", "/sign-in/email", "/request-password-reset"],
        allowedHostnames: [new URL(baseURL).hostname],
      }),
      twoFactor({
        issuer: "Eikon Mind",
        accountLockout: { enabled: true, maxFailedAttempts: 5, durationSeconds: 900 },
        trustDeviceMaxAge: 0,
      }),
      nextCookies(),
    ],
  })
}
