import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { resolvePostgresCaCertificate } from "../src/postgresCompat.js";

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

test("PostgreSQL connection configuration normalizes escaped CA newlines", () => {
  const certificate = [
    "-----BEGIN CERTIFICATE-----",
    "synthetic-ca-data",
    "-----END CERTIFICATE-----"
  ].join(String.fromCharCode(10));
  const escaped = certificate.split(String.fromCharCode(10)).join(String.fromCharCode(92) + "n");
  assert.equal(
    resolvePostgresCaCertificate({ POSTGRES_CA_CERT: escaped, POSTGRES_CA_CERT_PATH: "/missing/ca.pem" }),
    certificate
  );
});

test("PostgreSQL connection configuration prefers the explicit CA environment value", () => {
  const certificate = "-----BEGIN CERTIFICATE-----";
  assert.equal(
    resolvePostgresCaCertificate({ POSTGRES_CA_CERT: certificate, POSTGRES_CA_CERT_PATH: "/missing/ca.pem" }),
    certificate
  );
});
