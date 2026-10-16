import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

function loadConfig(hostname, configuredApiUrl = "") {
    const window = { location: { hostname }, IWAR_API_BASE_URL: configuredApiUrl };
    vm.runInNewContext(read("api/config.js"), { window });
    return window;
}

test("local development uses localhost only on a local hostname", () => {
    assert.equal(loadConfig("localhost").IWAR_API_BASE_URL, "http://localhost:4000");
    assert.equal(loadConfig("127.0.0.1").IWAR_API_BASE_URL, "http://localhost:4000");
});

test("hosted configuration never silently defaults to localhost", () => {
    const hosted = loadConfig("infinit-war.example");
    assert.equal(hosted.IWAR_API_BASE_URL, "");
    assert.equal(hosted.GDE_API_BASE_URL, "");
});

test("an explicitly configured API URL is preserved and normalized", () => {
    const hosted = loadConfig("infinit-war.example", "https://api.example.test/");
    assert.equal(hosted.IWAR_API_BASE_URL, "https://api.example.test");
    assert.equal(hosted.GDE_API_BASE_URL, "https://api.example.test");
});

test("API client reports missing hosted configuration before attempting fetch", async () => {
    const window = { IWAR_API_BASE_URL: "", GDE_API_BASE_URL: "" };
    const values = new Map();
    const localStorage = {
        getItem: (key) => values.get(key) || null,
        setItem: (key, value) => values.set(key, value),
        removeItem: (key) => values.delete(key)
    };
    vm.runInNewContext(read("api/client.js"), {
        window,
        localStorage,
        fetch: async () => { throw new Error("fetch should not be called"); }
    });

    await assert.rejects(
        window.IWARApi.exchangeAuthSession({ uid: "test-user", provider: "google" }),
        /Backend API URL is not configured for this hosted environment/
    );
});
