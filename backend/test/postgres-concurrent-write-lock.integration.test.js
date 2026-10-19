import assert from "node:assert/strict";
import express, { Router } from "express";
import { EventEmitter } from "node:events";
import test from "node:test";
import { env } from "../src/config/env.js";
import { createUserLockMiddleware } from "../src/middlewares/userLockMiddleware.js";
import { wrapAsyncRouteHandlers } from "../src/middlewares/asyncRoute.js";
import { createIdempotencyMiddleware } from "../src/middlewares/idempotencyMiddleware.js";
import { closeRepository, initializeRepository, readDb, writeDb } from "../src/repositories/dbRepository.js";
import { ensureUser, ensureV1State, getUserId } from "../src/services/userService.js";
import { startMarch } from "../src/services/v1StubService.js";

test("PostgreSQL preserves marches, serializes writes, and survives client disconnects", async () => {
    env.NODE_ENV = "production";
    env.DATA_DRIVER = "postgres";
    await initializeRepository(env);

    const middleware = createUserLockMiddleware({ ttlSec: 8 });
    const makeResponse = () => {
        const response = new EventEmitter();
        response.statusCode = 200;
        response.end = (...args) => {
            response.emit("finish");
            return response;
        };
        response.status = (statusCode) => {
            response.statusCode = statusCode;
            return response;
        };
        response.json = (body) => {
            response.body = body;
            return response;
        };
        return response;
    };

    const firstResponse = makeResponse();
    const secondResponse = makeResponse();
    let firstEntered = false;
    let secondEntered = false;
    let disconnectedResponse;
    let waitingResponse;
    const pendingRequests = [];
    let secondRequest;
    let waitingRequest;

    try {
        // The march must survive a fresh repository/pool instance, not just a
        // JSON-file restart or a read from the in-memory object we just mutated.
        const marchUserId = getUserId("guest", `march-persistence-${Date.now()}`);
        const dbBeforeMarch = await readDb();
        const marchUser = ensureUser(dbBeforeMarch, marchUserId, {
            provider: "guest",
            providerUid: marchUserId.slice("guest:".length),
            email: "",
            displayName: "March Persistence Test"
        });
        ensureV1State(marchUser);
        const expectedMarch = startMarch(marchUser, {
            origin: { x: 1, y: 2 },
            target: { x: 3, y: 4 },
            units: { infantry: 10 }
        });
        marchUser.v1.marchIdempotency = {
            persisted_retry_key: {
                requestFingerprint: "test-fingerprint",
                march: expectedMarch,
                expiresAtMs: Date.now() + 300000
            }
        };
        await writeDb(dbBeforeMarch);
        await closeRepository();
        await initializeRepository(env);
        const dbAfterRestart = await readDb();
        assert.deepEqual(
            dbAfterRestart.users[marchUserId]?.v1?.marches,
            [expectedMarch],
            "marches must survive a PostgreSQL repository restart and normalized-table read"
        );
        const persistedIdempotency = dbAfterRestart.users[marchUserId]?.v1?.marchIdempotency?.persisted_retry_key;
        assert.equal(persistedIdempotency?.requestFingerprint, "test-fingerprint");
        assert.deepEqual(persistedIdempotency?.march, expectedMarch);
        assert.ok(persistedIdempotency?.expiresAtMs > Date.now(), "the persisted retry record must remain valid after restart");

        await middleware(
            { method: "POST", user: { sub: "guest:concurrency_a" } },
            firstResponse,
            () => { firstEntered = true; }
        );
        assert.equal(firstEntered, true);

        secondRequest = middleware(
            { method: "POST", user: { sub: "guest:concurrency_b" } },
            secondResponse,
            () => { secondEntered = true; }
        );
        pendingRequests.push(secondRequest);

        // Let the second middleware reach PostgreSQL's advisory-lock wait.
        await new Promise((resolve) => setTimeout(resolve, 75));
        assert.equal(secondEntered, false, "different players must not mutate the shared snapshot concurrently");

        firstResponse.end();
        await secondRequest;
        assert.equal(secondEntered, true, "second request may proceed after the first releases the lock");
        secondResponse.end();

        disconnectedResponse = makeResponse();
        waitingResponse = makeResponse();
        let disconnectedHandlerEntered = false;
        let waitingHandlerEntered = false;

        await middleware(
            { method: "POST", user: { sub: "guest:disconnect_a" } },
            disconnectedResponse,
            () => { disconnectedHandlerEntered = true; }
        );
        assert.equal(disconnectedHandlerEntered, true);

        waitingRequest = middleware(
            { method: "POST", user: { sub: "guest:disconnect_b" } },
            waitingResponse,
            () => { waitingHandlerEntered = true; }
        );
        pendingRequests.push(waitingRequest);

        // A dropped client connection must not release the lock while the
        // asynchronous mutation handler may still be writing shared state.
        disconnectedResponse.emit("close");
        await new Promise((resolve) => setTimeout(resolve, 75));
        assert.equal(waitingHandlerEntered, false, "client disconnect must not release an active mutation lock");

        disconnectedResponse.end();
        await waitingRequest;
        assert.equal(waitingHandlerEntered, true, "waiting write proceeds when the first handler ends");
        waitingResponse.end();

        // A rejected async handler must reach Express error middleware, end the
        // response, and release the PostgreSQL lock so a later writer can proceed.
        const app = express();
        const errorRouter = wrapAsyncRouteHandlers(Router());
        let failingHandlerCalls = 0;
        errorRouter.post("/mutate", middleware, async (_req, res) => {
            failingHandlerCalls += 1;
            if (failingHandlerCalls === 1) {
                throw new Error("simulated persistence failure");
            }
            res.json({ ok: true });
        });
        app.use(errorRouter);

        const idempotencyRouter = wrapAsyncRouteHandlers(Router());
        const idempotency = createIdempotencyMiddleware();
        let mutationCount = 0;
        idempotencyRouter.post("/idempotent-mutate", middleware, idempotency, async (_req, res) => {
            mutationCount += 1;
            await new Promise((resolve) => setTimeout(resolve, 50));
            res.json({ operationId: "single-operation", mutationCount });
        });
        app.use(idempotencyRouter);
        app.use((error, _req, res, _next) => {
            res.status(500).json({ code: "INTERNAL_ERROR", message: error.message });
        });
        const server = await new Promise((resolve) => {
            const instance = app.listen(0, () => resolve(instance));
        });
        try {
            const baseUrl = `http://127.0.0.1:${server.address().port}`;
            const failedResponse = await fetch(`${baseUrl}/mutate`, { method: "POST" });
            assert.equal(failedResponse.status, 500);
            assert.deepEqual(await failedResponse.json(), {
                code: "INTERNAL_ERROR",
                message: "simulated persistence failure"
            });

            const recoveredResponse = await fetch(`${baseUrl}/mutate`, { method: "POST" });
            assert.equal(recoveredResponse.status, 200, "a subsequent writer must acquire the lock after a handler failure");
            assert.deepEqual(await recoveredResponse.json(), { ok: true });

            const headers = { "content-type": "application/json", "x-idempotency-key": "same-concurrent-operation" };
            const [firstReplay, secondReplay] = await Promise.all([
                fetch(`${baseUrl}/idempotent-mutate`, { method: "POST", headers, body: "{}" }),
                fetch(`${baseUrl}/idempotent-mutate`, { method: "POST", headers, body: "{}" })
            ]);
            assert.equal(firstReplay.status, 200);
            assert.equal(secondReplay.status, 200);
            const [firstBody, secondBody] = await Promise.all([firstReplay.json(), secondReplay.json()]);
            assert.deepEqual(secondBody, firstBody, "concurrent retries must receive the original operation response");
            assert.equal(mutationCount, 1, "the same idempotency key must execute the mutation exactly once");
        } finally {
            await new Promise((resolve, reject) => {
                server.close((error) => error ? reject(error) : resolve());
            });
        }
    } finally {
        firstResponse.end();
        disconnectedResponse?.end();
        await Promise.allSettled(pendingRequests);
        secondResponse.end();
        waitingResponse?.end();
        await closeRepository();
    }
});
