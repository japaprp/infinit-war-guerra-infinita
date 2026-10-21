import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "iwar-map-game-"));
const dbPath = path.join(tmpDir, "db.json");
process.env.IWAR_DB_PATH = dbPath;

const { createApp } = await import("../src/app.js");
const { initializeRepository, readDb, writeDb } = await import("../src/repositories/dbRepository.js");
const { closeRedisClient, initializeRedis } = await import("../src/services/redisService.js");

const env = {
    PORT: 0,
    NODE_ENV: "test",
    JWT_SECRET: "map-game-integration-secret",
    RECEIPT_SECRET: "map-game-receipt-secret",
    DATA_DRIVER: "json",
    REDIS_ENABLED: false,
    REDIS_URL: "redis://127.0.0.1:6379"
};

async function bootServer() {
    await initializeRepository(env);
    const redisClient = await initializeRedis(env);
    const app = createApp(env, { repositoryMode: "json", redisClient });
    const server = await new Promise((resolve) => {
        const instance = app.listen(0, () => resolve(instance));
    });
    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    return {
        baseUrl,
        async stop() {
            await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
            await closeRedisClient(redisClient);
        }
    };
}

async function api(baseUrl, method, route, { token, body, headers = {} } = {}) {
    const response = await fetch(`${baseUrl}${route}`, {
        method,
        headers: {
            "content-type": "application/json",
            ...(token ? { authorization: `Bearer ${token}` } : {}),
            ...headers
        },
        body: body === undefined ? undefined : JSON.stringify(body)
    });
    return { status: response.status, body: await response.json().catch(() => ({})) };
}

async function login(baseUrl, externalId) {
    const response = await api(baseUrl, "POST", "/v1/auth/login", { body: { provider: "guest", externalId } });
    assert.equal(response.status, 200);
    return response.body.accessToken;
}

test.after(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
});

test("map hunt is authenticated, time-gated, recoverable after restart, and rewarded once", async () => {
    await fs.rm(dbPath, { force: true });
    let server = await bootServer();
    try {
        const token = await login(server.baseUrl, "hunt-player");
        const zeroTroops = await api(server.baseUrl, "POST", "/v1/world/hunts/start", {
            token,
            body: { targetId: "mutant-scavenger-01", heroIds: ["lucas"], troopCount: 0, operationId: "hunt-zero-troops" }
        });
        assert.equal(zeroTroops.status, 400);

        const start = await api(server.baseUrl, "POST", "/v1/world/hunts/start", {
            token,
            body: { targetId: "mutant-scavenger-01", heroIds: ["lucas"], troopCount: 100, operationId: "hunt-integration-1" }
        });
        assert.equal(start.status, 200);
        assert.equal(start.body.status, "IN_PROGRESS");
        assert.equal(start.body.resources.energy, 90);

        const startReplay = await api(server.baseUrl, "POST", "/v1/world/hunts/start", {
            token,
            body: { targetId: "mutant-scavenger-01", heroIds: ["lucas"], troopCount: 100, operationId: "hunt-integration-1" }
        });
        assert.equal(startReplay.status, 200);
        assert.equal(startReplay.body.replayed, true);
        assert.equal(startReplay.body.resources.energy, 90);

        await server.stop();
        server = await bootServer();
        const afterRestart = await readDb();
        const recoveredHunt = afterRestart.users["guest:hunt-player"].v1.gameData.hunts["hunt-integration-1"];
        assert.equal(recoveredHunt.status, "IN_PROGRESS");
        assert.equal(afterRestart.users["guest:hunt-player"].v1.resources.energy, 90);

        const early = await api(server.baseUrl, "POST", "/v1/world/hunts/hunt-integration-1/resolve", { token, body: {} });
        assert.equal(early.status, 409);

        const db = await readDb();
        db.users["guest:hunt-player"].v1.gameData.hunts["hunt-integration-1"].endsAtMs = Date.now() - 1;
        await writeDb(db);

        const first = await api(server.baseUrl, "POST", "/v1/world/hunts/hunt-integration-1/resolve", { token, body: {} });
        assert.equal(first.status, 200);
        assert.ok(["victory", "defeat"].includes(first.body.result.outcome));
        const goldAfterFirst = first.body.resources.gold;

        const replay = await api(server.baseUrl, "POST", "/v1/world/hunts/hunt-integration-1/resolve", { token, body: {} });
        assert.equal(replay.status, 200);
        assert.equal(replay.body.replayed, true);
        assert.equal(replay.body.resources.gold, goldAfterFirst);

        const history = await api(server.baseUrl, "GET", "/v1/world/battle-history?limit=20", { token });
        assert.equal(history.status, 200);
        assert.equal(history.body.battles.length, 1);
        assert.equal(history.body.battles[0].operationId, "hunt-integration-1");
    } finally {
        await server.stop();
    }
});

