import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scriptPath = path.join(backendDir, "scripts", "check-postgres-persistence.mjs");

function run(overrides) {
    const env = { ...process.env };
    for (const [key, value] of Object.entries(overrides)) {
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

test("isolated persistence probe fails closed when database URL is missing", () => {
    const result = run({ GAME_SUPABASE_DATABASE_URL: undefined, GAME_SUPABASE_CA_CERT: undefined });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /GAME_SUPABASE_DATABASE_URL is missing/);
});

test("isolated persistence probe rejects a non-PostgreSQL URL before connecting", () => {
    const result = run({
        GAME_SUPABASE_DATABASE_URL: "https://example.invalid/not-a-database",
        GAME_SUPABASE_CA_CERT: ""
    });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /not a PostgreSQL URL/);
});
