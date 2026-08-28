variable "account_id" {
  description = "Cloudflare account ID. Use separate accounts when separate Secrets Stores are required."
  type        = string
}

variable "zone_id" {
  description = "Existing Cloudflare Zone ID. This module never creates or transfers a zone."
  type        = string
}

variable "environment" {
  description = "Deployment environment name, for example dev or production."
  type        = string
}

variable "worker_name" {
  description = "Workers script name used by Wrangler."
  type        = string
}

variable "hostname" {
  description = "Available HTTPS hostname in the supplied active Cloudflare zone; Wrangler creates its Worker Custom Domain."
  type        = string
}

variable "d1_database_name" {
  description = "D1 database name. Changing it replaces the database, so it is protected from destroy."
  type        = string
}

variable "secrets_store_name" {
  description = "Secrets Store name. Cloudflare currently allows one Secrets Store per account."
  type        = string
}

variable "email_from_address" {
  description = "Approved Email Sending address, for example noreply@example.com."
  type        = string
}

variable "operations_mailbox" {
  description = "Staff mailbox for the restricted operations email binding."
  type        = string
}

variable "retention" {
  description = "DPO-approved retention values in days. Production input validation is performed in the environment root."
  type = object({
    appointment_days           = number
    cancelled_appointment_days = number
    deidentified_record_days   = number
    audit_event_days           = number
  })
}
