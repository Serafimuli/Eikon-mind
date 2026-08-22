import type { Appointment } from "@/data/mockData"

import type { AppointmentStatus } from "@/data/mockData"

export type AppointmentFilterStatus = AppointmentStatus | "all"

export interface CalendarViewProps {
  appointments: Appointment[]

  weekdays: readonly string[]

  monthLocale: string
}
