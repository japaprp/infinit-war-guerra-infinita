import crypto from "crypto";
import { ensureV1State, toPlayerProfile } from "./userService.js";
import { ensureVehicleLoadout, getVehicleLoadout } from "./vehicleLoadoutService.js";

function findHero(user, heroId) {
    ensureV1State(user);
    return user.v1.heroes.find((hero) => hero.heroId === heroId);
}

function findBuilding(user, buildingType) {
    ensureV1State(user);
    return user.v1.buildings.find((b) => b.buildingType === buildingType);
}

function recalcPower(user) {
    ensureV1State(user);
    const heroPower = user.v1.heroes.reduce((sum, hero) => sum + (hero.stats?.power || 0), 0);
    const buildingPower = user.v1.buildings.reduce((sum, b) => sum + b.level * 90, 0);
    user.v1.power = heroPower + buildingPower;
}

function bumpStateVersion(user) {
    ensureV1State(user);
    user.v1.stateVersion += 1;
}

function nowMs() {
    return Date.now();
}

export function getPlayerMe(userId, user) {
    ensureV1State(user);
    return toPlayerProfile(userId, user, 1);
}

export function syncState(userId, user, _request) {
    ensureV1State(user);

    // Client snapshots are intentionally ignored for economy values.
    // Resource balances may only change through validated server-side game actions.

    if (user.v1.resources.energy > user.v1.resources.energyMax) {
        user.v1.resources.energy = user.v1.resources.energyMax;
    }

    recalcPower(user);

    return {
        serverTimeMs: nowMs(),
        stateVersion: user.v1.stateVersion,
        profile: toPlayerProfile(userId, user, 1),
        pendingTimers: user.v1.buildings
            .filter((b) => b.state !== "IDLE")
            .map((b) => ({ id: b.taskId, category: "BUILD", endAtMs: b.endAtMs }))
    };
}

const EXPEDITION_CONFIG = {
    "grey-forest": { multiplier: 1, objectives: { explore: 1, hunt: 1.2, gather: 1.1 } },
    "old-ruins": { multiplier: 1.25, objectives: { explore: 1, hunt: 1.2 } },
    "ash-marsh": { multiplier: 1.45, objectives: { hunt: 1.2, gather: 1.1 } }
};

export function startExpedition(user, payload = {}) {
    ensureV1State(user);
    const destinationId = String(payload.destinationId || "");
    const objectiveId = String(payload.objectiveId || "");
    const destination = EXPEDITION_CONFIG[destinationId];
    if (!destination || !Object.hasOwn(destination.objectives, objectiveId)) return { error: { status: 400, message: "Invalid expedition destination or objective" } };
    user.v1.expedition ||= { active: null, claimedIds: [], receipts: {} };
    if (user.v1.expedition.active) return { error: { status: 409, message: "An expedition is already active" } };
    if (user.v1.resources.energy < 15) return { error: { status: 409, message: "Insufficient energy" } };
    const now = nowMs();
    const expeditionId = `exp_${crypto.randomUUID()}`;
    user.v1.resources.energy -= 15;
    user.v1.expedition.active = { expeditionId, destinationId, objectiveId, startedAtMs: now, endsAtMs: now + 60000 };
    bumpStateVersion(user);
    return { expeditionId, destinationId, objectiveId, startedAtMs: now, endsAtMs: now + 60000, resources: user.v1.resources, stateVersion: user.v1.stateVersion };
}

function ensureServerInventory(user) {
    ensureV1State(user);
    user.v1.inventory ||= {};
    user.v1.inventory.chests = Array.isArray(user.v1.inventory.chests) ? user.v1.inventory.chests : [];
    user.v1.inventory.chestReceipts ||= {};
    user.v1.inventory.chipMaterials = Math.max(0, Number(user.v1.inventory.chipMaterials) || 0);
    user.v1.inventory.shards ||= { bronze: 0, silver: 0, gold: 0 };
    user.v1.inventory.equipment = Array.isArray(user.v1.inventory.equipment) ? user.v1.inventory.equipment : [];
    return user.v1.inventory;
}

function serverChest(user, type) {
    const inventory = ensureServerInventory(user);
    const chest = {
        id: `chest_${crypto.randomUUID()}`,
        type,
        name: type === "module" ? "Baú de Módulos" : "Baú de Explorador",
        source: "server",
        createdAtMs: nowMs()
    };
    inventory.chests.push(chest);
    return chest;
}

export function getServerChests(user) {
    const inventory = ensureServerInventory(user);
    return { chests: inventory.chests.map(chest => ({ ...chest })) };
}

