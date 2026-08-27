import type { AppointmentStatus } from "@/lib/appointment-types";
import type { Locale } from "@/lib/site-content";

const TIME_ZONE = "Europe/Bucharest";

function language(locale: Locale) {
  return locale === "ro" ? "ro-RO" : "en-GB";
}

export function formatDateTime(value: Date, locale: Locale) {
  return value.toLocaleString(language(locale), {
    timeZone: TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatTime(value: Date, locale: Locale) {
  return value.toLocaleTimeString(language(locale), {
    timeZone: TIME_ZONE,
    timeStyle: "short",
  });
}

const STATUS_LABELS: Record<Locale, Record<AppointmentStatus, string>> = {
  ro: {
    REQUESTED: "Solicitată",
    CONFIRMED: "Confirmată",
    COMPLETED: "Finalizată",
    CANCELLED: "Anulată",
  },
  en: {
    REQUESTED: "Requested",
    CONFIRMED: "Confirmed",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  },
};

export function appointmentStatusLabel(status: AppointmentStatus, locale: Locale) {
  return STATUS_LABELS[locale][status];
}
