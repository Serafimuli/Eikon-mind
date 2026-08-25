import { NextResponse } from "next/server"
import { getRuntimeEnv } from "@/lib/platform-env"

export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json({ turnstileSitekey: getRuntimeEnv().TURNSTILE_SITEKEY })
}
