import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

test("Render blueprint is an explicitly free backend template with a health check", () => {
    const yaml = read("render.yaml");
    assert.match(yaml, /name: infinit-war-api/);
    assert.match(yaml, /plan: free/);
    assert.match(yaml, /rootDir: backend/);
    assert.match(yaml, /buildCommand: npm ci/);
    assert.match(yaml, /startCommand: npm start/);
    assert.match(yaml, /healthCheckPath: \/health/);
    assert.match(yaml, /key: DATA_DRIVER\s+value: mysql/);
    assert.match(yaml, /key: MYSQL_SSL\s+value: "true"/);
    assert.match(yaml, /key: FIREBASE_PROJECT_ID\s+sync: false/);
    assert.match(yaml, /key: JWT_SECRET\s+generateValue: true/);
    assert.match(yaml, /key: RECEIPT_SECRET\s+generateValue: true/);
    for (const key of ["CORS_ORIGINS", "MYSQL_HOST", "MYSQL_PORT", "MYSQL_DATABASE", "MYSQL_USER", "MYSQL_PASSWORD"]) {
        assert.match(yaml, new RegExp(`key: ${key}\\s+sync: false`), `${key} must be supplied at deployment time`);
    }
    assert.doesNotMatch(yaml, /type: pserv|type: worker|type: cron/);
});

test("both browser pages expose the verified HTTPS API origin and retain CSP", () => {
    const config = read("api/config.js");
    const html = read("index.html");
    const gameHtml = read("game.html");
    const docs = read("DEPLOYMENT_PREPARATION.md");
    assert.match(config, /configuredMeta/);
    assert.match(config, /isLocalDevelopment \? "http:\/\/localhost:4000" : ""/);
    for (const page of [html, gameHtml]) {
        assert.match(page, /name="iwar-api-base-url" content="https:\\/\\/infinit-war-api\\.onrender\\.com"/);
        assert.match(page, /Content-Security-Policy/);
        assert.match(page, /connect-src[^"]*http:\/\/localhost:4000/);
    }
    assert.match(docs, /actual frontend and API origins are confirmed/i);
    assert.match(docs, /Do not commit secrets or invent a production URL/i);
});

test("deployment preparation does not contain a committed production API hostname", () => {
    const config = read("api/config.js");
    assert.doesNotMatch(config, /https:\/\/[^\s"']+\.onrender\.com/);
    assert.doesNotMatch(config, /https:\/\/api\.[^\s"']+/);
});