function rollWeighted(entries) {
    const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
    let cursor = crypto.randomInt(0, total);
    for (const entry of entries) {
        cursor -= entry.weight;
        if (cursor < 0) return entry;
    }
    return entries[entries.length - 1];
}

export function openServerChest(user, chestId) {
    const inventory = ensureServerInventory(user);
    const id = String(chestId || "");
    if (!id) return { error: { status: 400, message: "chestId is required" } };
    if (inventory.chestReceipts[id]) return { ...inventory.chestReceipts[id], alreadyOpened: true };
    const index = inventory.chests.findIndex(chest => chest.id === id);
    if (index < 0) return { error: { status: 404, message: "Chest is not owned by this player" } };
    const chest = inventory.chests[index];
    let reward;
    if (chest.type === "explorer") {
        const roll = rollWeighted([
            { id: "resources", weight: 45 },
            { id: "shards", weight: 25 },
            { id: "equipment", weight: 15 },
            { id: "moduleChest", weight: 15 }
        ]);
        if (roll.id === "resources") {
            reward = { type: "resources", gold: 250 + crypto.randomInt(0, 751), steel: 200 + crypto.randomInt(0, 601), food: 40 + crypto.randomInt(0, 81) };
            for (const key of ["gold", "steel", "food"]) user.v1.resources[key] = Math.max(0, Number(user.v1.resources[key]) || 0) + reward[key];
        } else if (roll.id === "shards") {
            const pool = ["bronze", "silver", "gold"][crypto.randomInt(0, 3)];
            const amount = pool === "bronze" ? 3 : pool === "silver" ? 2 : 1;
            inventory.shards[pool] = (Number(inventory.shards[pool]) || 0) + amount;
            reward = { type: "shards", pool, amount };
        } else if (roll.id === "equipment") {
            const equipment = { id: `equipment_${crypto.randomUUID()}`, slot: ["weapon", "armor", "boots"][crypto.randomInt(0, 3)], bonus: 8 + crypto.randomInt(0, 13), source: "explorer-chest" };
            inventory.equipment.push(equipment);
            reward = { type: "equipment", item: equipment };
        } else {
            const moduleChest = serverChest(user, "module");
            reward = { type: "moduleChest", chest: moduleChest };
        }
    } else if (chest.type === "module") {
        const roll = rollWeighted([
            { id: "legendary", weight: 2 },
            { id: "blue-a", weight: 75 },
            { id: "blue-b", weight: 75 },
            { id: "blue-c", weight: 75 },
            { id: "blue-d", weight: 75 },
            { id: "purple", weight: 300 },
            { id: "materials", weight: 398 }
        ]);
        if (roll.id === "materials") {
            const amount = 20 + crypto.randomInt(0, 41);
            inventory.chipMaterials += amount;
            reward = { type: "chipMaterials", amount };
        } else {
            const map = {
                legendary: { typeId: "assault-module", level: 5, rarity: "Lendário" },
                "blue-a": { typeId: "assault-module", level: 1, rarity: "Raro" },
                "blue-b": { typeId: "gravity-barrier", level: 1, rarity: "Raro" },
                "blue-c": { typeId: "recon-array", level: 1, rarity: "Raro" },
                "blue-d": { typeId: "supply-core", level: 1, rarity: "Raro" },
                purple: { typeId: ["assault-module", "gravity-barrier"][crypto.randomInt(0, 2)], level: 2, rarity: "Épico" }
            };
            const definition = map[roll.id];
            const vehicle = ensureVehicleLoadout(user);
            const chip = { id: `chip_${crypto.randomUUID()}`, ...definition, source: "module-chest" };
            vehicle.chips.push({ id: chip.id, typeId: chip.typeId, level: chip.level, source: chip.source });
            reward = { type: "chip", chip: getVehicleLoadout(user).inventory.find(item => item.id === chip.id) };
        }
    } else {
        return { error: { status: 409, message: "Unsupported chest type" } };
    }
    inventory.chests.splice(index, 1);
    const receipt = { chestId: id, chestType: chest.type, reward, remainingChests: inventory.chests.map(item => ({ ...item })) };
    inventory.chestReceipts[id] = receipt;
    const receiptIds = Object.keys(inventory.chestReceipts);
    for (const oldId of receiptIds.slice(0, Math.max(0, receiptIds.length - 500))) delete inventory.chestReceipts[oldId];
    bumpStateVersion(user);
    return receipt;
}

