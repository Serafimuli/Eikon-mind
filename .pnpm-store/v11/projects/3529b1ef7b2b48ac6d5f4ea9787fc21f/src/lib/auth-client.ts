"use client"

import { createAuthClient } from "better-auth/react"
import { twoFactorClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({ plugins: [twoFactorClient()] })

export async function resolveAuthDestination(locale: string, returnTo?: string | null) {
  const query = new URLSearchParams({ locale })
  if (returnTo) query.set("returnTo", returnTo)
  const response = await fetch(`/api/auth/destination?${query.toString()}`, { cache: "no-store" })
  if (!response.ok) throw new Error("Could not resolve the account destination")
  const body = (await response.json()) as { destination?: string }
  if (!body.destination || !body.destination.startsWith(`/${locale}/`)) throw new Error("Invalid account destination")
  return body.destination
}
