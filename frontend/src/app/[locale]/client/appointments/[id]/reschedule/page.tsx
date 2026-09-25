import { notFound } from "next/navigation";
import { BookingCalendar } from "@/components/BookingCalendar";
import { isAppointmentServiceType, isFutureAppointment } from "@/lib/appointment-types";
import { bucharestDate, clientBookingDateBounds } from "@/lib/calendar-scheduling";
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
  const bounds = clientBookingDateBounds();
  if (
    !appointment ||
    !["REQUESTED", "CONFIRMED"].includes(appointment.status) ||
    !isFutureAppointment(appointment.startsAt) ||
    appointment.startsAt.getTime() < bounds.earliest.getTime()
  ) {
    notFound();
  }

  return (
    <main className="private-shell">
      <BookingCalendar
        locale={locale}
        minDate={bucharestDate(bounds.earliest)}
        maxDate={bucharestDate(bounds.latest)}
        verified={user.emailVerified}
        rescheduleFromAppointmentId={appointment.id}
        initialServiceType={
          isAppointmentServiceType(appointment.serviceCode) ? appointment.serviceCode : undefined
        }
      />
    </main>
  );
}
