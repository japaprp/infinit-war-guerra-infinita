import assert from "node:assert/strict";
import express, { Router } from "express";
import test from "node:test";
import { wrapAsyncRouteHandlers } from "../src/middlewares/asyncRoute.js";

test("rejected async route handlers reach Express error middleware", async () => {
    const app = express();
    const router = wrapAsyncRouteHandlers(Router());

    router.post("/mutation", async () => {
        throw new Error("simulated persistence failure");
    });

    app.use(router);
    app.use((error, _req, res, _next) => {
        res.status(500).json({ code: "INTERNAL_ERROR", message: error.message });
    });

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