function grantFirstExpeditionVehicleChip(user, expedition) {
    const vehicle = ensureVehicleLoadout(user);
    if (vehicle.firstExpeditionRewardClaimed) return null;

    // The first completed expedition grants one server-generated starter chip.
    // The client never chooses the chip type, ID, level, or bonus.
    const rewardTypes = expedition.objectiveId === "hunt"
        ? ["recon-array", "assault-module"]
        : expedition.objectiveId === "gather"
            ? ["supply-core", "gravity-barrier"]
            : ["recon-array", "supply-core"];
    const typeId = rewardTypes[crypto.randomInt(0, rewardTypes.length)];
    const chip = { id: `chip_${crypto.randomUUID()}`, typeId, level: 1, source: "first-expedition" };
    vehicle.chips.push(chip);
    vehicle.firstExpeditionRewardClaimed = true;
    return getVehicleLoadout(user).inventory.find(item => item.id === chip.id) || null;
}

function grantExpeditionChest(user) {
    const inventory = ensureServerInventory(user);
    // A guaranteed first explorer chest introduces the server-owned chest flow;
    // later expedition chest drops use the original prototype's 10% target.
    if (!inventory.firstExpeditionChestGranted) {
        inventory.firstExpeditionChestGranted = true;
        return serverChest(user, "explorer");
    }
    if (crypto.randomInt(0, 100) < 10) return serverChest(user, "explorer");
    return null;
}

export function claimExpedition(user, payload = {}) {
    ensureV1State(user);
    user.v1.expedition ||= { active: null, claimedIds: [], receipts: {} };
    user.v1.expedition.receipts ||= {};
    const expeditionId = String(payload.expeditionId || "");
    const expedition = user.v1.expedition.active;
    const claimedIds = user.v1.expedition.claimedIds || [];
    if (!expeditionId) return { error: { status: 400, message: "expeditionId is required" } };
    if (claimedIds.includes(expeditionId)) {
        const priorReceipt = user.v1.expedition.receipts[expeditionId];
        return priorReceipt
            ? { ...priorReceipt, alreadyClaimed: true }
            : { error: { status: 409, message: "Expedition reward already claimed; receipt unavailable" } };
    }
    if (!expedition || expedition.expeditionId !== expeditionId) return { error: { status: 409, message: "No matching active expedition" } };
    if (nowMs() < expedition.endsAtMs) return { error: { status: 409, message: "Expedition is not complete yet" } };
    const destination = EXPEDITION_CONFIG[expedition.destinationId];
    const objectiveMultiplier = destination?.objectives?.[expedition.objectiveId];
    if (!destination || !Number.isFinite(objectiveMultiplier)) return { error: { status: 409, message: "Expedition configuration is invalid" } };
    const multiplier = destination.multiplier * objectiveMultiplier;
    const power = Math.max(0, Number(user.v1.power) || 0);
    const rewards = {
        gold: Math.floor((250 + Math.floor(power / 1800)) * multiplier),
        steel: Math.floor((180 + Math.floor(power / 2400)) * multiplier),
        food: Math.floor((35 + Math.floor(power / 12000)) * multiplier * (expedition.objectiveId === "gather" ? 1.25 : 1))
    };
    user.v1.expedition.claimedIds = [...new Set([...claimedIds, expeditionId])].slice(-500);
    user.v1.expedition.active = null;
    for (const [key, amount] of Object.entries(rewards)) user.v1.resources[key] = Math.max(0, Number(user.v1.resources[key]) || 0) + amount;
    const vehicleChipReward = grantFirstExpeditionVehicleChip(user, expedition);
    bumpStateVersion(user);
    const receipt = { expeditionId, rewards, vehicleChipReward, resources: { ...user.v1.resources }, stateVersion: user.v1.stateVersion };
    user.v1.expedition.receipts[expeditionId] = receipt;
    const retainedIds = new Set(user.v1.expedition.claimedIds);
    user.v1.expedition.receipts = Object.fromEntries(Object.entries(user.v1.expedition.receipts).filter(([id]) => retainedIds.has(id)));
    return receipt;
}

export function listHeroes(user) {
    ensureV1State(user);
    return { heroes: user.v1.heroes };
}

export function levelUpHero(user, heroId, levels = 1) {
    ensureV1State(user);
    const hero = findHero(user, heroId);
    if (!hero) return { error: { status: 404, message: "Hero not found" } };

    const amount = Math.max(1, Number(levels) || 1);
    let totalCost = 0;
    for (let i = 0; i < amount; i += 1) {
        totalCost += 500 + (hero.level + i) * 180;
    }

    if (user.v1.resources.gold < totalCost) {
        return { error: { status: 409, message: "Insufficient gold" } };
    }

    user.v1.resources.gold -= totalCost;
    hero.level += amount;
    hero.stats.atk += 75 * amount;
    hero.stats.def += 58 * amount;
    hero.stats.units += 2 * amount;
    hero.stats.power += 2800 * amount;

    bumpStateVersion(user);
    recalcPower(user);

    return {
        hero,
        resources: user.v1.resources
    };
}