test("alliance rally enforces membership, leadership, timing, and individual one-time rewards", async () => {
    await fs.rm(dbPath, { force: true });
    const server = await bootServer();
    try {
        const leader = await login(server.baseUrl, "rally-leader");
        const member = await login(server.baseUrl, "rally-member");
        const outsider = await login(server.baseUrl, "rally-outsider");

        const deniedCreate = await api(server.baseUrl, "POST", "/v1/world/alliance-rallies", {
            token: leader,
            body: { targetId: "scavenger-camp", heroIds: ["lucas"], troopCount: 200, operationId: "rally-denied" }
        });
        assert.equal(deniedCreate.status, 409);

        const createAlliance = await api(server.baseUrl, "POST", "/v1/alliances", {
            token: leader,
            body: { name: "Test Alliance", tag: "TST", languageCode: "pt-BR" }
        });
        assert.equal(createAlliance.status, 200);
        const allianceId = createAlliance.body.allianceId;
        const joinAlliance = await api(server.baseUrl, "POST", `/v1/alliances/${allianceId}/join`, { token: member, body: {} });
        assert.equal(joinAlliance.status, 200);

        const create = await api(server.baseUrl, "POST", "/v1/world/alliance-rallies", {
            token: leader,
            body: { targetId: "scavenger-camp", heroIds: ["lucas"], troopCount: 200, operationId: "rally-integration-1" }
        });
        assert.equal(create.status, 200);
        assert.equal(create.body.status, "OPEN");
        assert.equal(create.body.participants.length, 1);

        const outsiderView = await api(server.baseUrl, "GET", "/v1/world/alliance-rallies/rally-integration-1", { token: outsider });
        assert.equal(outsiderView.status, 403);

        const join = await api(server.baseUrl, "POST", "/v1/world/alliance-rallies/rally-integration-1/join", {
            token: member,
            body: { heroIds: ["lucas"], troopCount: 100 }
        });
        assert.equal(join.status, 200);
        assert.equal(join.body.rally.participants.length, 2);

        const closed = await api(server.baseUrl, "POST", "/v1/world/alliance-rallies/rally-integration-1/close", { token: member, body: {} });
        assert.equal(closed.status, 403);
        const close = await api(server.baseUrl, "POST", "/v1/world/alliance-rallies/rally-integration-1/close", { token: leader, body: {} });
        assert.equal(close.status, 200);
        const dispatch = await api(server.baseUrl, "POST", "/v1/world/alliance-rallies/rally-integration-1/dispatch", { token: leader, body: {} });
        assert.equal(dispatch.status, 200);

        const early = await api(server.baseUrl, "POST", "/v1/world/alliance-rallies/rally-integration-1/resolve", { token: leader, body: {} });
        assert.equal(early.status, 409);

        const db = await readDb();
        db.rallies["rally-integration-1"].endsAtMs = Date.now() - 1;
        await writeDb(db);

        const resolved = await api(server.baseUrl, "POST", "/v1/world/alliance-rallies/rally-integration-1/resolve", { token: leader, body: {} });
        assert.equal(resolved.status, 200);
        assert.equal(resolved.body.rally.status, "RESOLVED");
        assert.ok(resolved.body.rewardReceipt);
        const leaderGold = resolved.body.resources.gold;

        const replay = await api(server.baseUrl, "POST", "/v1/world/alliance-rallies/rally-integration-1/resolve", { token: leader, body: {} });
        assert.equal(replay.status, 200);
        assert.equal(replay.body.replayed, true);
        assert.equal(replay.body.resources.gold, leaderGold);

        const persisted = await readDb();
        assert.ok(persisted.users["guest:rally-member"].v1.gameData.battleHistory.some((battle) => battle.operationId === "rally-integration-1"));
    } finally {
        await server.stop();
    }
});

