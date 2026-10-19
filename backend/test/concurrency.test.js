import assert from "node:assert/strict";
import test from "node:test";
import { createStateWriteLockMiddleware, createUserLockMiddleware } from "../src/middlewares/userLockMiddleware.js";

function mockResponse() {
  const listeners = new Map();
  return {
    statusCode: 200,
    body: null,
    writableEnded: false,
    finished: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    end(..._args) {
      this.writableEnded = true;
      return this;
    },
    once(event, callback) {
      const callbacks = listeners.get(event) || [];
      callbacks.push(callback);
      listeners.set(event, callbacks);
      return this;
    },
    on(event, callback) {
      return this.once(event, callback);
    },
    emit(event) {
      for (const callback of listeners.get(event) || []) callback();
    },
    finish() {
      this.finished = true;
      this.emit("finish");
    },
    close() {
      this.emit("close");
    }
  };
}

async function flushRelease() {
  await Promise.resolve();
  await Promise.resolve();
}

test("per-user mutation lock rejects overlapping writes and releases after terminal response", async () => {
  const middleware = createUserLockMiddleware({ ttlSec: 6 });
  const request = { method: "POST", user: { sub: "guest:concurrency-test" } };
  let nextCalls = 0;

  const firstResponse = mockResponse();
  await middleware(request, firstResponse, () => { nextCalls++; });
  assert.equal(nextCalls, 1);

  const overlappingResponse = mockResponse();
  await middleware(request, overlappingResponse, () => { nextCalls++; });
  assert.equal(nextCalls, 1);
  assert.equal(overlappingResponse.statusCode, 429);
  assert.equal(overlappingResponse.body.code, "LOCKED");

  firstResponse.end();
  await flushRelease();

  const afterReleaseResponse = mockResponse();
  await middleware(request, afterReleaseResponse, () => { nextCalls++; });
  assert.equal(nextCalls, 2);
  assert.equal(afterReleaseResponse.statusCode, 200);
  afterReleaseResponse.end();
  await flushRelease();
});

test("client disconnect does not release a per-user lock while handler may still be running", async () => {
  const middleware = createUserLockMiddleware({ ttlSec: 6 });
  const request = { method: "POST", user: { sub: "guest:disconnect-lock-test" } };
  let nextCalls = 0;

  const firstResponse = mockResponse();
  await middleware(request, firstResponse, () => { nextCalls++; });
  firstResponse.close();

  const blockedResponse = mockResponse();
  await middleware(request, blockedResponse, () => { nextCalls++; });
  assert.equal(blockedResponse.statusCode, 429);
  assert.equal(nextCalls, 1);

  firstResponse.end();
  await flushRelease();

  const retryResponse = mockResponse();
  await middleware(request, retryResponse, () => { nextCalls++; });
  assert.equal(retryResponse.statusCode, 200);
  assert.equal(nextCalls, 2);
  retryResponse.end();
  await flushRelease();
});

test("shared database write lock remains held after disconnect until the request terminates", async () => {
  const middleware = createStateWriteLockMiddleware({ ttlSec: 6 });
  const request = { method: "POST", user: { sub: "guest:shared-lock-test" } };
  let nextCalls = 0;

  const firstResponse = mockResponse();
  await middleware(request, firstResponse, () => { nextCalls++; });

  const overlappingResponse = mockResponse();
  await middleware({ ...request, user: { sub: "guest:other-user" } }, overlappingResponse, () => { nextCalls++; });
  assert.equal(overlappingResponse.statusCode, 429);
  assert.equal(overlappingResponse.body.code, "STATE_WRITE_LOCKED");

  firstResponse.close();
  const afterDisconnectResponse = mockResponse();
  await middleware(request, afterDisconnectResponse, () => { nextCalls++; });
  assert.equal(afterDisconnectResponse.statusCode, 429);
  assert.equal(nextCalls, 1);

  firstResponse.end();
  await flushRelease();

  const retryResponse = mockResponse();
  await middleware(request, retryResponse, () => { nextCalls++; });
  assert.equal(retryResponse.statusCode, 200);
  assert.equal(nextCalls, 2);
  retryResponse.end();
  await flushRelease();
});

test("Redis lock release uses atomic compare-and-delete and never GET followed by DEL", async () => {
  const entries = new Map();
  const scripts = [];
  const redisClient = {
    async set(key, owner, _expiry, _ttl, _nx) {
      if (entries.has(key)) return null;
      entries.set(key, owner);
      return "OK";
    },
    async eval(script, _keyCount, key, owner, ttl) {
      scripts.push(script);
      if (script.includes("redis.call('del'")) {
        if (entries.get(key) === owner) {
          entries.delete(key);
          return 1;
        }
        return 0;
      }
      if (script.includes("redis.call('expire'")) {
        return entries.get(key) === owner ? 1 : 0;
      }
      return 0;
    }
  };
  const middleware = createStateWriteLockMiddleware({ redisClient, ttlSec: 30 });
  const response = mockResponse();

  await middleware({ method: "POST" }, response, () => {});
  response.end();
  await flushRelease();

  assert.equal(entries.size, 0);
  assert.ok(scripts.some((script) => script.includes("redis.call('del'") && script.includes("redis.call('get'")));
  assert.ok(scripts.every((script) => !script.includes("GET") && !script.includes("DEL")));
});
