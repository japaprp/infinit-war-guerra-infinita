import crypto from "crypto";
import { ensureV1State } from "./userService.js";

const HUNT_TARGETS = Object.freeze({
    "grey-forest-stalker": { energyCost: 15, travelMs: 30_000, level: 1, kind: "roaming_enemy", enemyHp: 260_000, reward: { gold: 1200, food: 800, steel: 50 } },
    "old-ruins-brute": { energyCost: 15, travelMs: 45_000, level: 2, kind: "roaming_enemy", enemyHp: 520_000, reward: { gold: 2400, food: 1600, steel: 100 } }
});
const RALLY_CAPACITY = 12;
const ACTIVE_RALLY_STATES = new Set(["recruiting", "assembling", "marching", "resolving"]);

function businessError(status, message) {
    return { error: { status, message } };
}
function validId(value) {
    return typeof value === "string" && value.trim().length > 0 && value.length <= 100;
}
function validTroops(value) {
    return Number.isSafeInteger(value) && value > 0 && value <= 1_000_000;
}
function getHeroSnapshot(user, heroIds) {
    ensureV1State(user);
    if (!Array.isArray(heroIds) || heroIds.length < 1 || heroIds.length > 5) return null;
    if (heroIds.some(id => typeof id !== "string") || new Set(heroIds).size !== heroIds.length) return null;
    const heroes = heroIds.map(id => user.v1.heroes.find(hero => hero.heroId === id));
    if (heroes.some(hero => !hero)) return null;
    return heroes.map(hero => ({
        heroId: hero.heroId, level: hero.level, stars: hero.stars,
        stats: { atk: hero.stats?.atk || 0, def: hero.stats?.def || 0, units: hero.stats?.units || 0, power: hero.stats?.power || 0 }
    }));
}
function ensureCollections(db, user) {
    db.rallies ||= {};
    db.hunts ||= {};
    ensureV1State(user);
    user.v1.marches ||= [];
}
function isAllianceMember(user, allianceId) {
    return Boolean(allianceId && user.v1.alliances?.allianceId === allianceId);
}

