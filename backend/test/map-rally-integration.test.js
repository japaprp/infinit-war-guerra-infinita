import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "iwar-map-rally-it-"));
process.env.IWAR_DB_PATH = path.join(tmpDir, "db.json");

const { createApp } = await import("../src/app.js");
const { initializeRepository, readDb, writeDb } = await import("../src/repositories/dbRepository.js");
const { initializeRedis } = await import("../src/services/redisService.js");

const env = {
    PORT: 0, GRPC_PORT: 50051, JWT_SECRET: "map_rally_test_secret",
    RECEIPT_SECRET: "map_rally_receipt_secret", DATA_DRIVER: "json",
    MYSQL_HOST: "127.0.0.1", MYSQL_PORT: 3306, MYSQL_DATABASE: "infinitwar",
    MYSQL_USER: "root", MYSQL_PASSWORD: "", REDIS_ENABLED: false,
    REDIS_URL: "redis://127.0.0.1:6379"
};

async function startServer() {
    await initializeRepository(env);
    const redisClient = await initializeRedis(env);
    const app = createApp(env, { redisClient, repositoryMode: "json" });
    const server = await new Promise(resolve => {
        const instance = app.listen(0, () => resolve(instance));
    });
    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    return {
        baseUrl,
        stop: async () => {
            await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
            if (redisClient) await redisClient.quit().catch(() => redisClient.disconnect());
        }
    };
}

async function request(baseUrl, method, url, { token, body } = {}) {
    const headers = { "content-type": "application/json" };
    if (token) headers.authorization = `Bearer ${token}`;
    const response = await fetch(baseUrl + url, {
        method, headers, body: body === undefined ? undefined : JSON.stringify(body)
    });
    return { status: response.status, body: await response.json().catch(() => ({})) };
}

async function login(baseUrl, externalId) {
    const result = await request(baseUrl, "POST", "/v1/auth/login", {
        body: { platform: "guest", externalId }
    });
    assert.equal(result.status, 200);
    return result.body.accessToken;
}

test.after(async () => fs.rm(tmpDir, { recursive: true, force: true }));

test("map hunt validates owned heroes, charges once, and persists an idempotent operation", async () => {
    await fs.rm(process.env.IWAR_DB_PATH, { force: true });
    const server = await startServer();
    try {
        const token = await login(server.baseUrl, "hunt_leader");
        const invalid = await request(server.baseUrl, "POST", "/v1/world/hunts/start", {
            token, body: { targetId: "grey-forest-stalker", heroIds: ["not-owned"], operationId: "hunt-op-invalid" }
        });
        assert.equal(invalid.status, 400);

        const first = await request(server.baseUrl, "POST", "/v1/world/hunts/start", {
            token, body: { targetId: "grey-forest-stalker", heroIds: ["lucas"], operationId: "hunt-op-1" }
        });
        assert.equal(first.status, 200);
        assert.equal(first.body.resources.energy, 85);
        assert.equal(first.body.status, "marching");

        const retry = await request(server.baseUrl, "POST", "/v1/world/hunts/start", {
            token, body: { targetId: "grey-forest-stalker", heroIds: ["lucas"], operationId: "hunt-op-1" }
        });
        assert.equal(retry.status, 200);
        assert.equal(retry.body.replayed, true);
        assert.equal(retry.body.huntId, first.body.huntId);
        assert.equal(retry.body.resources.energy, 85, "retry returns the current balance without charging again");

        const db = await readDb();
        assert.equal(db.hunts["hunt-op-1"].huntId, first.body.huntId);
        assert.equal(db.users["guest:hunt_leader"].v1.resources.energy, 85);
    } finally {
        await server.stop();
    }
});

