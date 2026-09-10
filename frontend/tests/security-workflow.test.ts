import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("CodeQL can read its workflow run and upload SARIF results", async () => {
  const [codeqlWorkflow, securityWorkflow] = await Promise.all([
    readFile(new URL("../../.github/workflows/codeql.yml", import.meta.url), "utf8"),
    readFile(new URL("../../.github/workflows/security.yml", import.meta.url), "utf8"),
  ]);
  const codeqlJob = codeqlWorkflow.match(/  analyze:[\s\S]*$/)?.[0] ?? "";

  assert.match(codeqlJob, /actions: read/);
  assert.match(codeqlJob, /contents: read/);
  assert.match(codeqlJob, /security-events: write/);
  assert.match(codeqlJob, /language: actions/);
  assert.match(codeqlJob, /language: javascript-typescript/);
  assert.match(codeqlJob, /actions\/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1/);
  assert.match(codeqlJob, /github\/codeql-action\/init@fddeee1a7ece751b577e409a89057319e3172939/);
  assert.match(
    codeqlJob,
    /github\/codeql-action\/analyze@fddeee1a7ece751b577e409a89057319e3172939/,
  );
  assert.doesNotMatch(securityWorkflow, /\n  codeql:/);
});
