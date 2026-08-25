import { NextResponse } from "next/server"
import { authDestination, isLocale } from "@/lib/auth-routing"
import { getCurrentUser } from "@/lib/session"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const locale = url.searchParams.get("locale") ?? "en"
  if (!isLocale(locale)) return NextResponse.json({ error: "Invalid locale" }, { status: 400 })

  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

  const destination = authDestination(locale, user.role, url.searchParams.get("returnTo"))
  const response = NextResponse.json({ destination })
  response.headers.set("Cache-Control", "private, no-store, max-age=0")
  response.headers.set("Vary", "Cookie")
  return response
}