test("server chest opening is idempotent and vehicle presets enforce ownership and slot uniqueness", async () => {
    await fs.rm(dbPath, { force: true });
    let server = await bootServer();
    let token;
    try {
        token = await login(server.baseUrl, "vehicle-player");
        const db = await readDb();
        const user = db.users["guest:vehicle-player"];
        user.v1.gameData = {
            vehicle: {
                inventory: Array.from({ length: 6 }, (_, index) => ({
                    id: `chip-${index === 0 ? "a" : String.fromCharCode(97 + index)}`,
                    typeId: "assault-module", name: "Módulo de Assalto", role: "Guerreiro",
                    level: 1, rarity: "Épico", source: "server", obtainedAt: Date.now()
                })),
                presets: { I: { assault: null, vanguard: null, suppression: null, gravity: null } },
                activePreset: "I",
                chipMaterials: 0
            },
            chests: [{ id: "chest-integration-1", type: "explorer", source: "server", obtainedAt: Date.now() }],
            equipment: [], shards: { bronze: 0, silver: 0, gold: 0 }, chestReceipts: {}, battleHistory: [], hunts: {}
        };
        await writeDb(db);

        const loadout = await api(server.baseUrl, "GET", "/v1/vehicle/loadout", { token });
        assert.equal(loadout.status, 200);
        assert.equal(loadout.body.inventory.length, 6);
        const equip = await api(server.baseUrl, "POST", "/v1/vehicle/chips/equip", {
            token, body: { chipId: "chip-a", slotId: "assault", presetId: "I" }
        });
        assert.equal(equip.status, 200);
        const duplicate = await api(server.baseUrl, "POST", "/v1/vehicle/chips/equip", {
            token, body: { chipId: "chip-a", slotId: "vanguard", presetId: "I" }
        });
        assert.equal(duplicate.status, 409);
        const remove = await api(server.baseUrl, "POST", "/v1/vehicle/chips/remove", {
            token, body: { slotId: "assault", presetId: "I" }
        });
        assert.equal(remove.status, 200);
        const upgrade = await api(server.baseUrl, "POST", "/v1/vehicle/chips/chip-a/upgrade", { token, body: {} });
        assert.equal(upgrade.status, 200);
        assert.equal(upgrade.body.inventory.length, 1);
        assert.equal(upgrade.body.inventory[0].id, "chip-a");
        assert.equal(upgrade.body.inventory[0].level, 2);

        const chests = await api(server.baseUrl, "GET", "/v1/inventory/chests", { token });
        assert.equal(chests.status, 200);
        assert.equal(chests.body.chests.length, 1);
        const headers = { "x-idempotency-key": "chest-open-integration-1" };
        const opened = await api(server.baseUrl, "POST", "/v1/inventory/chests/chest-integration-1/open", {
            token, body: { idempotencyKey: "chest-open-integration-1" }, headers
        });
        assert.equal(opened.status, 200);
        const replay = await api(server.baseUrl, "POST", "/v1/inventory/chests/chest-integration-1/open", {
            token, body: { idempotencyKey: "chest-open-integration-1" }, headers
        });
        assert.equal(replay.status, 200);
        assert.deepEqual(replay.body, opened.body);

        const beforeRestart = await api(server.baseUrl, "GET", "/v1/inventory/chests", { token });
        assert.equal(beforeRestart.body.chests.some((chest) => chest.id === "chest-integration-1"), false);
        await server.stop();
        server = await bootServer();
        const afterRestart = await api(server.baseUrl, "GET", "/v1/vehicle/loadout", { token });
        assert.equal(afterRestart.status, 200);
        assert.equal(afterRestart.body.inventory.length, 1);
        assert.equal(afterRestart.body.inventory[0].level, 2);
        assert.equal(afterRestart.body.presets.I.assault, null);
        const afterChestRestart = await api(server.baseUrl, "GET", "/v1/inventory/chests", { token });
        assert.equal(afterChestRestart.body.chests.some((chest) => chest.id === "chest-integration-1"), false);
        assert.ok(afterChestRestart.body.receipts.some((receipt) => receipt.chestId === "chest-integration-1"));
    } finally {
        await server.stop();
    }
});


test("shared write lock prevents overlapping player mutations from overwriting snapshots", async () => {
    await fs.rm(dbPath, { force: true });
    const server = await bootServer();
    try {
        const tokenA = await login(server.baseUrl, "concurrent-player-a");
        const tokenB = await login(server.baseUrl, "concurrent-player-b");
        const [first, second] = await Promise.all([
            api(server.baseUrl, "POST", "/v1/world/hunts/start", {
                token: tokenA,
                body: { targetId: "target-a", heroIds: ["lucas"], troopCount: 10, operationId: "concurrent-hunt-a" }
            }),
            api(server.baseUrl, "POST", "/v1/world/hunts/start", {
                token: tokenB,
                body: { targetId: "target-b", heroIds: ["lucas"], troopCount: 10, operationId: "concurrent-hunt-b" }
            })
        ]);
        const statuses = [first.status, second.status].sort((a, b) => a - b);
        assert.ok(statuses.every((status) => status === 200 || status === 429));
        const successfulWrites = statuses.filter((status) => status === 200).length;
        assert.ok(successfulWrites >= 1);

        const db = await readDb();
        const energyA = db.users["guest:concurrent-player-a"].v1.resources.energy;
        const energyB = db.users["guest:concurrent-player-b"].v1.resources.energy;
        assert.equal([energyA, energyB].filter((energy) => energy === 90).length, successfulWrites);
        assert.equal([energyA, energyB].filter((energy) => energy === 100).length, 2 - successfulWrites);
    } finally {
        await server.stop();
    }
});
