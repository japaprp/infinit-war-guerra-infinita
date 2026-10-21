import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const script = fileURLToPath(new URL("../scripts/check-postgres-connection.mjs", import.meta.url));

function runCheck(secretValue, caCertificate) {
  const env = { ...process.env };
  delete env.GAME_SUPABASE_DATABASE_URL;
  delete env.GAME_SUPABASE_CA_CERT;
  if (secretValue !== undefined) env.GAME_SUPABASE_DATABASE_URL = secretValue;
  if (caCertificate !== undefined) env.GAME_SUPABASE_CA_CERT = caCertificate;
  return spawnSync(process.execPath, [script], {
    encoding: "utf8",
    env,
    timeout: 10_000
  });
}

test("PostgreSQL connection check fails when the database URL secret is missing", () => {
  const result = runCheck();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /required repository secret GAME_SUPABASE_DATABASE_URL is missing/);
  assert.doesNotMatch(result.stdout + result.stderr, /postgres(?:ql)?:\/\/[^\s]+/i);
});

test("PostgreSQL connection check rejects a non-PostgreSQL URL without connecting", () => {
  const result = runCheck("https://example.invalid/not-a-database");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /not a PostgreSQL URL/);
  assert.doesNotMatch(result.stdout + result.stderr, /example\.invalid/);
});

test("PostgreSQL connection check requires an explicit CA certificate", () => {
  const result = runCheck("postgresql://localhost/postgres");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /required repository secret GAME_SUPABASE_CA_CERT is missing/);
});

test("PostgreSQL connection check rejects malformed CA data before connecting", () => {
  const result = runCheck("postgresql://localhost/postgres", "not-a-certificate");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /GAME_SUPABASE_CA_CERT is not a PEM certificate/);
  assert.doesNotMatch(result.stdout + result.stderr, /not-a-certificate/);
});
