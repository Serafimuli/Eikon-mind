import type { AppointmentStatus, TherapyMode } from "@/data/mockData"

export interface AddAppointmentForm {
  clientId: string

  date: string

  time: string

  service: string

  therapyMode: TherapyMode

  status: AppointmentStatus

  notes: string
}
