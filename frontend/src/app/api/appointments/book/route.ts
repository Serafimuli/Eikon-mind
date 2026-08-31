import { NextResponse } from "next/server";
import { rescheduleAppointmentForClient } from "@/lib/appointment-transitions";
import { getAuth } from "@/lib/auth";
import { claimAvailabilitySlot } from "@/lib/appointments";
import { findUserById } from "@/lib/db/repositories";
import { getApplicationOrigin } from "@/lib/platform-env";
import { bookingRequestSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

function json(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== getApplicationOrigin()) {
    return json({ error: "Invalid request origin" }, 403);
  }
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return json({ error: "Authentication required" }, 401);
  const user = await findUserById(session.user.id);
  if (!user || user.role !== "USER" || !user.emailVerified) {
    return json({ error: "Verified user account required" }, 403);
  }

  const body = bookingRequestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return json({ error: "Invalid booking request" }, 400);
  try {
    if (body.data.rescheduleFromAppointmentId) {
      const result = await rescheduleAppointmentForClient(
        user.id,
        body.data.rescheduleFromAppointmentId,
        body.data.slotId,
      );
      if (result.originalAppointmentCancelled) {
        return json(
          {
            error: "That time is no longer available",
            originalAppointmentCancelled: true,
          },
          409,
        );
      }
      return json({ appointmentId: result.appointmentId }, 201);
    }

    const appointment = await claimAvailabilitySlot(user.id, body.data.slotId);
    return json({ appointmentId: appointment.id }, 201);
  } catch {
    // No details about users or availability are exposed to the caller.
    return json({ error: "That slot is no longer available" }, 409);
  }
}
