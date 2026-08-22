import type { Appointment } from "@/data/mockData"

import type { AppointmentFilterStatus } from "./AdminAppointments.types"

export function filterAppointments(
  appointments: Appointment[],
  status: AppointmentFilterStatus,
  service: string,
) {
  return [...appointments]

    .filter(
      (appointment) =>
        (status === "all" || appointment.status === status) &&
        (service === "all" || appointment.service === service),
    )

    .sort(
      (a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time),
    )
}

export function groupAppointmentsByDate(appointments: Appointment[]) {
  return appointments.reduce<Record<string, Appointment[]>>(
    (grouped, appointment) => {
      ;(grouped[appointment.date] ??= []).push(appointment)

      return grouped
    },
    {},
  )
}