export function starUpHero(user, heroId) {
    ensureV1State(user);
    const hero = findHero(user, heroId);
    if (!hero) return { error: { status: 404, message: "Hero not found" } };

    const needed = 20 + (hero.stars - 1) * 15;
    if (hero.shardsOwned < needed) {
        return { error: { status: 409, message: `Need ${needed} shards` } };
    }

    hero.shardsOwned -= needed;
    hero.stars += 1;
    hero.stats.power = Math.floor(hero.stats.power * 1.08);

    bumpStateVersion(user);
    recalcPower(user);

    return {
        hero,
        resources: user.v1.resources
    };
}

export function ascendHero(user, heroId) {
    ensureV1State(user);
    const hero = findHero(user, heroId);
    if (!hero) return { error: { status: 404, message: "Hero not found" } };

    if (hero.stars < 5) {
        return { error: { status: 409, message: "Need 5 stars to ascend" } };
    }

    const cost = 120;
    if (user.v1.resources.gems < cost) {
        return { error: { status: 409, message: "Insufficient gems" } };
    }

    user.v1.resources.gems -= cost;
    hero.ascension += 1;
    hero.stats.power = Math.floor(hero.stats.power * 1.12);

    bumpStateVersion(user);
    recalcPower(user);

    return {
        hero,
        resources: user.v1.resources
    };
}

export function listBuildings(user) {
    ensureV1State(user);
    return { buildings: user.v1.buildings };
}

export function startBuild(user, buildingType, slotCode, targetLevel = null) {
    ensureV1State(user);
    const building = findBuilding(user, buildingType);
    if (!building) return { error: { status: 404, message: "Building not found" } };

    if (building.state !== "IDLE") {
        return { error: { status: 409, message: "Building already busy" } };
    }

    const nextLevel = targetLevel && targetLevel > building.level ? targetLevel : building.level + 1;
    const timeSec = Math.floor(90 * Math.pow(1.25, Math.max(0, building.level - 1)));
    const costGold = Math.floor(1500 * Math.pow(1.22, Math.max(0, building.level - 1)));
    const costWood = Math.floor(1100 * Math.pow(1.2, Math.max(0, building.level - 1)));

    if (user.v1.resources.gold < costGold || user.v1.resources.wood < costWood) {
        return { error: { status: 409, message: "Insufficient resources" } };
    }

    user.v1.resources.gold -= costGold;
    user.v1.resources.wood -= costWood;

    building.state = "UPGRADING";
    building.endAtMs = nowMs() + timeSec * 1000;
    building.taskId = `task_${crypto.randomUUID()}`;
    building.slotCode = slotCode || building.slotCode;
    building.targetLevel = nextLevel;

    bumpStateVersion(user);

    return {
        taskId: building.taskId,
        building,
        costs: { gold: costGold, wood: costWood }
    };
}

export function completeBuild(user, taskId) {
    ensureV1State(user);
    const building = user.v1.buildings.find((item) => item.taskId === taskId);
    if (!building) return { error: { status: 404, message: "Task not found" } };

    if (nowMs() < building.endAtMs) {
        return { error: { status: 409, message: "Build not ready" } };
    }

    building.level = building.targetLevel || building.level + 1;
    building.state = "IDLE";
    building.endAtMs = 0;
    building.taskId = "";
    delete building.targetLevel;

    bumpStateVersion(user);
    recalcPower(user);

    return {
        building,
        rewards: { powerGain: building.level * 90 }
    };
}

export function speedUpBuild(user, taskId, gemBudgetLimit = 999999) {
    ensureV1State(user);
    const building = user.v1.buildings.find((item) => item.taskId === taskId);
    if (!building) return { error: { status: 404, message: "Task not found" } };

    const remainingMs = Math.max(0, building.endAtMs - nowMs());
    const gemsNeeded = Math.ceil(remainingMs / 60000);
    if (gemsNeeded > gemBudgetLimit) {
        return { error: { status: 409, message: "Gem budget exceeded" } };
    }

    if (user.v1.resources.gems < gemsNeeded) {
        return { error: { status: 409, message: "Insufficient gems" } };
    }

    user.v1.resources.gems -= gemsNeeded;
    building.endAtMs = nowMs();

    bumpStateVersion(user);

    return {
        taskId,
        gemsSpent: gemsNeeded,
        completed: true
    };
}

