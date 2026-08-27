import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const [configPath, userId] = process.argv.slice(2);
if (!configPath || !/^[0-9a-f-]{36}$/i.test(userId ?? "")) {
  throw new Error(
    "Usage: node scripts/bootstrap-first-admin.mjs <generated-wrangler-config> <verified-totp-user-uuid>",
  );
}

const config = JSON.parse(readFileSync(configPath, "utf8"));
const databaseName = config.d1_databases?.[0]?.database_name;
if (!databaseName)
  throw new Error("Could not read D1 database_name from the generated Wrangler configuration");

// A one-time, conditional operator command. It cannot replace an existing
// admin, cannot promote an unverified user, and requires TOTP already enabled.
const command = `UPDATE user SET role = 'ADMIN', updated_at = unixepoch('subsec') * 1000 WHERE id = '${userId}' AND email_verified = 1 AND two_factor_enabled = 1 AND NOT EXISTS (SELECT 1 FROM user WHERE role = 'ADMIN');`;
const executable = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(
  executable,
  [
    "wrangler",
    "d1",
    "execute",
    databaseName,
    "--remote",
    "--config",
    configPath,
    "--command",
    command,
  ],
  {
    stdio: "inherit",
    shell: false,
  },
);
if (result.status !== 0) process.exit(result.status ?? 1);
