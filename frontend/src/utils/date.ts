import type { Lang } from "@/i18n/translations"

export function getLocale(lang: Lang) {
  return lang === "ro" ? "ro-RO" : "en-GB"
}

export function formatAppointmentDate(
  date: string,
  lang: Lang,
  weekday: "short" | "long" = "short",
) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(getLocale(lang), {
    weekday,

    day: "numeric",

    month: weekday === "long" ? "long" : "short",

    year: weekday === "long" ? "numeric" : undefined,
  })
}
