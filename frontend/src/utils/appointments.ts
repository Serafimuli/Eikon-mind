import type { Appointment } from "@/data/mockData"

export function getToday() {
  return new Date().toISOString().split("T")[0]
}

export function sortAppointments(
  appointments: Appointment[],
  descending = false,
) {
  return [...appointments].sort((a, b) => {
    const result = a.date.localeCompare(b.date) || a.time.localeCompare(b.time)

    return descending ? -result : result
  })
}

export function getClientAppointments(
  appointments: Appointment[],
  clientId: string,
) {
  return appointments.filter((appointment) => appointment.clientId === clientId)
}

export function splitClientAppointments(
  appointments: Appointment[],
  today = getToday(),
) {
  return {
    upcoming: sortAppointments(
      appointments.filter(
        (appointment) =>
          appointment.date >= today &&
          appointment.status !== "cancelled" &&
          appointment.status !== "completed",
      ),
    ),

    past: sortAppointments(
      appointments.filter(
        (appointment) =>
          appointment.date < today ||
          appointment.status === "completed" ||
          appointment.status === "cancelled",
      ),
      true,
    ),
  }
}

export function getUpcomingAppointments(
  appointments: Appointment[],
  today = getToday(),
) {
  return sortAppointments(
    appointments.filter(
      (appointment) =>
        appointment.date > today && appointment.status !== "cancelled",
    ),
  )
}
