import "server-only"

import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { betterAuth } from "better-auth"
import { nextCookies } from "better-auth/next-js"
import { getDb } from "@/lib/db"
import * as schema from "@/lib/db/schema"

export const getAuth = () =>
  betterAuth({
    database: drizzleAdapter(getDb(), { provider: "sqlite", schema }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      autoSignIn: true,
    },
    user: {
      additionalFields: {
        firstName: { type: "string", required: true, input: true },
        lastName: { type: "string", required: true, input: true },
        role: { type: "string", required: false, input: false, defaultValue: "client" },
      },
    },
    trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:3000"],
    plugins: [nextCookies()],
  })
