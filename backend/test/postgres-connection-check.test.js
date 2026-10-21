import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scriptPath = path.join(backendDir, "scripts", "check-postgres-connection.mjs");

function run(envOverrides) {
    const env = { ...process.env };
    for (const [key, value] of Object.entries(envOverrides)) {
        if (value === undefined) delete env[key];
        else env[key] = value;
    }
    return spawnSync(process.execPath, [scriptPath], {
        cwd: backendDir,
        env,
        encoding: "utf8",
        timeout: 5000
    });
}

test("connection check fails closed when database URL is missing", () => {
    const env = { ...process.env };
    delete env.GAME_SUPABASE_DATABASE_URL;
    delete env.GAME_SUPABASE_CA_CERT;
    const result = run({ GAME_SUPABASE_DATABASE_URL: undefined, GAME_SUPABASE_CA_CERT: undefined });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /GAME_SUPABASE_DATABASE_URL is missing/);
    assert.doesNotMatch(result.stdout + result.stderr, /postgres(?:ql)?:\/\/[^\s]+:[^\s]+@/i);
});

test("connection check rejects a non-PostgreSQL URL before connecting", () => {
    const result = run({ GAME_SUPABASE_DATABASE_URL: "https://example.invalid/not-a-database" });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /not a PostgreSQL URL/);
});

test("connection check rejects a missing CA certificate before connecting", () => {
    const result = run({
        GAME_SUPABASE_DATABASE_URL: "postgresql://example.invalid/test",
        GAME_SUPABASE_CA_CERT: ""
    });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /CA certificate validation failed/);
});
