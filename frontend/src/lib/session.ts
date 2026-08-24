import "server-only"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"
import { getAuth } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { users } from "@/lib/db/schema"

export async function getCurrentUser() {
  const session = await getAuth().api.getSession({ headers: await headers() })
  if (!session) return null
  const [user] = await getDb().select().from(users).where(eq(users.id, session.user.id)).limit(1)
  return user ?? null
}

export async function requireUser(locale: string) {
  const user = await getCurrentUser()
  if (!user) redirect(`/${locale}/login?returnTo=/${locale}/client/book`)
  return user
}

export async function requireAdmin(locale: string) {
  const user = await requireUser(locale)
  if (user.role !== "admin") redirect(`/${locale}/client`)
  return user
}
