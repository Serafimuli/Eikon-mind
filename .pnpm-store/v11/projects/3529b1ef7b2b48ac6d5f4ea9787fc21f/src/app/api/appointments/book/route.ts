import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { getAuth } from "@/lib/auth"
import { claimAvailabilitySlot } from "@/lib/appointments"
import { getDb } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { getRuntimeEnv } from "@/lib/platform-env"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const origin = request.headers.get("origin")
  if (!origin || origin !== getRuntimeEnv().BETTER_AUTH_URL) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 })
  }
  const session = await getAuth().api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  const user = await getDb().query.users.findFirst({ where: eq(users.id, session.user.id) })
  if (!user || user.role !== "USER" || !user.emailVerified) {
    return NextResponse.json({ error: "Verified user account required" }, { status: 403 })
  }

  const body = await request.json().catch(() => null) as { slotId?: unknown } | null
  if (typeof body?.slotId !== "string") return NextResponse.json({ error: "Invalid booking request" }, { status: 400 })
  try {
    const appointment = await claimAvailabilitySlot(user.id, body.slotId)
    return NextResponse.json({ appointmentId: appointment.id }, { status: 201 })
  } catch {
    // No details about users or availability are exposed to the caller.
    return NextResponse.json({ error: "That slot is no longer available" }, { status: 409 })
  }
}
