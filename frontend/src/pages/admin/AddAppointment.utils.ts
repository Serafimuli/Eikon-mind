import type { AddAppointmentForm } from "./AddAppointment.types"

export function validateAppointmentForm(
  form: AddAppointmentForm,
  requiredMessage: string,
) {
  const errors: Record<string, string> = {}

  if (!form.clientId) errors.clientId = requiredMessage

  if (!form.date) errors.date = requiredMessage

  if (!form.time) errors.time = requiredMessage

  if (!form.service) errors.service = requiredMessage

  return errors
}
