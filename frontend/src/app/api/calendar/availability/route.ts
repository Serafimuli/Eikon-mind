import { NextResponse } from "next/server";
import { availableClientSlots } from "@/lib/integrations/calendar-google";
import { getRuntimeEnv } from "@/lib/platform-env";
import { requireClient } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await requireClient("en");
  const date = new URL(request.url).searchParams.get("date") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  try {
    const slots = await availableClientSlots(getRuntimeEnv(), date);
    return NextResponse.json(
      {
        slots: slots.map((slot) => ({
          startsAt: slot.startsAt.toISOString(),
          endsAt: slot.endsAt.toISOString(),
        })),
      },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch {
    return NextResponse.json({ error: "Calendar unavailable" }, { status: 503 });
  }
}
