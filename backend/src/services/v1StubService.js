import crypto from "crypto";
import { ensureV1State, toPlayerProfile } from "./userService.js";

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

    const snapshot = _request?.snapshot;
    if (snapshot && typeof snapshot === "object") {
        const resourceKeys = ["gold", "wood", "steel", "food", "energy"];
        let changed = false;

        for (const key of resourceKeys) {
            const next = Number(snapshot[key]);
            if (Number.isFinite(next) && next >= 0) {
                user.v1.resources[key] = Math.floor(next);
                changed = true;
            }
        }

        if (changed) {
            user.v1.stateVersion += 1;
        }
    }

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
