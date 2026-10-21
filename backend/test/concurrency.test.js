import assert from "node:assert/strict";
import test from "node:test";
import { createStateWriteLockMiddleware, createUserLockMiddleware } from "../src/middlewares/userLockMiddleware.js";

function mockResponse() {
  const listeners = new Map();
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    on(event, callback) {
      listeners.set(event, callback);
      return this;
    },
    finish() {
      listeners.get("finish")?.();
    },
    close() {
      listeners.get("close")?.();
    }
  };
}

test("per-user mutation lock rejects overlapping writes and releases after response finish", async () => {
  const middleware = createUserLockMiddleware({ ttlSec: 6 });
  const request = { method: "POST", user: { sub: "guest:concurrency-test" } };
  let nextCalls = 0;

  const firstResponse = mockResponse();
  await middleware(request, firstResponse, () => { nextCalls++; });
  assert.equal(nextCalls, 1);
  assert.equal(firstResponse.statusCode, 200);

  const overlappingResponse = mockResponse();
  await middleware(request, overlappingResponse, () => { nextCalls++; });
  assert.equal(nextCalls, 1);
  assert.equal(overlappingResponse.statusCode, 429);
  assert.equal(overlappingResponse.body.code, "LOCKED");

  firstResponse.finish();

  const afterReleaseResponse = mockResponse();
  await middleware(request, afterReleaseResponse, () => { nextCalls++; });
  assert.equal(nextCalls, 2);
  assert.equal(afterReleaseResponse.statusCode, 200);
});


test("per-user mutation lock stays held after disconnect until the handler completes", async () => {
  const middleware = createUserLockMiddleware({ ttlSec: 6 });
  const request = { method: "POST", user: { sub: "guest:disconnect-lock-test" } };
  let nextCalls = 0;

  const disconnectedResponse = mockResponse();
  await middleware(request, disconnectedResponse, () => { nextCalls++; });
  assert.equal(nextCalls, 1);

  const blockedResponse = mockResponse();
  await middleware(request, blockedResponse, () => { nextCalls++; });
  assert.equal(blockedResponse.statusCode, 429);

  disconnectedResponse.close();

  const stillBlocked = mockResponse();
  await middleware(request, stillBlocked, () => { nextCalls++; });
  assert.equal(stillBlocked.statusCode, 429);
  assert.equal(stillBlocked.body.code, "LOCKED");

  // Simulate the handler finishing its awaited write and attempting its response.
  disconnectedResponse.json({ committed: true });
  await new Promise((resolve) => setImmediate(resolve));
  const retryResponse = mockResponse();
  await middleware(request, retryResponse, () => { nextCalls++; });
  assert.equal(nextCalls, 2);
  assert.equal(retryResponse.statusCode, 200);
});


test("shared database write lock remains held after disconnect until the write handler completes", async () => {
  const middleware = createStateWriteLockMiddleware({ ttlSec: 6 });
  const request = { method: "POST", user: { sub: "guest:shared-lock-test" } };
  let nextCalls = 0;

  const firstResponse = mockResponse();
  await middleware(request, firstResponse, () => { nextCalls++; });
  assert.equal(nextCalls, 1);

  const overlappingResponse = mockResponse();
  await middleware({ ...request, user: { sub: "guest:other-user" } }, overlappingResponse, () => { nextCalls++; });
  assert.equal(overlappingResponse.statusCode, 429);
  assert.equal(overlappingResponse.body.code, "STATE_WRITE_LOCKED");

  firstResponse.close();

  const stillBlocked = mockResponse();
  await middleware({ ...request, user: { sub: "guest:other-user" } }, stillBlocked, () => { nextCalls++; });
  assert.equal(stillBlocked.statusCode, 429);
  assert.equal(stillBlocked.body.code, "STATE_WRITE_LOCKED");

  // Simulate completion of the database write after the client has gone away.
  firstResponse.json({ committed: true });
  await new Promise((resolve) => setImmediate(resolve));
  const retryResponse = mockResponse();
  await middleware(request, retryResponse, () => { nextCalls++; });
  assert.equal(nextCalls, 2);
  assert.equal(retryResponse.statusCode, 200);
});
