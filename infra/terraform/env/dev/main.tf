terraform {
  required_version = ">= 1.8.0"

  cloud {
    organization = "REPLACE_WITH_HCP_TERRAFORM_ORGANIZATION"
    workspaces {
      name = "eikon-mind-dev"
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
  source = "../../modules/application"

  account_id         = var.cloudflare_account_id
  zone_id            = var.cloudflare_zone_id
  environment        = "dev"
  worker_name        = "eikon-mind-dev"
  hostname           = var.hostname
  d1_database_name   = "eikon-mind-dev"
  secrets_store_name = "eikon-mind-dev"
  email_from_address = var.email_from_address
  operations_mailbox = var.operations_mailbox
  retention          = var.retention
}

output "deployment" {
  description = "Non-secret input for frontend/scripts/render-wrangler-config.mjs."
  value = {
    account_id         = var.cloudflare_account_id
    environment        = "dev"
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
