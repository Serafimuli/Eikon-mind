variable "cloudflare_account_id" {
  type        = string
  description = "Cloudflare account ID dedicated to production."
}

variable "cloudflare_zone_id" {
  type        = string
  description = "Existing production zone ID."
}

variable "hostname" {
  type        = string
  description = "Available production hostname in the active zone; Wrangler creates its Worker Custom Domain."
}

variable "email_from_address" {
  type        = string
  description = "Approved Email Sending sender."
}

variable "operations_mailbox" {
  type        = string
  description = "Production operations mailbox."
}

variable "retention" {
  description = "DPO-approved retention values. Do not set these until the controller has approved them."
  type = object({
    appointment_days           = number
    cancelled_appointment_days = number
    deidentified_record_days   = number
    audit_event_days           = number
  })
}

variable "retention_approval_reference" {
  type        = string
  description = "Non-secret reference to the external controller/DPO approval covering both retention values and deletion behavior."
}
