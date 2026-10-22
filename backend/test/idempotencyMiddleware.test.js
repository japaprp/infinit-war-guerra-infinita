import test from "node:test";
import assert from "node:assert/strict";
import { createIdempotencyMiddleware } from "../src/middlewares/idempotencyMiddleware.js";

function makeResponse(statusCode = 200) {
    return {
        statusCode,
        body: undefined,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        }
    };
}

function makeRedis() {
    const entries = new Map();
    return {
        entries,
        async get(key) {
            return entries.get(key) ?? null;
        },
        async set(key, value) {
            entries.set(key, value);
            return "OK";
        }
    };
}

test("idempotency does not cache transient non-2xx responses", async () => {
    const redisClient = makeRedis();
    const middleware = createIdempotencyMiddleware({ redisClient });
    const req = {
        method: "POST",
        headers: { "x-idempotency-key": "retry-after-lock" },
        user: { sub: "synthetic-user" },
        path: "/v1/shop/purchase"
    };
    const res = makeResponse(429);
    let nextCalled = false;

    await middleware(req, res, () => { nextCalled = true; });
    assert.equal(nextCalled, true);
    res.status(429).json({ code: "LOCKED" });
    await new Promise((resolve) => setImmediate(resolve));

    assert.equal(res.body.code, "LOCKED");
    assert.equal(redisClient.entries.size, 0);

    const retryResponse = makeResponse();
    await middleware(req, retryResponse, () => { nextCalled = true; });
    assert.equal(retryResponse.body, undefined, "retry must reach the handler, not replay the transient error");
});

test("idempotency still caches successful responses", async () => {
    const redisClient = makeRedis();
    const middleware = createIdempotencyMiddleware({ redisClient });
    const req = {
        method: "POST",
        headers: { "x-idempotency-key": "successful-purchase" },
        user: { sub: "synthetic-user" },
        path: "/v1/shop/purchase"
    };
    const res = makeResponse(200);

    await middleware(req, res, () => {});
    res.json({ orderId: "synthetic-order-1" });
    await new Promise((resolve) => setImmediate(resolve));

    assert.equal(redisClient.entries.size, 1);
    const replayResponse = makeResponse();
    await middleware(req, replayResponse, () => {
        assert.fail("successful idempotent response should be replayed from cache");
    });
    assert.equal(replayResponse.statusCode, 200);
    assert.deepEqual(replayResponse.body, { orderId: "synthetic-order-1" });
});
