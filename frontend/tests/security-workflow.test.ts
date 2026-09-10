import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("CodeQL can read its workflow run and upload SARIF results", async () => {
  const workflow = await readFile(
    new URL("../../.github/workflows/security.yml", import.meta.url),
    "utf8",
  );
  const codeqlJob = workflow.match(/  codeql:[\s\S]*?(?=\n  \w|\n$)/)?.[0] ?? "";

  assert.match(codeqlJob, /actions: read/);
  assert.match(codeqlJob, /contents: read/);
  assert.match(codeqlJob, /security-events: write/);
  assert.match(codeqlJob, /github\/codeql-action\/init/);
  assert.match(codeqlJob, /github\/codeql-action\/analyze/);
});