const COMBAT_RULES_VERSION = "combat-v1";
function hashNumber(value) {
    let hash = 2166136261;
    for (const char of String(value)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
    return hash >>> 0;
}
function formationPower(formation = []) {
    return formation.reduce((total, hero) => total
        + Math.max(0, Number(hero.stats?.power) || 0)
        + Math.max(0, Number(hero.stats?.atk) || 0) * 2
        + Math.max(0, Number(hero.stats?.def) || 0)
        + Math.max(0, Number(hero.level) || 1) * 500
        + Math.max(0, Number(hero.stars) || 1) * 1000, 0);
}
function combatDamage(power, operationId) {
    const multiplier = 0.9 + (hashNumber(operationId) % 21) / 100;
    return Math.max(1, Math.floor(power * multiplier));
}
function grantResources(user, rewards) {
    ensureV1State(user);
    for (const key of ["gold", "food", "steel"]) {
        user.v1.resources[key] = Math.max(0, Number(user.v1.resources[key]) || 0) + Math.max(0, Number(rewards[key]) || 0);
    }
    user.v1.stateVersion = (user.v1.stateVersion || 0) + 1;
}
function rewardsFor(target, won) {
    const factor = won ? 1 : 0.2;
    return {
        gold: Math.floor(target.reward.gold * factor),
        food: Math.floor(target.reward.food * factor),
        steel: Math.floor(target.reward.steel * factor)
    };
}

export function startMapHunt(db, userId, user, payload = {}) {
    ensureCollections(db, user);
    const targetId = String(payload.targetId || "");
    const target = HUNT_TARGETS[targetId];
    if (!target) return businessError(400, "Unknown hunt target");
    const formation = getHeroSnapshot(user, payload.heroIds);
    if (!formation) return businessError(400, "Formation must contain 1–5 unique owned heroes");
    const troopCount = payload.troopCount === undefined ? 0 : payload.troopCount;
    if (!Number.isSafeInteger(troopCount) || troopCount < 0 || troopCount > 1_000_000) return businessError(400, "Invalid troop count");
    const operationId = validId(payload.operationId) ? payload.operationId : "";
    if (!operationId) return businessError(400, "operationId is required");
    const prior = db.hunts[operationId];
    if (prior) {
        if (prior.playerId !== userId) return businessError(409, "operationId already used");
        return { ...prior, resources: { ...user.v1.resources }, troops: user.v1.troops, replayed: true };
    }
    if (troopCount > user.v1.troops) return businessError(409, "Not enough available troops");
    if (user.v1.resources.energy < target.energyCost) return businessError(409, "Insufficient energy");
    const now = Date.now();
    const huntId = `hunt_${crypto.randomUUID()}`;
    const hunt = {
        huntId, operationId, playerId: userId, targetId, kind: target.kind, level: target.level,
        formation, troopCount,
        energyCost: target.energyCost, startedAtMs: now, endsAtMs: now + target.travelMs,
        status: "marching", rewardReceipt: null, result: null
    };
    user.v1.resources.energy -= target.energyCost;
    user.v1.troops -= troopCount;
    user.v1.marches.push({ marchId: huntId, targetId, departAtMs: now, arriveAtMs: hunt.endsAtMs, status: "marching" });
    db.hunts[operationId] = hunt;
    user.v1.stateVersion = (user.v1.stateVersion || 0) + 1;
    return { ...hunt, resources: { ...user.v1.resources }, troops: user.v1.troops };
}

export function createMapRally(db, userId, user, payload = {}) {
    ensureCollections(db, user);
    const allianceId = user.v1.alliances?.allianceId;
    if (!isAllianceMember(user, allianceId) || !db.alliances?.[allianceId]) return businessError(409, "Join an alliance before creating a rally");
    const targetId = String(payload.targetId || "");
    const target = HUNT_TARGETS[targetId];
    if (!target) return businessError(400, "Unknown rally target");
    const heroIds = payload.heroIds;
    const formation = getHeroSnapshot(user, heroIds);
    if (!formation) return businessError(400, "Formation must contain 1–5 unique owned heroes");
    const troopCount = payload.troopCount;
    if (!validTroops(troopCount)) return businessError(400, "Invalid troop count");
    const operationId = validId(payload.operationId) ? payload.operationId : "";
    if (!operationId) return businessError(400, "operationId is required");
    const prior = db.rallies[operationId];
    if (prior) {
        if (prior.leaderId !== userId) return businessError(409, "operationId already used");
        return { ...prior, resources: { ...user.v1.resources }, troops: user.v1.troops, replayed: true };
    }
    if (troopCount > user.v1.troops) return businessError(409, "Not enough available troops");
    if (user.v1.resources.energy < target.energyCost) return businessError(409, "Insufficient energy");
    const now = Date.now();
    const rallyId = `rally_${crypto.randomUUID()}`;
    const rally = {
        rallyId, operationId, allianceId, targetId, leaderId: userId, capacity: RALLY_CAPACITY,
        status: "recruiting", createdAtMs: now, closeAtMs: now + 5 * 60_000,
        participants: [{ playerId: userId, heroIds: formation.map(hero => hero.heroId), formation, troopCount, energyCost: target.energyCost }],
        result: null, rewardReceipts: {}
    };
    user.v1.resources.energy -= target.energyCost;
    user.v1.troops -= troopCount;
    db.rallies[operationId] = rally;
    user.v1.stateVersion = (user.v1.stateVersion || 0) + 1;
    return { ...rally, resources: { ...user.v1.resources }, troops: user.v1.troops };
}

export function joinMapRally(db, userId, user, operationId, payload = {}) {
    ensureCollections(db, user);
    const rally = db.rallies[operationId];
    if (!rally) return businessError(404, "Rally not found");
    if (!isAllianceMember(user, rally.allianceId)) return businessError(403, "Only members of the rally alliance can join");
    if (rally.status !== "recruiting" || Date.now() >= rally.closeAtMs) return businessError(409, "Rally recruitment is closed");
    if (rally.participants.some(p => p.playerId === userId)) return businessError(409, "Player already joined this rally");
    if (rally.participants.length >= rally.capacity) return businessError(409, "Rally is full");
    const formation = getHeroSnapshot(user, payload.heroIds);
    if (!formation) return businessError(400, "Formation must contain 1–5 unique owned heroes");
    if (!validTroops(payload.troopCount)) return businessError(400, "Invalid troop count");
    if (payload.troopCount > user.v1.troops) return businessError(409, "Not enough available troops");
    const target = HUNT_TARGETS[rally.targetId];
    if (!target || user.v1.resources.energy < target.energyCost) return businessError(409, "Insufficient energy or invalid target");
    const participant = { playerId: userId, heroIds: formation.map(hero => hero.heroId), formation, troopCount: payload.troopCount, energyCost: target.energyCost, joinedAtMs: Date.now() };
    // Reserve resources and troops in the same persisted operation as participation.
    rally.participants.push(participant);
    user.v1.resources.energy -= target.energyCost;
    user.v1.troops -= payload.troopCount;
    user.v1.stateVersion = (user.v1.stateVersion || 0) + 1;
    return { rally, resources: { ...user.v1.resources }, troops: user.v1.troops };
}

export function closeMapRally(db, userId, operationId) {
    const rally = db.rallies?.[operationId];
    if (!rally) return businessError(404, "Rally not found");
    if (rally.leaderId !== userId) return businessError(403, "Only the rally leader can close recruitment");
    if (rally.status !== "recruiting") return businessError(409, "Rally is not recruiting");
    rally.status = "assembling";
    rally.closedAtMs = Date.now();
    return { rally };
}

export function dispatchMapRally(db, userId, operationId) {
    const rally = db.rallies?.[operationId];
    if (!rally) return businessError(404, "Rally not found");
    if (rally.leaderId !== userId) return businessError(403, "Only the rally leader can dispatch");
    if (rally.status !== "assembling") return businessError(409, "Rally must be closed before dispatch");
    if (!rally.participants.length) return businessError(409, "Rally has no participants");
    rally.status = "marching";
    rally.dispatchedAtMs = Date.now();
    rally.arrivesAtMs = rally.dispatchedAtMs + HUNT_TARGETS[rally.targetId].travelMs;
    return { rally };
}

export function resolveMapHunt(db, userId, user, operationId, nowMs = Date.now()) {
    ensureCollections(db, user);
    const hunt = db.hunts?.[operationId];
    if (!hunt) return businessError(404, "Hunt not found");
    if (hunt.playerId !== userId) return businessError(403, "Only the hunt owner can resolve it");
    if (hunt.result && hunt.rewardReceipt) return { ...hunt, resources: { ...user.v1.resources }, troops: user.v1.troops, replayed: true };
    if (hunt.status !== "marching") return businessError(409, "Hunt is not marching");
    if (nowMs < hunt.endsAtMs) return businessError(409, "The march has not arrived yet");
    const target = HUNT_TARGETS[hunt.targetId];
    if (!target) return businessError(409, "Hunt target is no longer available");
    const power = formationPower(hunt.formation) + Math.max(0, Number(hunt.troopCount) || 0) * 40;
    const damage = combatDamage(power, operationId);
    const won = damage >= target.enemyHp;
    const rewards = rewardsFor(target, won);
    const result = {
        resultId: `result_${crypto.createHash("sha256").update(operationId).digest("hex").slice(0, 24)}`,
        rulesVersion: COMBAT_RULES_VERSION, outcome: won ? "victory" : "defeat",
        playerPower: power, enemyHp: target.enemyHp, damage, remainingEnemyHp: Math.max(0, target.enemyHp - damage),
        resolvedAtMs: nowMs
    };
    grantResources(user, rewards);
    const troopsLost = Math.floor((Number(hunt.troopCount) || 0) * (won ? 0.02 : 0.25));
    const troopsReturned = Math.max(0, (Number(hunt.troopCount) || 0) - troopsLost);
    user.v1.troops += troopsReturned;
    const receipt = { receiptId: `reward_${result.resultId}_${userId}`, playerId: userId, resultId: result.resultId, rewards, troopsCommitted: Number(hunt.troopCount) || 0, troopsLost, troopsReturned, grantedAtMs: nowMs };
    hunt.status = "completed";
    hunt.result = result;
    hunt.rewardReceipt = receipt;
    hunt.completedAtMs = nowMs;
    user.v1.marches = (user.v1.marches || []).map(march => march.marchId === hunt.huntId ? { ...march, status: "completed" } : march);
    return { ...hunt, rewardReceipt: receipt, resources: { ...user.v1.resources }, troops: user.v1.troops, replayed: false };
}

export function resolveMapRally(db, userId, user, operationId, nowMs = Date.now()) {
    ensureCollections(db, user);
    const rally = db.rallies?.[operationId];
    if (!rally) return businessError(404, "Rally not found");
    if (!isAllianceMember(user, rally.allianceId)) return businessError(403, "Only alliance members can resolve this rally");
    if (rally.result && rally.status === "completed") {
        return { rally, rewardReceipt: rally.rewardReceipts?.[userId] || null, resources: { ...user.v1.resources }, troops: user.v1.troops, replayed: true };
    }
    if (rally.status !== "marching") return businessError(409, "Rally must be marching before resolution");
    if (nowMs < rally.arrivesAtMs) return businessError(409, "The rally has not arrived yet");
    const target = HUNT_TARGETS[rally.targetId];
    if (!target) return businessError(409, "Rally target is no longer available");
    const participants = rally.participants || [];
    const missingUsers = participants.filter(participant => !db.users?.[participant.playerId]);
    if (missingUsers.length) return businessError(409, "A rally participant is no longer available");
    const participantPowers = participants.map(participant => ({
        playerId: participant.playerId,
        power: formationPower(participant.formation) + Math.max(0, Number(participant.troopCount) || 0) * 40
    }));
    const totalPower = participantPowers.reduce((sum, participant) => sum + participant.power, 0);
    const damage = combatDamage(totalPower, operationId);
    const won = damage >= target.enemyHp;
    const result = {
        resultId: `result_${crypto.createHash("sha256").update(operationId).digest("hex").slice(0, 24)}`,
        rulesVersion: COMBAT_RULES_VERSION, outcome: won ? "victory" : "defeat",
        totalPower, enemyHp: target.enemyHp, damage, remainingEnemyHp: Math.max(0, target.enemyHp - damage),
        participants: participantPowers, resolvedAtMs: nowMs
    };
    const rewardReceipts = {};
    for (const participant of participants) {
        const participantUser = db.users[participant.playerId];
        const rewards = rewardsFor(target, won);
        grantResources(participantUser, rewards);
        const troopsCommitted = Number(participant.troopCount) || 0;
        const troopsLost = Math.floor(troopsCommitted * (won ? 0.02 : 0.25));
        const troopsReturned = Math.max(0, troopsCommitted - troopsLost);
        participantUser.v1.troops += troopsReturned;
        rewardReceipts[participant.playerId] = {
            receiptId: `reward_${result.resultId}_${participant.playerId}`,
            playerId: participant.playerId, resultId: result.resultId, rewards,
            troopsCommitted, troopsLost, troopsReturned, grantedAtMs: nowMs
        };
    }
    rally.status = "completed";
    rally.result = result;
    rally.rewardReceipts = rewardReceipts;
    rally.completedAtMs = nowMs;
    return { rally, rewardReceipt: rewardReceipts[userId] || null, resources: { ...user.v1.resources }, troops: user.v1.troops, replayed: false };
}

export function listMapBattleHistory(db, userId, user, limit = 20) {
    ensureV1State(user);
    const safeLimit = Number.isSafeInteger(limit) ? Math.max(1, Math.min(50, limit)) : 20;
    const hunts = Object.values(db.hunts || {})
        .filter(hunt => hunt.playerId === userId)
        .map(hunt => ({
            type: "hunt",
            operationId: hunt.operationId,
            targetId: hunt.targetId,
            status: hunt.status,
            startedAtMs: hunt.startedAtMs,
            completedAtMs: hunt.completedAtMs || null,
            result: hunt.result || null,
            rewardReceipt: hunt.rewardReceipt || null
        }));
    const rallies = Object.values(db.rallies || {})
        .filter(rally => isAllianceMember(user, rally.allianceId) &&
            (rally.participants || []).some(participant => participant.playerId === userId))
        .map(rally => ({
            type: "alliance-rally",
            operationId: rally.operationId,
            targetId: rally.targetId,
            status: rally.status,
            startedAtMs: rally.dispatchedAtMs || rally.createdAtMs,
            completedAtMs: rally.completedAtMs || null,
            result: rally.result || null,
            rewardReceipt: rally.rewardReceipts?.[userId] || null
        }));
    return {
        battles: [...hunts, ...rallies]
            .sort((a, b) => (b.completedAtMs || b.startedAtMs || 0) - (a.completedAtMs || a.startedAtMs || 0))
            .slice(0, safeLimit)
    };
}

export function getMapRally(db, userId, user, operationId) {
    ensureV1State(user);
    const rally = db.rallies?.[operationId];
    if (!rally) return businessError(404, "Rally not found");
    if (!isAllianceMember(user, rally.allianceId)) return businessError(403, "Only members of the rally alliance can view it");
    return { rally };
}

export const MAP_HUNT_TARGETS = HUNT_TARGETS;
