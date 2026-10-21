import assert from "node:assert/strict";
import test from "node:test";
import { getRepositoryMode, initializeRepository, runSnapshotTransaction } from "../src/repositories/dbRepository.js";

test("production PostgreSQL initialization refuses invalid URLs instead of falling back to JSON", async () => {
  await assert.rejects(
    initializeRepository({
      NODE_ENV: "production",
      DATA_DRIVER: "postgres",
      DATABASE_URL: "not-a-postgres-url",
      JWT_SECRET: "jwt-secret-that-is-long-enough-12345",
      RECEIPT_SECRET: "receipt-secret-that-is-long-enough-123",
      FIREBASE_PROJECT_ID: "infinit-war-test",
      CORS_ORIGINS: "https://game.example.test"
    }),
    /Production database initialization failed; refusing JSON fallback/
  );
  assert.equal(getRepositoryMode(), "json");
});

test("snapshot transaction commits only after normalized tables and app_state both succeed", async () => {
  const events = [];
  const connection = {
    async beginTransaction() { events.push("begin"); },
    async commit() { events.push("commit"); },
    async rollback() { events.push("rollback"); }
  };

  await runSnapshotTransaction(connection, async () => {
    events.push("normalized:start");
    events.push("normalized:done");
    events.push("app_state:start");
    events.push("app_state:done");
  });

  assert.deepEqual(events, [
    "begin",
    "normalized:start",
    "normalized:done",
    "app_state:start",
    "app_state:done",
    "commit"
  ]);
});

test("snapshot transaction rolls back normalized writes if app_state write fails", async () => {
  const events = [];
  const connection = {
    async beginTransaction() { events.push("begin"); },
    async commit() { events.push("commit"); },
    async rollback() { events.push("rollback"); }
  };

  await assert.rejects(
    runSnapshotTransaction(connection, async () => {
      events.push("normalized:done");
      events.push("app_state:failed");
      throw new Error("simulated app_state failure");
    }),
    /simulated app_state failure/
  );

  assert.deepEqual(events, ["begin", "normalized:done", "app_state:failed", "rollback"]);
  assert.equal(events.includes("commit"), false);
});