export function queryWorldTiles(_user, x, y, radius) {
    const tiles = [];
    for (let tx = x - radius; tx <= x + radius; tx += 1) {
        for (let ty = y - radius; ty <= y + radius; ty += 1) {
            const roll = Math.abs((tx * 73856093) ^ (ty * 19349663)) % 100;
            let tileType = "EMPTY";
            if (roll < 8) tileType = "RESOURCE";
            else if (roll < 12) tileType = "ENEMY";
            else if (roll < 14) tileType = "EVENT";

            tiles.push({ x: tx, y: ty, tileType, ownerPlayerId: null, level: tileType === "EMPTY" ? null : (roll % 20) + 1 });
        }
    }

    return {
        serverTimeMs: nowMs(),
        tiles
    };
}

export function startMarch(_user, _payload) {
    const departAtMs = nowMs();
    const arriveAtMs = departAtMs + 90 * 1000;
    return {
        marchId: `march_${crypto.randomUUID()}`,
        departAtMs,
        arriveAtMs
    };
}

export function createRally(userId, payload) {
    const closeAtMs = nowMs() + payload.joinWindowSec * 1000;
    return {
        rallyId: `rally_${crypto.randomUUID()}`,
        leaderPlayerId: userId,
        closeAtMs
    };
}

export function createAlliance(db, userId, payload) {
    db.alliances ||= {};
    const allianceId = `alliance_${crypto.randomUUID()}`;
    const alliance = {
        allianceId,
        name: payload.name,
        tag: payload.tag,
        leaderPlayerId: userId,
        memberCount: 1,
        power: 1000
    };
    db.alliances[allianceId] = alliance;
    return alliance;
}

export function searchAlliances(db, query = "") {
    const q = query.toLowerCase();
    const alliances = Object.values(db.alliances || {}).filter((alliance) => {
        if (!q) return true;
        return alliance.name.toLowerCase().includes(q) || alliance.tag.toLowerCase().includes(q);
    });

    return { alliances };
}

export function joinAlliance(db, user, allianceId) {
    const alliance = (db.alliances || {})[allianceId];
    if (!alliance) return { error: { status: 404, message: "Alliance not found" } };

    ensureV1State(user);
    user.v1.alliances = {
        allianceId,
        name: alliance.name,
        tag: alliance.tag
    };

    return { status: "APPROVED" };
}

export function getPowerRanking(db, page = 1, pageSize = 50) {
    const users = Object.entries(db.users || {}).map(([userId, user]) => {
        ensureV1State(user);
        recalcPower(user);
        return {
            playerId: userId,
            nickname: user.profile?.displayName || user.profile?.email || userId,
            power: user.v1.power,
            allianceTag: user.v1.alliances?.tag || null
        };
    });

    users.sort((a, b) => b.power - a.power);
    const start = (Math.max(1, page) - 1) * Math.max(1, pageSize);
    const sliced = users.slice(start, start + pageSize);

    return {
        entries: sliced.map((item, index) => ({ ...item, rank: start + index + 1 }))
    };
}

export function shopPurchase(user, payload) {
    ensureV1State(user);
    const price = 90 * Math.max(1, payload.quantity || 1);
    if (user.v1.resources.gems < price) {
        return { error: { status: 409, message: "Insufficient gems" } };
    }

    user.v1.resources.gems -= price;
    user.inventory ||= {};
    user.inventory[payload.sku] = (user.inventory[payload.sku] || 0) + (payload.quantity || 1);

    bumpStateVersion(user);

    return {
        orderId: `order_${crypto.randomUUID()}`,
        gemsSpent: price,
        grantedItems: [{ itemCode: payload.sku, qty: payload.quantity || 1 }]
    };
}

export function claimBattlePass(user, payload) {
    ensureV1State(user);
    const key = `${payload.seasonId}:${payload.tier}:${payload.premiumTrack ? "p" : "f"}`;
    user.v1.pass.claimed ||= {};

    if (user.v1.pass.claimed[key]) {
        return { error: { status: 409, message: "Tier already claimed" } };
    }

    user.v1.pass.claimed[key] = true;
    bumpStateVersion(user);

    return {
        seasonId: payload.seasonId,
        tier: payload.tier,
        rewards: [
            {
                itemCode: payload.premiumTrack ? "gems_x120" : "resource_pack_standard",
                qty: 1
            }
        ]
    };
}
