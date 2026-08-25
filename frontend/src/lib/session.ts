import "server-only"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getAuth } from "@/lib/auth"
import { findUserById } from "@/lib/db/repositories"
import { isStaff } from "@/lib/roles"

export async function getCurrentUser() {
  const session = await getAuth().api.getSession({ headers: await headers() })
  if (!session) return null
  return findUserById(session.user.id)
}

export async function requireUser(locale: string) {
  const user = await getCurrentUser()
  if (!user) redirect(`/${locale}/login?returnTo=${encodeURIComponent(`/${locale}/client/book`)}`)
  return user
}

export async function requireClient(locale: string) {
  const user = await requireUser(locale)
  if (user.role !== "USER" || !user.emailVerified) redirect(`/${locale}/client/profile`)
  return user
}

export async function requireAdmin(locale: string) {
  const user = await requireUser(locale)
  if (user.role !== "ADMIN" || !user.emailVerified || !user.twoFactorEnabled) redirect(`/${locale}/client/profile`)
  return user
}

export async function requireStaff(locale: string) {
  const user = await requireUser(locale)
  if (!isStaff(user.role) || !user.emailVerified || !user.twoFactorEnabled) redirect(`/${locale}/client/profile`)
  return user
}
