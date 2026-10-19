import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import { Pool } from "pg";
import {
  closeRepository,
  getRepositoryMode,
  initializeRepository,
  readDb
} from "../src/repositories/dbRepository.js";
import { createStateWriteLockMiddleware, createUserLockMiddleware } from "../src/middlewares/userLockMiddleware.js";

function mockResponse() {
  const listeners = new Map();
  return {
    statusCode: 200,
    body: null,
    writableEnded: false,
    finished: false,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    end(...args) {
      this.writableEnded = true;
      for (const listener of listeners.get("finish") || []) listener();
      return this;
    },
    once(event, callback) {
      const callbacks = listeners.get(event) || [];
      callbacks.push(callback);
      listeners.set(event, callbacks);
      return this;
    }
  };
}

test("real PostgreSQL repository read and advisory lock serialize concurrent writes", {
  skip: !process.env.DATABASE_URL
}, async () => {
  const connectionString = process.env.DATABASE_URL;
  const parsed = new URL(connectionString);
  assert.ok(["localhost", "127.0.0.1", "::1"].includes(parsed.hostname),
    "this test must only use a local disposable PostgreSQL service");
  assert.equal(parsed.pathname, "/infinitwar_test",
    "this test must only use the disposable infinitwar_test database");

  // CI-only setup: create the schema in a throwaway local database. The
  // verification below is read-only and does not insert or update game records.
  const setupPool = new Pool({ connectionString, ssl: false, max: 1 });
  try {
    const schema = await fs.readFile(new URL("../sql/002_postgres_init.sql", import.meta.url), "utf8");
    await setupPool.query(schema);
  } finally {
    await setupPool.end();
  }

  try {
    await initializeRepository({
      NODE_ENV: "test",
      DATA_DRIVER: "postgres",
      DATABASE_URL: connectionString
    });
    assert.equal(getRepositoryMode(), "postgres", "repository must be connected to PostgreSQL, not JSON fallback");

    const snapshot = await readDb();
    assert.ok(snapshot && typeof snapshot === "object", "repository read must return a state object");
    assert.equal(getRepositoryMode(), "postgres", "a read failure must not silently switch to JSON fallback");

    const middleware = createStateWriteLockMiddleware();
    const userMiddleware = createUserLockMiddleware();
    const firstResponse = mockResponse();
    const firstRequest = { method: "POST", user: { sub: "integration-user" } };
    let firstNextCalls = 0;
    await middleware(firstRequest, firstResponse, () => { firstNextCalls++; });
    assert.equal(firstNextCalls, 1);

    let firstRouteCalls = 0;
    await userMiddleware(firstRequest, firstResponse, () => { firstRouteCalls++; });
    assert.equal(firstRouteCalls, 1,
      "route-level user lock must reuse the app-level PostgreSQL lock instead of deadlocking");

    let secondNextCalls = 0;
    const secondResponse = mockResponse();
    const secondRequestData = { method: "POST", user: { sub: "integration-user-2" } };
    const secondRequest = middleware(
      secondRequestData,
      secondResponse,
      () => { secondNextCalls++; }
    );

    await new Promise((resolve) => setTimeout(resolve, 100));
    assert.equal(secondNextCalls, 0,
      "second mutation must wait on PostgreSQL advisory lock, not enter concurrently");

    firstResponse.end();
    await secondRequest;
    assert.equal(secondNextCalls, 1,
      "second mutation must enter only after PostgreSQL advisory lock is released");
    let secondRouteCalls = 0;
    await userMiddleware(secondRequestData, secondResponse, () => { secondRouteCalls++; });
    assert.equal(secondRouteCalls, 1,
      "a later route-level user lock must reuse its request's app-level lock");
    secondResponse.end();
    await new Promise((resolve) => setImmediate(resolve));
  } finally {
    await closeRepository();
  }
});
