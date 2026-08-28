import { notFound } from "next/navigation";
import { BookSlots } from "@/components/BookSlots";
import { isFutureAppointment } from "@/lib/appointment-types";
import { listOpenSlots } from "@/lib/appointments";
import { findAppointmentForClient } from "@/lib/db/repositories";
import { requireClient } from "@/lib/session";
import type { Locale } from "@/lib/site-content";

export default async function RescheduleAppointment({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>;
}) {
  const { locale, id } = await params;
  const user = await requireClient(locale);
  const appointment = await findAppointmentForClient(id, user.id);
  if (
    !appointment ||
    !["REQUESTED", "CONFIRMED"].includes(appointment.status) ||
    !isFutureAppointment(appointment.startsAt)
  ) {
    notFound();
  }

  const slots = await listOpenSlots();
  return (
    <main className="private-shell">
      <BookSlots
        locale={locale}
        slots={slots}
        verified={user.emailVerified}
        rescheduleFromAppointmentId={appointment.id}
      />
    </main>
  );
}
