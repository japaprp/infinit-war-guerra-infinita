import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { validateRuntimeConfig } from "../src/config/env.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

function loadConfig(hostname, configuredApiUrl = "", metaApiUrl = "") {
    const window = { location: { hostname }, IWAR_API_BASE_URL: configuredApiUrl };
    const document = { querySelector: (selector) => selector === 'meta[name="iwar-api-base-url"]' ? { content: metaApiUrl } : null };
    vm.runInNewContext(read("api/config.js"), { window, document });
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

test("the HTML meta configuration can provide the hosted API URL", () => {
    const hosted = loadConfig("infinit-war.example", "", "https://api.example.test/");
    assert.equal(hosted.IWAR_API_BASE_URL, "https://api.example.test");
    assert.equal(hosted.GDE_API_BASE_URL, "https://api.example.test");
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

test("production configuration rejects unsafe defaults and ephemeral JSON storage", () => {
    assert.throws(
        () => validateRuntimeConfig({
            NODE_ENV: "production",
            FIREBASE_PROJECT_ID: "infinit-war-test",
            JWT_SECRET: "unsafe_dev_secret",
            RECEIPT_SECRET: "unsafe_receipt_secret",
            DATA_DRIVER: "json",
            CORS_ORIGINS: ""
        }),
        /Invalid production configuration/
    );
});

test("production configuration accepts explicit secrets, MySQL, and exact origins", () => {
    assert.doesNotThrow(() => validateRuntimeConfig({
        NODE_ENV: "production",
            FIREBASE_PROJECT_ID: "infinit-war-test",
        JWT_SECRET: "jwt-secret-that-is-long-enough-12345",
        RECEIPT_SECRET: "receipt-secret-that-is-long-enough-123",
        DATA_DRIVER: "mysql",
        MYSQL_HOST: "mysql.example.test",
        MYSQL_PORT: 3306,
        MYSQL_DATABASE: "infinitwar",
        MYSQL_USER: "infinitwar_app",
        MYSQL_PASSWORD: "database-password",
        CORS_ORIGINS: "https://game.example.test"
    }));
});

test("production configuration rejects origins containing paths", () => {
    assert.throws(
        () => validateRuntimeConfig({
            NODE_ENV: "production",
            FIREBASE_PROJECT_ID: "infinit-war-test",
            JWT_SECRET: "jwt-secret-that-is-long-enough-12345",
            RECEIPT_SECRET: "receipt-secret-that-is-long-enough-123",
            DATA_DRIVER: "mysql",
            MYSQL_HOST: "mysql.example.test",
            MYSQL_DATABASE: "infinitwar",
            MYSQL_USER: "infinitwar_app",
            MYSQL_PASSWORD: "database-password",
            CORS_ORIGINS: "https://game.example.test/path"
        }),
        /exact HTTPS origin/
    );
});


test("production configuration rejects an invalid MySQL port", () => {
    assert.throws(
        () => validateRuntimeConfig({
            NODE_ENV: "production",
            FIREBASE_PROJECT_ID: "infinit-war-test",
            JWT_SECRET: "jwt-secret-that-is-long-enough-12345",
            RECEIPT_SECRET: "receipt-secret-that-is-long-enough-123",
            DATA_DRIVER: "mysql",
            MYSQL_HOST: "mysql.example.test",
            MYSQL_PORT: 70000,
            MYSQL_DATABASE: "infinitwar",
            MYSQL_USER: "infinitwar_app",
            MYSQL_PASSWORD: "database-password",
            CORS_ORIGINS: "https://game.example.test"
        }),
        /MYSQL_PORT must be an integer between 1 and 65535/
    );
});


test("production configuration accepts a PostgreSQL connection URL", () => {
    assert.doesNotThrow(() => validateRuntimeConfig({
        NODE_ENV: "production",
        FIREBASE_PROJECT_ID: "infinit-war-test",
        JWT_SECRET: "jwt-secret-that-is-long-enough-12345",
        RECEIPT_SECRET: "receipt-secret-that-is-long-enough-123",
        DATA_DRIVER: "postgres",
        DATABASE_URL: "postgresql://game_user:private-password@db.example.test:5432/infinitwar?sslmode=require",
        CORS_ORIGINS: "https://game.example.test"
    }));
});

test("production configuration rejects malformed PostgreSQL connection URLs", () => {
    for (const DATABASE_URL of ["not-a-url", "https://db.example.test/infinitwar", "postgresql://db.example.test/"]) {
        assert.throws(
            () => validateRuntimeConfig({
                NODE_ENV: "production",
                FIREBASE_PROJECT_ID: "infinit-war-test",
                JWT_SECRET: "jwt-secret-that-is-long-enough-12345",
                RECEIPT_SECRET: "receipt-secret-that-is-long-enough-123",
                DATA_DRIVER: "postgres",
                DATABASE_URL,
                CORS_ORIGINS: "https://game.example.test"
            }),
            /Invalid production configuration/
        );
    }
});