test("map hunt resolves after arrival and grants rewards only once", async () => {
    await fs.rm(process.env.IWAR_DB_PATH, { force: true });
    const server = await startServer();
    try {
        const token = await login(server.baseUrl, "hunt_combat_player");
        const started = await request(server.baseUrl, "POST", "/v1/world/hunts/start", {
            token, body: { targetId: "grey-forest-stalker", heroIds: ["lucas"], troopCount: 100, operationId: "hunt-combat-1", combatPower: 999999999, combatBonuses: { attackPct: 999999 } }
        });
        assert.equal(started.status, 200);
        assert.equal(started.body.troops, 900);
        const storedHunt = (await readDb()).hunts["hunt-combat-1"];
        assert.equal(storedHunt.troopCount, 100);
        assert.equal(storedHunt.combatPower, undefined, "client-supplied combat power must never be persisted");
        assert.equal(storedHunt.combatBonuses, undefined, "client-supplied combat bonuses must never be trusted");

        const early = await request(server.baseUrl, "POST", "/v1/world/hunts/hunt-combat-1/resolve", { token, body: {} });
        assert.equal(early.status, 409, "combat cannot resolve before arrival");

        const db = await readDb();
        db.hunts["hunt-combat-1"].endsAtMs = Date.now() - 1;
        await writeDb(db);
        const resolved = await request(server.baseUrl, "POST", "/v1/world/hunts/hunt-combat-1/resolve", { token, body: {} });
        assert.equal(resolved.status, 200);
        assert.ok(["victory", "defeat"].includes(resolved.body.result.outcome));
        assert.ok(resolved.body.rewardReceipt.receiptId);
        assert.equal(resolved.body.rewardReceipt.troopsCommitted, 100);
        assert.equal(resolved.body.rewardReceipt.troopsReturned + resolved.body.rewardReceipt.troopsLost, 100);
        const afterFirst = (await readDb()).users["guest:hunt_combat_player"].v1;
        if (resolved.body.chestReward) {
            assert.equal(resolved.body.result.outcome, "victory", "combat chests can only drop on victory");
            assert.ok(afterFirst.inventory?.chests?.some(chest => chest.id === resolved.body.chestReward.chestId), "combat chest must be in the server-owned inventory");
        }
        const afterFirstChestCount = afterFirst.inventory?.chests?.length || 0;
        assert.equal(afterFirst.resources.gold, resolved.body.rewardReceipt.rewards.gold);
        assert.equal(afterFirst.resources.food, resolved.body.rewardReceipt.rewards.food);
        assert.equal(afterFirst.troops, resolved.body.troops);

        const retry = await request(server.baseUrl, "POST", "/v1/world/hunts/hunt-combat-1/resolve", { token, body: {} });
        assert.equal(retry.status, 200);
        assert.equal(retry.body.replayed, true);
        assert.equal(retry.body.rewardReceipt.receiptId, resolved.body.rewardReceipt.receiptId);
        assert.deepEqual(retry.body.chestReward || null, resolved.body.chestReward || null, "retry must return the original chest result");
        const afterRetry = (await readDb()).users["guest:hunt_combat_player"].v1;
        assert.equal(afterRetry.inventory?.chests?.length || 0, afterFirstChestCount, "retry must not generate another chest");
        assert.equal(afterRetry.resources.gold, afterFirst.resources.gold, "retry must not grant gold twice");
        assert.equal(afterRetry.troops, afterFirst.troops, "retry must not return troops twice");
    } finally {
        await server.stop();
    }
});

