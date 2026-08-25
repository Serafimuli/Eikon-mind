output "d1_database_id" {
  description = "Non-secret D1 identifier for Wrangler bindings."
  value       = cloudflare_d1_database.application.id
}

output "d1_database_name" {
  value = cloudflare_d1_database.application.name
}

output "secrets_store_id" {
  description = "Non-secret Secrets Store identifier for Wrangler bindings."
  value       = cloudflare_secrets_store.application.id
}

output "turnstile_sitekey" {
  description = "Public Turnstile site key. The sensitive Turnstile secret is never output."
  value       = cloudflare_turnstile_widget.application.id
}

output "worker_name" { value = var.worker_name }
output "hostname" { value = var.hostname }
output "zone_id" { value = var.zone_id }
output "email_from_address" { value = var.email_from_address }
output "operations_mailbox" { value = var.operations_mailbox }
output "retention" { value = var.retention }
