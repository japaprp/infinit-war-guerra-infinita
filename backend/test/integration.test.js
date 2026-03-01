import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "iwar-backend-it-"));
const dbPath = path.join(tmpDir, "db.json");
process.env.IWAR_DB_PATH = dbPath;

const { createApp } = await import("../src/app.js");
const { initializeRepository, getRepositoryMode } = await import("../src/repositories/dbRepository.js");
const { initializeRedis } = await import("../src/services/redisService.js");

const baseEnv = {
    PORT: 0,
    GRPC_PORT: 50051,
    JWT_SECRET: "integration_jwt_secret",
    RECEIPT_SECRET: "integration_receipt_secret",
    DATA_DRIVER: "json",
    MYSQL_HOST: "127.0.0.1",
    MYSQL_PORT: 3306,
    MYSQL_DATABASE: "infinitwar",
    MYSQL_USER: "root",
    MYSQL_PASSWORD: "",
    REDIS_ENABLED: false,
    REDIS_URL: "redis://127.0.0.1:6379"
};

async function bootServer({ redisEnabled = false } = {}) {
    const env = {
        ...baseEnv,
        REDIS_ENABLED: redisEnabled
    };

    await initializeRepository(env);
    const redisClient = await initializeRedis(env);
    const runtime = {
        repositoryMode: getRepositoryMode(),
        redisClient
    };

    const app = createApp(env, runtime);
    const server = await new Promise((resolve) => {
        const instance = app.listen(0, () => resolve(instance));
    });

    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}`;

    const stop = async () => {
        await new Promise((resolve, reject) => {
            server.close((err) => (err ? reject(err) : resolve()));
        });

        if (redisClient) {
            await redisClient.quit().catch(() => {
                redisClient.disconnect();
            });
        }
    };

    return { baseUrl, stop, redisClient };
}

async function api(baseUrl, method, routePath, { token, headers = {}, body } = {}) {
    const finalHeaders = {
        "content-type": "application/json",
        ...headers
    };

    if (token) {
        finalHeaders.authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${baseUrl}${routePath}`, {
        method,
        headers: finalHeaders,
        body: body ? JSON.stringify(body) : undefined
    });

    const payload = await response.json().catch(() => ({}));
    return {
        status: response.status,
        ok: response.ok,
        body: payload
    };
}

test.after(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
});

test("v1 endpoints: heroes and buildings flow", async () => {
    await fs.rm(dbPath, { force: true });

    const server = await bootServer({ redisEnabled: false });
    try {
        const login = await api(server.baseUrl, "POST", "/v1/auth/login", {
            body: { platform: "guest", externalId: "it_slice_1" }
        });
        assert.equal(login.status, 200);
        assert.ok(login.body.accessToken);

        const token = login.body.accessToken;

        const heroes = await api(server.baseUrl, "GET", "/v1/heroes", { token });
        assert.equal(heroes.status, 200);
        assert.ok(Array.isArray(heroes.body.heroes));
        assert.ok(heroes.body.heroes.length >= 2);

        const lucasBefore = heroes.body.heroes.find((hero) => hero.heroId === "lucas");
        assert.ok(lucasBefore);

        const levelUp = await api(server.baseUrl, "POST", "/v1/heroes/lucas/level-up", {
            token,
            body: { levels: 1 }
        });
        assert.equal(levelUp.status, 200);
        assert.equal(levelUp.body.hero.level, lucasBefore.level + 1);

        const startBuild = await api(server.baseUrl, "POST", "/v1/buildings/start", {
            token,
            body: { buildingType: "hq", slotCode: "center", targetLevel: 2 }
        });
        assert.equal(startBuild.status, 200);
        assert.ok(startBuild.body.taskId);

        const speedUp = await api(server.baseUrl, "POST", "/v1/buildings/queue/speed-up", {
            token,
            body: { taskId: startBuild.body.taskId, gemBudgetLimit: 999 }
        });
        assert.equal(speedUp.status, 200);
        assert.equal(speedUp.body.completed, true);

        const complete = await api(server.baseUrl, "POST", "/v1/buildings/complete", {
            token,
            body: { taskId: startBuild.body.taskId }
        });
        assert.equal(complete.status, 200);
        assert.equal(complete.body.building.buildingType, "hq");
        assert.equal(complete.body.building.level, 2);
    } finally {
        await server.stop();
    }
});

test("legacy shop receipt can be consumed only once", async () => {
    await fs.rm(dbPath, { force: true });

    const server = await bootServer({ redisEnabled: false });
    try {
        const session = await api(server.baseUrl, "POST", "/auth/session", {
            body: {
                provider: "guest",
                providerUid: "it_legacy_1",
                email: "",
                displayName: "it_legacy_1"
            }
        });
        assert.equal(session.status, 200);
        assert.ok(session.body.token);

        const token = session.body.token;

        const receipt = await api(server.baseUrl, "POST", "/shop/mock-receipt", {
            token,
            body: { heroId: "kai", packId: "rare_parts_x12", costGems: 20 }
        });
        assert.equal(receipt.status, 200);
        assert.ok(receipt.body.receiptId);
        assert.ok(receipt.body.signature);

        const purchase1 = await api(server.baseUrl, "POST", "/shop/purchase", {
            token,
            body: { receiptId: receipt.body.receiptId, signature: receipt.body.signature }
        });
        assert.equal(purchase1.status, 200);
        assert.equal(purchase1.body.ok, true);

        const purchase2 = await api(server.baseUrl, "POST", "/shop/purchase", {
            token,
            body: { receiptId: receipt.body.receiptId, signature: receipt.body.signature }
        });
        assert.equal(purchase2.status, 409);
        assert.equal(purchase2.body.error, "Receipt already used");
    } finally {
        await server.stop();
    }
});

test("idempotency with Redis persists across server restart", async (t) => {
    await fs.rm(dbPath, { force: true });

    let server = await bootServer({ redisEnabled: true });
    if (!server.redisClient) {
        await server.stop();
        t.skip("Redis nao disponivel para teste de idempotencia.");
        return;
    }

    try {
        const login = await api(server.baseUrl, "POST", "/v1/auth/login", {
            body: { platform: "guest", externalId: "it_idem_1" }
        });
        assert.equal(login.status, 200);
        const token = login.body.accessToken;

        const idempotencyKey = "it-idem-redis-001";
        const headers = { "x-idempotency-key": idempotencyKey };
        const purchaseBody = {
            sku: "pack_speedup_5m",
            quantity: 1,
            idempotencyKey
        };

        const first = await api(server.baseUrl, "POST", "/v1/shop/purchase", {
            token,
            headers,
            body: purchaseBody
        });
        assert.equal(first.status, 200);
        assert.ok(first.body.orderId);

        await server.stop();
        server = await bootServer({ redisEnabled: true });

        const second = await api(server.baseUrl, "POST", "/v1/shop/purchase", {
            token,
            headers,
            body: purchaseBody
        });
        assert.equal(second.status, 200);
        assert.equal(second.body.orderId, first.body.orderId);
        assert.equal(second.body.gemsSpent, first.body.gemsSpent);
    } finally {
        await server.stop();
    }
});