test("alliance rally enforces membership, unique entry, leader transitions and persistence", async () => {
    await fs.rm(process.env.IWAR_DB_PATH, { force: true });
    const server = await startServer();
    try {
        const leaderToken = await login(server.baseUrl, "rally_leader");
        const memberToken = await login(server.baseUrl, "rally_member");
        const strangerToken = await login(server.baseUrl, "rally_stranger");

        const noAlliance = await request(server.baseUrl, "POST", "/v1/world/alliance-rallies", {
            token: leaderToken, body: { targetId: "grey-forest-stalker", heroIds: ["lucas"], troopCount: 100, operationId: "rally-op-0" }
        });
        assert.equal(noAlliance.status, 409);

        const alliance = await request(server.baseUrl, "POST", "/v1/alliances", {
            token: leaderToken, body: { name: "Sentinelas", tag: "SEN" }
        });
        assert.equal(alliance.status, 200);
        const joinAlliance = await request(server.baseUrl, "POST", `/v1/alliances/${alliance.body.allianceId}/join`, { token: memberToken });
        assert.equal(joinAlliance.status, 200);

        const created = await request(server.baseUrl, "POST", "/v1/world/alliance-rallies", {
            token: leaderToken, body: { targetId: "grey-forest-stalker", heroIds: ["lucas"], troopCount: 100, operationId: "rally-op-1" }
        });
        assert.equal(created.status, 200);
        assert.equal(created.body.status, "recruiting");
        assert.equal(created.body.resources.energy, 85);
        assert.equal(created.body.troops, 900);

        const createRetry = await request(server.baseUrl, "POST", "/v1/world/alliance-rallies", {
            token: leaderToken, body: { targetId: "grey-forest-stalker", heroIds: ["lucas"], troopCount: 100, operationId: "rally-op-1" }
        });
        assert.equal(createRetry.status, 200);
        assert.equal(createRetry.body.replayed, true);
        assert.equal(createRetry.body.resources.energy, 85);
        assert.equal(createRetry.body.troops, 900, "idempotent retry must not reserve troops twice");

        const outsider = await request(server.baseUrl, "POST", "/v1/world/alliance-rallies/rally-op-1/join", {
            token: strangerToken, body: { heroIds: ["lucas"], troopCount: 10 }
        });
        assert.equal(outsider.status, 403);

        const joined = await request(server.baseUrl, "POST", "/v1/world/alliance-rallies/rally-op-1/join", {
            token: memberToken, body: { heroIds: ["lucas"], troopCount: 250 }
        });
        assert.equal(joined.status, 200);
        assert.equal(joined.body.resources.energy, 85);
        assert.equal(joined.body.troops, 750, "joining reserves the committed troops");
        assert.equal(joined.body.rally.participants.length, 2);

        const duplicateJoin = await request(server.baseUrl, "POST", "/v1/world/alliance-rallies/rally-op-1/join", {
            token: memberToken, body: { heroIds: ["lucas"], troopCount: 250 }
        });
        assert.equal(duplicateJoin.status, 409);
        const memberState = (await readDb()).users["guest:rally_member"].v1;
        assert.equal(memberState.resources.energy, 85);
        assert.equal(memberState.troops, 750, "duplicate join must not reserve troops again");

        const closeByNonLeader = await request(server.baseUrl, "POST", "/v1/world/alliance-rallies/rally-op-1/close", { token: memberToken });
        assert.equal(closeByNonLeader.status, 403);
        const closed = await request(server.baseUrl, "POST", "/v1/world/alliance-rallies/rally-op-1/close", { token: leaderToken });
        assert.equal(closed.status, 200);
        assert.equal(closed.body.rally.status, "assembling");

        const lateJoin = await request(server.baseUrl, "POST", "/v1/world/alliance-rallies/rally-op-1/join", {
            token: memberToken, body: { heroIds: ["lucas"], troopCount: 100 }
        });
        assert.equal(lateJoin.status, 409);

        const dispatched = await request(server.baseUrl, "POST", "/v1/world/alliance-rallies/rally-op-1/dispatch", { token: leaderToken });
        assert.equal(dispatched.status, 200);
        assert.equal(dispatched.body.rally.status, "marching");

        const beforeResolve = await readDb();
        beforeResolve.rallies["rally-op-1"].arrivesAtMs = Date.now() - 1;
        await writeDb(beforeResolve);
        const resolved = await request(server.baseUrl, "POST", "/v1/world/alliance-rallies/rally-op-1/resolve", { token: memberToken, body: {} });
        assert.equal(resolved.status, 200);
        assert.equal(resolved.body.rally.status, "completed");
        assert.ok(resolved.body.rally.result.resultId);
        assert.ok(resolved.body.rewardReceipt.receiptId);

        const retry = await request(server.baseUrl, "POST", "/v1/world/alliance-rallies/rally-op-1/resolve", { token: memberToken, body: {} });
        assert.equal(retry.status, 200);
        assert.equal(retry.body.replayed, true);
        assert.equal(retry.body.rewardReceipt.receiptId, resolved.body.rewardReceipt.receiptId);

        const visible = await request(server.baseUrl, "GET", "/v1/world/alliance-rallies/rally-op-1", { token: memberToken });
        assert.equal(visible.status, 200);
        assert.equal(visible.body.rally.status, "completed");
        const db = await readDb();
        assert.equal(db.rallies["rally-op-1"].participants.length, 2);
        assert.equal(db.users["guest:rally_member"].v1.resources.gold, resolved.body.rewardReceipt.rewards.gold);
        assert.equal(db.users["guest:rally_member"].v1.troops, 750 + resolved.body.rewardReceipt.troopsReturned);
        const history = await request(server.baseUrl, "GET", "/v1/world/battle-history?limit=10", { token: memberToken });
        assert.equal(history.status, 200);
        assert.equal(history.body.battles.length, 1);
        assert.equal(history.body.battles[0].type, "alliance-rally");
        assert.equal(history.body.battles[0].operationId, "rally-op-1");
        assert.equal(history.body.battles[0].rewardReceipt.receiptId, resolved.body.rewardReceipt.receiptId);

        const strangerHistory = await request(server.baseUrl, "GET", "/v1/world/battle-history?limit=10", { token: strangerToken });
        assert.equal(strangerHistory.status, 200);
        assert.equal(strangerHistory.body.battles.length, 0, "history must not disclose another player's rally");
    } finally {
        await server.stop();
    }
});


