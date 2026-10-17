import assert from "node:assert/strict";
import express, { Router } from "express";
import { EventEmitter } from "node:events";
import test from "node:test";
import { env } from "../src/config/env.js";
import { createUserLockMiddleware } from "../src/middlewares/userLockMiddleware.js";
import { wrapAsyncRouteHandlers } from "../src/middlewares/asyncRoute.js";
import { closeRepository, initializeRepository } from "../src/repositories/dbRepository.js";

test("PostgreSQL state mutation lock serializes writes and survives client disconnects", async () => {
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
