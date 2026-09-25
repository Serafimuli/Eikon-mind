import type { Locale } from "@/lib/site-content";

export const APPOINTMENT_STATUSES = ["REQUESTED", "CONFIRMED", "COMPLETED", "CANCELLED"] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const APPOINTMENT_SERVICE_TYPES = [
  "ADULT",
  "ADDICTION",
  "TEEN",
  "FAMILY",
  "SENIOR",
  "PROFESSIONAL_TRAINING",
] as const;

export type AppointmentServiceType = (typeof APPOINTMENT_SERVICE_TYPES)[number];

const SERVICE_TYPE_LABELS: Record<Locale, Record<AppointmentServiceType, string>> = {
  en: {
    ADULT: "Adult",
    ADDICTION: "Addiction",
    TEEN: "Teen",
    FAMILY: "Family",
    SENIOR: "Senior",
    PROFESSIONAL_TRAINING: "Professional training",
  },
  ro: {
    ADULT: "Adult",
    ADDICTION: "Dependență",
    TEEN: "Adolescent",
    FAMILY: "Familie",
    SENIOR: "Senior",
    PROFESSIONAL_TRAINING: "Formare profesională",
  },
};

export function isAppointmentServiceType(value: unknown): value is AppointmentServiceType {
  return (
    typeof value === "string" && (APPOINTMENT_SERVICE_TYPES as readonly string[]).includes(value)
  );
}

export function appointmentServiceLabel(serviceCode: string, locale: Locale) {
  return isAppointmentServiceType(serviceCode)
    ? SERVICE_TYPE_LABELS[locale][serviceCode]
    : locale === "ro"
      ? "Nespecificat"
      : "Not specified";
}

export function appointmentServiceDescription(serviceType: AppointmentServiceType, locale: Locale) {
  const label = SERVICE_TYPE_LABELS[locale][serviceType];
  return `${locale === "ro" ? "Tipul serviciului" : "Service type"}: ${label}`;
}

export function isFutureAppointment(startsAt: Date) {
  return startsAt.getTime() > Date.now();
}

export const STAFF_APPOINTMENT_TRANSITIONS: Readonly<
  Record<AppointmentStatus, readonly AppointmentStatus[]>
> = Object.freeze({
  REQUESTED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
});

export function canStaffTransitionAppointment(
  currentStatus: AppointmentStatus,
  nextStatus: AppointmentStatus,
) {
  return STAFF_APPOINTMENT_TRANSITIONS[currentStatus].includes(nextStatus);
}
