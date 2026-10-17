import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import test from "node:test";
import { env } from "../src/config/env.js";
import { createUserLockMiddleware } from "../src/middlewares/userLockMiddleware.js";
import { closeRepository, initializeRepository } from "../src/repositories/dbRepository.js";

test("PostgreSQL state mutation lock serializes requests across different users", async () => {
    env.NODE_ENV = "production";
    env.DATA_DRIVER = "postgres";
    await initializeRepository(env);

    const middleware = createUserLockMiddleware({ ttlSec: 8 });
    const makeResponse = () => {
        const response = new EventEmitter();
        response.statusCode = 200;
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

        firstResponse.emit("finish");
        await secondRequest;
        assert.equal(secondEntered, true, "second request may proceed after the first releases the lock");
        secondResponse.emit("finish");
    } finally {
        firstResponse.emit("finish");
        secondResponse.emit("finish");
        await closeRepository();
    }
});
