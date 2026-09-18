import { BookingCalendar } from "@/components/BookingCalendar";
import { bucharestDate, clientBookingDateBounds } from "@/lib/calendar-scheduling";
import { requireClient } from "@/lib/session";
import type { Locale } from "@/lib/site-content";

export default async function Book({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const user = await requireClient(locale);
  const bounds = clientBookingDateBounds();
  return (
    <main className="private-shell">
      <BookingCalendar
        locale={locale}
        minDate={bucharestDate(bounds.earliest)}
        maxDate={bucharestDate(bounds.latest)}
        verified={user.emailVerified}
      />
    </main>
  );
}
