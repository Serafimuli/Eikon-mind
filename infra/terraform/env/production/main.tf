terraform {
  required_version = ">= 1.8.0"

  cloud {
    # CI supplies the real organization through TF_CLOUD_ORGANIZATION.
    workspaces {
      name = "eikon-mind-production"
    }
  }

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.23.0"
    }
  }
}

provider "cloudflare" {}

module "application" {
  source = "git::https://github.com/Serafimuli/Eikon-mind.git//infra/terraform/modules/application?ref=next.js-migration"

  account_id         = var.cloudflare_account_id
  zone_id            = var.cloudflare_zone_id
  environment        = "production"
  worker_name        = "eikon-mind-production"
  hostname           = var.hostname
  d1_database_name   = "eikon-mind-production"
  secrets_store_name = "eikon-mind-production"
  email_from_address = var.email_from_address
  operations_mailbox = var.operations_mailbox
  retention          = var.retention
}

check "dpo_approved_retention_values" {
  assert {
    condition = (
      var.retention.appointment_days > 0 &&
      var.retention.cancelled_appointment_days > 0 &&
      var.retention.deidentified_record_days > 0 &&
      var.retention.audit_event_days > 0 &&
      trimspace(var.retention_approval_reference) != ""
    )
    error_message = "Production deployment requires positive retention values and an external controller/DPO approval reference covering the exact deletion behavior."
  }
}

output "deployment" {
  description = "Non-secret input for frontend/scripts/render-wrangler-config.mjs."
  value = {
    account_id         = var.cloudflare_account_id
    environment        = "production"
    d1_database_id     = module.application.d1_database_id
    d1_database_name   = module.application.d1_database_name
    secrets_store_id   = module.application.secrets_store_id
    turnstile_sitekey  = module.application.turnstile_sitekey
    worker_name        = module.application.worker_name
    hostname           = module.application.hostname
    zone_id            = module.application.zone_id
    email_from_address = module.application.email_from_address
    operations_mailbox = module.application.operations_mailbox
    retention          = module.application.retention
  }
}
