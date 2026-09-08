variable "cloudflare_account_id" {
  type        = string
  description = "Cloudflare account ID dedicated to development."
}

variable "cloudflare_zone_id" {
  type        = string
  default     = null
  nullable    = true
  description = "Existing development zone ID. Omit when deploying to workers.dev."
}

variable "hostname" {
  type        = string
  description = "Development HTTPS hostname, such as eikon-mind-dev.eikon-dev.workers.dev."
}

variable "email_from_address" {
  type        = string
  description = "Sender on a domain verified by the development Resend Free account."
}

variable "operations_mailbox" {
  type        = string
  description = "Development operations mailbox."
}

variable "retention" {
  description = "Development retention values; keep deliberately short for test data."
  type = object({
    appointment_days           = number
    cancelled_appointment_days = number
    deidentified_record_days   = number
    audit_event_days           = number
  })
}
