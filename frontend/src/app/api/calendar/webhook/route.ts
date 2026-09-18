import { NextResponse } from "next/server";
import {
  receiveGoogleCalendarNotification,
  synchronizeGoogleCalendar,
} from "@/lib/integrations/calendar-google";
import { defer, getRuntimeEnv } from "@/lib/platform-env";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const env = getRuntimeEnv();
  if (!(await receiveGoogleCalendarNotification(env, request.headers))) {
    return new NextResponse(null, { status: 403 });
  }
  defer(synchronizeGoogleCalendar(env), "Google Calendar webhook synchronization");
  return new NextResponse(null, { status: 204 });
}