test("vehicle chip loadouts are server-owned and upgrades consume only unequipped copies", async () => {
    await fs.rm(process.env.IWAR_DB_PATH, { force: true });
    const server = await startServer();
    try {
        const token = await login(server.baseUrl, "vehicle_loadout_player");
        const empty = await request(server.baseUrl, "GET", "/v1/vehicle/loadout", { token });
        assert.equal(empty.status, 200);
        assert.equal(empty.body.inventory.length, 0);
        assert.deepEqual(empty.body.presetIds, ["I", "II", "III", "IV"]);
        assert.deepEqual(empty.body.slots, ["assault", "vanguard", "suppression", "gravity"]);

        const invalidPreset = await request(server.baseUrl, "POST", "/v1/vehicle/presets/active", {
            token, body: { presetId: "V" }
        });
        assert.equal(invalidPreset.status, 400, "unknown preset IDs must be rejected");

        const invalidSlot = await request(server.baseUrl, "POST", "/v1/vehicle/chips/equip", {
            token, body: { chipId: "not-owned", slotId: "turbo", presetId: "I" }
        });
        assert.equal(invalidSlot.status, 400, "unknown slot IDs must be rejected before inventory checks");

        // Seed inventory as if granted by a trusted server-side reward; never from a client sync payload.
        const db = await readDb();
        const user = db.users["guest:vehicle_loadout_player"];
        user.v1.vehicle = {
            chips: [
                { id: "assault-main", typeId: "assault-module", level: 1 },
                { id: "assault-copy-1", typeId: "assault-module", level: 1 },
                { id: "assault-copy-2", typeId: "assault-module", level: 1 },
                { id: "assault-copy-3", typeId: "assault-module", level: 1 },
                { id: "assault-copy-4", typeId: "assault-module", level: 1 },
                { id: "assault-copy-5", typeId: "assault-module", level: 1 }
            ],
            activePreset: "I",
            presets: {
                "I": { "assault": null, "vanguard": null, "suppression": null, "gravity": null },
                "II": { "assault": null, "vanguard": null, "suppression": null, "gravity": null },
                "III": { "assault": null, "vanguard": null, "suppression": null, "gravity": null }
            }
        };
        await writeDb(db);

        const forged = await request(server.baseUrl, "POST", "/v1/vehicle/chips/equip", {
            token, body: { chipId: "not-owned", slotId: "assault", presetId: "I", level: 10, bonusPct: 999999 }
        });
        assert.equal(forged.status, 404, "client cannot equip a chip it does not own");

        const equipped = await request(server.baseUrl, "POST", "/v1/vehicle/chips/equip", {
            token, body: { chipId: "assault-main", slotId: "assault", presetId: "I", level: 10, bonusPct: 999999 }
        });
        assert.equal(equipped.status, 200);
        assert.equal(equipped.body.inventory.find(chip => chip.id === "assault-main").level, 1);
        assert.equal(equipped.body.inventory.find(chip => chip.id === "assault-main").name, "Módulo de Assalto");
        assert.equal(equipped.body.inventory.find(chip => chip.id === "assault-main").rarity, "Épico");
        assert.equal(equipped.body.inventory.find(chip => chip.id === "assault-main").upgradeCopies, 5);
        assert.equal(equipped.body.presets["I"]["assault"], "assault-main");

        const upgrade = await request(server.baseUrl, "POST", "/v1/vehicle/chips/assault-main/upgrade", { token, body: {} });
        assert.equal(upgrade.status, 200);
        assert.equal(upgrade.body.inventory.length, 1);
        assert.equal(upgrade.body.inventory[0].level, 2);
        assert.equal(upgrade.body.presets["I"]["assault"], "assault-main", "upgrading preserves the equipped main chip");
        assert.equal(upgrade.body.inventory[0].bonusPct, 42.2);

        const hunt = await request(server.baseUrl, "POST", "/v1/world/hunts/start", {
            token,
            body: {
                targetId: "grey-forest-stalker",
                heroIds: ["lucas"],
                troopCount: 0,
                operationId: "vehicle-bonus-hunt",
                combatBonuses: { attackPct: 999999 }
            }
        });
        assert.equal(hunt.status, 200);
        const storedHunt = (await readDb()).hunts["vehicle-bonus-hunt"];
        assert.equal(storedHunt.vehicleBonuses.attackPct, 42.2, "combat uses the server-owned active preset, not client bonuses");
        assert.equal(storedHunt.combatBonuses, undefined);

        // HP bonuses are snapshotted by the server and reduce troop losses.
        const afterUpgradeDb = await readDb();
        afterUpgradeDb.users["guest:vehicle_loadout_player"].v1.vehicle.chips.push({
            id: "gravity-protection", typeId: "gravity-barrier", level: 1, source: "trusted-test-reward"
        });
        await writeDb(afterUpgradeDb);
        const equippedProtection = await request(server.baseUrl, "POST", "/v1/vehicle/chips/equip", {
            token, body: { chipId: "gravity-protection", slotId: "gravity", presetId: "I" }
        });
        assert.equal(equippedProtection.status, 200);
        assert.equal(equippedProtection.body.inventory.find(chip => chip.id === "gravity-protection").bonusPct, 6.8);

        const protectedHunt = await request(server.baseUrl, "POST", "/v1/world/hunts/start", {
            token,
            body: { targetId: "grey-forest-stalker", heroIds: ["lucas"], troopCount: 100, operationId: "vehicle-hp-hunt" }
        });
        assert.equal(protectedHunt.status, 200);
        const beforeResolve = await readDb();
        assert.equal(beforeResolve.hunts["vehicle-hp-hunt"].vehicleBonuses.hpPct, 6.8);
        beforeResolve.hunts["vehicle-hp-hunt"].endsAtMs = 0;
        await writeDb(beforeResolve);
        const protectedResult = await request(server.baseUrl, "POST", "/v1/world/hunts/vehicle-hp-hunt/resolve", {
            token, body: {}
        });
        assert.equal(protectedResult.status, 200);
        assert.equal(protectedResult.body.rewardReceipt.troopsLost, 1, "6.8% HP bonus reduces the base two troop losses to one");
    } finally {
        await server.stop();
    }
});
