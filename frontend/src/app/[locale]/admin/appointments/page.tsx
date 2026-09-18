import { TherapistWeekCalendar } from "@/components/TherapistWeekCalendar";
import { requireStaff } from "@/lib/session";
import type { Locale } from "@/lib/site-content";

export default async function StaffAppointments({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ week?: string }>;
}) {
  const { locale } = await params;
  const staff = await requireStaff(locale);
  const { week } = await searchParams;
  return (
    <TherapistWeekCalendar
      locale={locale}
      requestedWeek={week}
      canManage={staff.role === "THERAPIST"}
    />
  );
}
