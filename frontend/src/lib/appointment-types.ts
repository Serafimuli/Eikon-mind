export const APPOINTMENT_STATUSES = ["REQUESTED", "CONFIRMED", "COMPLETED", "CANCELLED"] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

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
