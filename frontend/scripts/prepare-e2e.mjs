import { execFileSync } from "node:child_process";
import { copyFile, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const localVariables = new URL("../.dev.vars", import.meta.url);
try {
  await readFile(localVariables, "utf8");
} catch {
  await copyFile(new URL("../.dev.vars.example", import.meta.url), localVariables);
}

const source = await readFile(localVariables, "utf8");
if (
  !/^APP_ENV=["']?local["']?$/m.test(source) ||
  !source.includes('TURNSTILE_SITEKEY="1x00000000000000000000AA"') ||
  !source.includes('TURNSTILE_SECRET="1x0000000000000000000000000000000AA"')
) {
  throw new Error(
    "E2E preparation is local-only and requires the documented Cloudflare Turnstile test credentials.",
  );
}

const runNodeModule = (moduleUrl, args) =>
  execFileSync(process.execPath, [fileURLToPath(moduleUrl), ...args], { stdio: "inherit" });
runNodeModule(new URL("../node_modules/wrangler/bin/wrangler.js", import.meta.url), [
  "d1",
  "migrations",
  "apply",
  "eikon-mind",
  "--local",
]);
runNodeModule(new URL("../node_modules/tsx/dist/cli.mjs", import.meta.url), [
  "scripts/seed.ts",
  "--e2e",
]);
