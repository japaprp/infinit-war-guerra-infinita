import assert from "node:assert/strict";
import test from "node:test";
import { createUserLockMiddleware } from "../src/middlewares/userLockMiddleware.js";

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


test("per-user mutation lock is released when the client disconnects before response finish", async () => {
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

  const retryResponse = mockResponse();
  await middleware(request, retryResponse, () => { nextCalls++; });
  assert.equal(nextCalls, 2);
  assert.equal(retryResponse.statusCode, 200);
});
