import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import test from "node:test";
import { env } from "../src/config/env.js";
import { createUserLockMiddleware } from "../src/middlewares/userLockMiddleware.js";
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

    try {
        await middleware(
            { method: "POST", user: { sub: "guest:concurrency_a" } },
            firstResponse,
            () => { firstEntered = true; }
        );
        assert.equal(firstEntered, true);

        const secondRequest = middleware(
            { method: "POST", user: { sub: "guest:concurrency_b" } },
            secondResponse,
            () => { secondEntered = true; }
        );

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

        const waitingRequest = middleware(
            { method: "POST", user: { sub: "guest:disconnect_b" } },
            waitingResponse,
            () => { waitingHandlerEntered = true; }
        );

        // A dropped client connection must not release the lock while the
        // asynchronous mutation handler may still be writing shared state.
        disconnectedResponse.emit("close");
        await new Promise((resolve) => setTimeout(resolve, 75));
        assert.equal(waitingHandlerEntered, false, "client disconnect must not release an active mutation lock");

        disconnectedResponse.end();
        await waitingRequest;
        assert.equal(waitingHandlerEntered, true, "waiting write proceeds when the first handler ends");
        waitingResponse.end();
    } finally {
        firstResponse.end();
        secondResponse.end();
        disconnectedResponse?.end();
        waitingResponse?.end();
        await closeRepository();
    }
});
