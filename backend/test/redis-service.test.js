import assert from "node:assert/strict";
import test from "node:test";
import { initializeRedis, closeRedisClient } from "../src/services/redisService.js";

test("production Redis locking fails closed instead of silently using process-local memory", async (t) => {
    await t.test("disabled Redis is rejected in production", async () => {
        await assert.rejects(
            initializeRedis({ NODE_ENV: "production", REDIS_ENABLED: false }),
            /Production requires shared Redis/
        );
    });

    await t.test("unavailable Redis is rejected in production", async () => {
        await assert.rejects(
            initializeRedis({
                NODE_ENV: "production",
                REDIS_ENABLED: true,
                REDIS_URL: "redis://127.0.0.1:1",
            }),
            /Production Redis connection failed; refusing unsafe in-memory lock fallback/
        );
    });

    await t.test("disabled Redis remains available as a development-only fallback", async () => {
        assert.equal(await initializeRedis({ NODE_ENV: "development", REDIS_ENABLED: false }), null);
        await closeRedisClient();
    });
});
