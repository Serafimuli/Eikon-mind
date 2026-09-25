import { TherapistWeekCalendarGrid } from "@/components/TherapistWeekCalendarGrid";
import { requireStaff } from "@/lib/session";
import type { Locale } from "@/lib/site-content";

export default async function StaffAppointments({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ week?: string; weekends?: string }>;
}) {
  const { locale } = await params;
  const staff = await requireStaff(locale);
  const { week, weekends } = await searchParams;
  return (
    <TherapistWeekCalendarGrid
      locale={locale}
      requestedWeek={week}
      showWeekends={weekends === "1"}
      canManage={staff.role === "THERAPIST"}
    />
  );
}
