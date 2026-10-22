import assert from "node:assert/strict";
import test from "node:test";
import { createStateWriteLockMiddleware, createUserLockMiddleware } from "../src/middlewares/userLockMiddleware.js";

function mockResponse() {
  const listeners = new Map();
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    on(event, callback) {
      const callbacks = listeners.get(event) || [];
      callbacks.push(callback);
      listeners.set(event, callbacks);
      return this;
    },
    finish() { for (const callback of listeners.get("finish") || []) callback(); },
    close() { for (const callback of listeners.get("close") || []) callback(); }
  };
}

class FakeRedis {
  constructor() {
    this.now = 0;
    this.values = new Map();
  }

  purge(key) {
    const entry = this.values.get(key);
    if (entry && entry.expiresAt <= this.now) this.values.delete(key);
  }

  async set(key, value, expiryMode, ttl, nxMode) {
    this.purge(key);
    if (nxMode === "NX" && this.values.has(key)) return null;
    this.values.set(key, { value, expiresAt: this.now + Number(ttl) * 1000 });
    return "OK";
  }

  async get(key) {
    this.purge(key);
    return this.values.get(key)?.value ?? null;
  }

  async eval(script, keyCount, key, owner, ttl) {
    this.purge(key);
    const entry = this.values.get(key);
    if (!entry || entry.value !== owner) return 0;
    if (script.includes('redis.call("expire"')) {
      entry.expiresAt = this.now + Number(ttl) * 1000;
      return 1;
    }
    if (script.includes('redis.call("del"')) {
      this.values.delete(key);
      return 1;
    }
    throw new Error("Unexpected Lua script");
  }

  forceSet(key, value, ttlSec = 30) {
    this.values.set(key, { value, expiresAt: this.now + ttlSec * 1000 });
  }

  advance(ms) { this.now += ms; }
}

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

test("per-user mutation lock rejects overlapping writes and releases after response finish", async () => {
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

  firstResponse.finish();
  await flush();

  const afterReleaseResponse = mockResponse();
  await middleware(request, afterReleaseResponse, () => { nextCalls++; });
  assert.equal(nextCalls, 2);
  afterReleaseResponse.finish();
});

test("client disconnect does not release a per-user lock while the handler may still be running", async () => {
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

  firstResponse.json({ ok: true });
  await flush();
  const retryResponse = mockResponse();
  await middleware(request, retryResponse, () => { nextCalls++; });
  assert.equal(retryResponse.statusCode, 200);
  assert.equal(nextCalls, 2);
  retryResponse.finish();
});

test("shared database write lock remains held across lease renewal after the original TTL window", async () => {
  const redisClient = new FakeRedis();
  const middleware = createStateWriteLockMiddleware({ redisClient, ttlSec: 1, renewIntervalMs: 5 });
  const request = { method: "POST", user: { sub: "guest:shared-lock-test" } };
  let nextCalls = 0;

  const firstResponse = mockResponse();
  await middleware(request, firstResponse, () => { nextCalls++; });
  const originalExpiry = redisClient.values.get("lock:database:write").expiresAt;

  redisClient.advance(800);
  await new Promise(resolve => setTimeout(resolve, 15));
  const renewedExpiry = redisClient.values.get("lock:database:write").expiresAt;
  assert.ok(renewedExpiry > originalExpiry, "lease should be renewed before its original expiry");

  redisClient.advance(400);
  const overlappingResponse = mockResponse();
  await middleware({ ...request, user: { sub: "guest:other-user" } }, overlappingResponse, () => { nextCalls++; });
  assert.equal(overlappingResponse.statusCode, 429);
  assert.equal(overlappingResponse.body.code, "STATE_WRITE_LOCKED");
  assert.equal(nextCalls, 1);

  firstResponse.json({ ok: true });
  await flush();
  const retryResponse = mockResponse();
  await middleware(request, retryResponse, () => { nextCalls++; });
  assert.equal(retryResponse.statusCode, 200);
  assert.equal(nextCalls, 2);
  retryResponse.finish();
});

test("stale lock owner cannot delete a replacement lock after expiry", async () => {
  const redisClient = new FakeRedis();
  const middleware = createStateWriteLockMiddleware({ redisClient, ttlSec: 1, renewIntervalMs: 100000 });
  const firstResponse = mockResponse();
  await middleware({ method: "POST" }, firstResponse, () => {});

  const key = "lock:database:write";
  const oldOwner = redisClient.values.get(key).value;
  redisClient.advance(1001);
  redisClient.forceSet(key, "new-owner", 30);

  firstResponse.json({ ok: true });
  await flush();
  assert.equal(await redisClient.get(key), "new-owner", "release by the stale owner must preserve the new owner's lock");
});

test("shared database write lock fails closed when Redis cannot confirm acquisition", async () => {
  const redisClient = {
    async set() { throw new Error("simulated Redis outage"); }
  };
  const middleware = createStateWriteLockMiddleware({ redisClient });
  let nextCalls = 0;
  const response = mockResponse();

  await middleware({ method: "POST", user: { sub: "guest:redis-outage-test" } }, response, () => { nextCalls++; });

  assert.equal(response.statusCode, 503);
  assert.equal(response.body.code, "STATE_LOCK_UNAVAILABLE");
  assert.equal(nextCalls, 0, "mutation handler must not run without a confirmed shared lock");
});

test("shared database write lock is not released by client disconnect", async () => {
  const middleware = createStateWriteLockMiddleware({ ttlSec: 6 });
  const request = { method: "POST", user: { sub: "guest:disconnect-state-lock-test" } };
  let nextCalls = 0;

  const firstResponse = mockResponse();
  await middleware(request, firstResponse, () => { nextCalls++; });
  firstResponse.close();

  const overlappingResponse = mockResponse();
  await middleware({ ...request, user: { sub: "guest:other-user" } }, overlappingResponse, () => { nextCalls++; });
  assert.equal(overlappingResponse.statusCode, 429);
  assert.equal(overlappingResponse.body.code, "STATE_WRITE_LOCKED");
  assert.equal(nextCalls, 1);

  firstResponse.json({ ok: true });
  await flush();
  const retryResponse = mockResponse();
  await middleware(request, retryResponse, () => { nextCalls++; });
  assert.equal(retryResponse.statusCode, 200);
  assert.equal(nextCalls, 2);
  retryResponse.finish();
});
