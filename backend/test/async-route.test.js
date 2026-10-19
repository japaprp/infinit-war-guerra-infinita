import assert from "node:assert/strict";
import express, { Router } from "express";
import test from "node:test";
import { wrapAsyncRouteHandlers } from "../src/middlewares/asyncRoute.js";
import { createIdempotencyMiddleware } from "../src/middlewares/idempotencyMiddleware.js";

test("rejected async route handlers reach Express error middleware", async () => {
    const app = express();
    const router = wrapAsyncRouteHandlers(Router());

    router.post("/mutation", async () => {
        throw new Error("simulated persistence failure");
    });

    router.use(async (error, _req, res, _next) => {
        await Promise.resolve();
        res.status(500).json({ code: "INTERNAL_ERROR", message: error.message });
    });
    app.use(router);

    const server = await new Promise((resolve) => {
        const instance = app.listen(0, () => resolve(instance));
    });

    try {
        const response = await fetch(`http://127.0.0.1:${server.address().port}/mutation`, {
            method: "POST"
        });
        assert.equal(response.status, 500);
        assert.deepEqual(await response.json(), {
            code: "INTERNAL_ERROR",
            message: "simulated persistence failure"
        });
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => error ? reject(error) : resolve());
        });
    }
});


test("Redis idempotency response is stored before a serialized mutation releases its lock", async () => {
    const cache = new Map();
    const redisClient = {
        async get(key) {
            return cache.get(key) ?? null;
        },
        async set(key, value) {
            await new Promise((resolve) => setTimeout(resolve, 30));
            cache.set(key, value);
            return "OK";
        }
    };

    const app = express();
    const router = wrapAsyncRouteHandlers(Router());
    const idempotency = createIdempotencyMiddleware({ redisClient });
    let mutationCount = 0;
    let queue = Promise.resolve();

    const serializedMutation = async (_req, res, next) => {
        const previous = queue;
        let release;
        queue = new Promise((resolve) => { release = resolve; });
        await previous;
        res.once("finish", release);
        next();
    };

    router.post("/purchase", serializedMutation, idempotency, async (_req, res) => {
        mutationCount += 1;
        await new Promise((resolve) => setTimeout(resolve, 5));
        res.json({ orderId: "order_single", mutationCount });
    });

    let retryableCalls = 0;
    router.post("/retryable", serializedMutation, idempotency, async (_req, res) => {
        retryableCalls += 1;
        if (retryableCalls === 1) throw new Error("temporary persistence failure");
        res.json({ recovered: true, retryableCalls });
    });
    router.use(async (error, _req, res, _next) => {
        res.status(500).json({ code: "INTERNAL_ERROR", message: error.message });
    });
    app.use(router);

    const server = await new Promise((resolve) => {
        const instance = app.listen(0, () => resolve(instance));
    });

    try {
        const url = `http://127.0.0.1:${server.address().port}/purchase`;
        const headers = { "x-idempotency-key": "redis-concurrent-key" };
        const [firstResponse, secondResponse] = await Promise.all([
            fetch(url, { method: "POST", headers }),
            fetch(url, { method: "POST", headers })
        ]);

        assert.equal(firstResponse.status, 200);
        assert.equal(secondResponse.status, 200);
        const [firstBody, secondBody] = await Promise.all([firstResponse.json(), secondResponse.json()]);
        assert.deepEqual(secondBody, firstBody, "the retry must replay the first response");
        assert.equal(mutationCount, 1, "concurrent retries must not execute the mutation twice");
        assert.equal(cache.size, 1, "the replayable response must be in Redis before the first response finishes");

        const retryUrl = `http://127.0.0.1:${server.address().port}/retryable`;
        const failedAttempt = await fetch(retryUrl, { method: "POST", headers });
        assert.equal(failedAttempt.status, 500);
        const recoveredAttempt = await fetch(retryUrl, { method: "POST", headers });
        assert.equal(recoveredAttempt.status, 200, "a transient 5xx must not be cached as the final idempotent result");
        assert.deepEqual(await recoveredAttempt.json(), { recovered: true, retryableCalls: 2 });
        assert.equal(retryableCalls, 2);
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => error ? reject(error) : resolve());
        });
    }
});


test("Redis idempotency read failure fails closed before running a mutation", async () => {
    const app = express();
    const router = wrapAsyncRouteHandlers(Router());
    const idempotency = createIdempotencyMiddleware({
        redisClient: {
            async get() { throw new Error("Redis unavailable"); },
            async set() { throw new Error("Redis unavailable"); }
        }
    });
    let mutationCount = 0;
    router.post("/purchase", idempotency, async (_req, res) => {
        mutationCount += 1;
        res.json({ ok: true });
    });
    app.use(router);

    const server = await new Promise((resolve) => {
        const instance = app.listen(0, () => resolve(instance));
    });

    try {
        const response = await fetch(`http://127.0.0.1:${server.address().port}/purchase`, {
            method: "POST",
            headers: { "x-idempotency-key": "redis-read-failure" }
        });
        assert.equal(response.status, 503);
        assert.equal((await response.json()).code, "IDEMPOTENCY_UNAVAILABLE");
        assert.equal(mutationCount, 0, "the mutation must not run when a prior result cannot be checked");
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => error ? reject(error) : resolve());
        });
    }
});

test("same-process idempotency fallback protects retries when Redis writes fail", async () => {
    const app = express();
    const router = wrapAsyncRouteHandlers(Router());
    const redisClient = {
        async get() { return null; },
        async set() { throw new Error("Redis write unavailable"); }
    };
    const idempotency = createIdempotencyMiddleware({ redisClient });
    let mutationCount = 0;
    router.post("/purchase", idempotency, async (_req, res) => {
        mutationCount += 1;
        res.json({ orderId: "local-fallback-order", mutationCount });
    });
    app.use(router);

    const server = await new Promise((resolve) => {
        const instance = app.listen(0, () => resolve(instance));
    });

    try {
        const url = `http://127.0.0.1:${server.address().port}/purchase`;
        const headers = { "x-idempotency-key": "redis-write-failure" };
        const firstResponse = await fetch(url, { method: "POST", headers });
        const secondResponse = await fetch(url, { method: "POST", headers });
        assert.equal(firstResponse.status, 200);
        assert.equal(secondResponse.status, 200);
        const firstBody = await firstResponse.json();
        const secondBody = await secondResponse.json();
        assert.deepEqual(secondBody, firstBody);
        assert.equal(mutationCount, 1);
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => error ? reject(error) : resolve());
        });
    }
});


test("invalid idempotency key lengths are rejected before a mutation runs", async () => {
    const app = express();
    const router = wrapAsyncRouteHandlers(Router());
    const idempotency = createIdempotencyMiddleware();
    let mutationCount = 0;

    router.post("/mutation", idempotency, async (_req, res) => {
        mutationCount += 1;
        res.json({ ok: true });
    });
    app.use(router);

    const server = await new Promise((resolve) => {
        const instance = app.listen(0, () => resolve(instance));
    });

    try {
        const response = await fetch(`http://127.0.0.1:${server.address().port}/mutation`, {
            method: "POST",
            headers: { "x-idempotency-key": "k".repeat(201) }
        });
        assert.equal(response.status, 400);
        assert.equal((await response.json()).code, "INVALID_IDEMPOTENCY_KEY");
        assert.equal(mutationCount, 0, "invalid idempotency keys must not reach the mutation handler");
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => error ? reject(error) : resolve());
        });
    }
});
