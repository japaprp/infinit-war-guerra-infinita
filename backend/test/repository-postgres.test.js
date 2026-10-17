import assert from "node:assert/strict";
import test from "node:test";
import { getRepositoryMode, initializeRepository } from "../src/repositories/dbRepository.js";

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
