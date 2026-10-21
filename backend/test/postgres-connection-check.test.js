import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";

const script = fileURLToPath(new URL("../scripts/check-postgres-connection.mjs", import.meta.url));

function runCheck(secretValue) {
  const env = { ...process.env };
  delete env.GAME_SUPABASE_DATABASE_URL;
  if (secretValue !== undefined) env.GAME_SUPABASE_DATABASE_URL = secretValue;
  return spawnSync(process.execPath, [script], {
    encoding: "utf8",
    env,
    timeout: 10_000
  });
}

test("PostgreSQL connection check fails when the required secret is missing", () => {
  const result = runCheck();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /PG_CONNECTION_CHECK_FAILED/);
  assert.doesNotMatch(result.stdout + result.stderr, /postgres(?:ql)?:\/\/[^\s]+/i);
});

test("PostgreSQL connection check rejects a non-PostgreSQL URL without connecting", () => {
  const result = runCheck("https://example.invalid/not-a-database");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /not a PostgreSQL URL/);
  assert.doesNotMatch(result.stdout + result.stderr, /example\.invalid/);
});
