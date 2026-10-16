import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const envModuleUrl = new URL("../src/config/env.js", import.meta.url).href;

function readDriver(extraEnv = {}) {
    const script = `import { env } from ${JSON.stringify(envModuleUrl)}; console.log(env.DATA_DRIVER);`;
    const result = spawnSync(process.execPath, ["--input-type=module", "--eval", script], {
        encoding: "utf8",
        env: {
            ...process.env,
            DATA_DRIVER_POSTGRES: "",
            DATA_DRIVER: "",
            ...extraEnv
        }
    });

    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
}

test("dedicated PostgreSQL selector takes precedence over legacy MySQL driver", () => {
    assert.equal(readDriver({
        DATA_DRIVER_POSTGRES: "postgres",
        DATA_DRIVER: "mysql"
    }), "postgres");
});

test("legacy DATA_DRIVER=mysql remains supported when PostgreSQL selector is unset", () => {
    assert.equal(readDriver({
        DATA_DRIVER_POSTGRES: "",
        DATA_DRIVER: "mysql"
    }), "mysql");
});

test("legacy DATA_DRIVER=postgres remains supported", () => {
    assert.equal(readDriver({
        DATA_DRIVER_POSTGRES: "",
        DATA_DRIVER: "postgres"
    }), "postgres");
});
