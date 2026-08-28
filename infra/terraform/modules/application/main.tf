resource "cloudflare_d1_database" "application" {
  account_id   = var.account_id
  name         = var.d1_database_name
  jurisdiction = "eu"

  # Avoid global D1 replicas. This confines D1 storage/replicas to the EU
  # jurisdiction but does not constrain where a Worker executes.
  read_replication = {
    mode = "disabled"
  }

  lifecycle {
    prevent_destroy = true
  }
}

# Secrets Store is account-scoped. Cloudflare currently permits one store per
# account, so dev and production must use different accounts for true store
# isolation. Secret values are created with a prompt-only Wrangler command or
# the Cloudflare API, never from Terraform state or Git.
resource "cloudflare_secrets_store" "application" {
  account_id = var.account_id
  name       = var.secrets_store_name

  lifecycle {
    prevent_destroy = true
  }
}

resource "cloudflare_turnstile_widget" "application" {
  account_id     = var.account_id
  name           = "Eikon Mind ${var.environment}"
  domains        = [var.hostname]
  mode           = "managed"
  bot_fight_mode = false
  region         = "world"

  lifecycle {
    prevent_destroy = true
  }
}

# Only these two narrow, non-DNS zone settings are owned by this module.
resource "cloudflare_zone_setting" "always_use_https" {
  zone_id    = var.zone_id
  setting_id = "always_use_https"
  value      = "on"
}

resource "cloudflare_zone_setting" "minimum_tls_version" {
  zone_id    = var.zone_id
  setting_id = "min_tls_version"
  value      = "1.2"
}

# A zone phase is authoritative. Before the first apply, import the existing
# http_ratelimit ruleset or use a dedicated zone with no pre-existing rules.
# This is deliberately limited to the Cloudflare Free plan feature set: one
# rule, URI path matching only, IP counting, and 10-second periods. HTTP method
# matching and regular expressions require a higher zone plan, so the rule
# counts every request to these POST-only application endpoints.
resource "cloudflare_ruleset" "sensitive_post_rate_limits" {
  zone_id = var.zone_id
  name    = "eikon-mind-${var.environment}-sensitive-posts"
  kind    = "zone"
  phase   = "http_ratelimit"

  rules = [{
    ref         = "eikon_mind_sensitive_posts"
    description = "Rate limit authentication and appointment booking paths"
    enabled     = true
    action      = "block"
    expression  = "(http.request.uri.path eq \"/api/auth/sign-in/email\" or http.request.uri.path eq \"/api/auth/sign-up/email\" or http.request.uri.path eq \"/api/auth/request-password-reset\" or http.request.uri.path eq \"/api/auth/send-verification-email\" or starts_with(http.request.uri.path, \"/api/auth/two-factor/\") or http.request.uri.path eq \"/api/appointments/book\")"
    ratelimit = {
      characteristics     = ["cf.colo.id", "ip.src"]
      period              = 10
      requests_per_period = 10
      mitigation_timeout  = 10
    }
  }]
}
