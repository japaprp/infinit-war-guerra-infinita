import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const configSource = await readFile(new URL("../api/config.js", import.meta.url), "utf8");
const htmlSource = await readFile(new URL("../index.html", import.meta.url), "utf8");

function evaluateConfig(location) {
    const window = { location };
    vm.runInNewContext(configSource, { window });
    return window;
}

test("hosted configuration uses the verified HTTPS API origin", () => {
    const window = evaluateConfig({ protocol: "https:", hostname: "example.com" });
    assert.equal(window.IWAR_API_BASE_URL, "https://infinit-war-api.onrender.com");
    assert.equal(window.GDE_API_BASE_URL, window.IWAR_API_BASE_URL);
});

test("local development retains localhost API", () => {
    for (const location of [
        { protocol: "http:", hostname: "localhost" },
        { protocol: "http:", hostname: "127.0.0.1" },
        { protocol: "file:", hostname: "" }
    ]) {
        assert.equal(evaluateConfig(location).IWAR_API_BASE_URL, "http://localhost:4000");
    }
});

test("CSP allows the exact hosted API origin without a wildcard", () => {
    const csp = htmlSource.match(/Content-Security-Policy[^>]*content="([^"]+)"/)?.[1] || "";
    const connectSrc = csp.split(";").map((part) => part.trim()).find((part) => part.startsWith("connect-src "));
    assert.ok(connectSrc, "connect-src directive must exist");
    assert.match(connectSrc, /https:\/\/infinit-war-api\.onrender\.com(?:\s|$)/);
    assert.doesNotMatch(connectSrc, /https:\/\/\*\.onrender\.com/);
});
