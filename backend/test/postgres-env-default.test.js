import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envModule = path.join(backendDir, "src", "config", "env.js");

test("production defaults to PostgreSQL instead of silently selecting JSON", () => {
    const env = { ...process.env, NODE_ENV: "production" };
    delete env.DATA_DRIVER;
    const result = spawnSync(process.execPath, ["--input-type=module", "-e", `const { env } = await import(${JSON.stringify(envModule)}); console.log(env.DATA_DRIVER);`], {
        cwd: backendDir,
        env,
        encoding: "utf8",
        timeout: 5000
    });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout.trim(), /^postgres$/);
});
