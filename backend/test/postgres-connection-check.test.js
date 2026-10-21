import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scriptPath = path.join(backendDir, "scripts", "check-postgres-connection.mjs");

test("PostgreSQL connection check fails closed when the repository secret is missing", () => {
  const env = { ...process.env };
  delete env.GAME_SUPABASE_DATABASE_URL;

  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: backendDir,
    env,
    encoding: "utf8",
    timeout: 5000
  });

  assert.equal(result.error, undefined);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /GAME_SUPABASE_DATABASE_URL is missing/);
  assert.doesNotMatch(result.stdout + result.stderr, /postgres(?:ql)?:\/\/[^\s]+:[^\s]+@/i);
});

test("PostgreSQL connection check rejects a non-PostgreSQL URL without connecting", () => {
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: backendDir,
    env: { ...process.env, GAME_SUPABASE_DATABASE_URL: "https://example.invalid/not-a-database" },
    encoding: "utf8",
    timeout: 5000
  });

  assert.equal(result.error, undefined);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /not a PostgreSQL URL/);
});
