import crypto from "crypto";
import { ensureV1State } from "./userService.js";

const HUNT_TARGETS = Object.freeze({
    "grey-forest-stalker": { energyCost: 15, travelMs: 30_000, level: 1, kind: "roaming_enemy" },
    "old-ruins-brute": { energyCost: 15, travelMs: 45_000, level: 2, kind: "roaming_enemy" }
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

export function startMapHunt(db, userId, user, payload = {}) {
    ensureCollections(db, user);
    const targetId = String(payload.targetId || "");
    const target = HUNT_TARGETS[targetId];
    if (!target) return businessError(400, "Unknown hunt target");
    const formation = getHeroSnapshot(user, payload.heroIds);
    if (!formation) return businessError(400, "Formation must contain 1–5 unique owned heroes");
    const operationId = validId(payload.operationId) ? payload.operationId : "";
    if (!operationId) return businessError(400, "operationId is required");
    const prior = db.hunts[operationId];
    if (prior) {
        if (prior.playerId !== userId) return businessError(409, "operationId already used");
        return { ...prior, resources: { ...user.v1.resources }, replayed: true };
    }
    if (user.v1.resources.energy < target.energyCost) return businessError(409, "Insufficient energy");
    const now = Date.now();
    const huntId = `hunt_${crypto.randomUUID()}`;
    const hunt = {
        huntId, operationId, playerId: userId, targetId, kind: target.kind, level: target.level,
        formation, energyCost: target.energyCost, startedAtMs: now, endsAtMs: now + target.travelMs,
        status: "marching", rewardReceipt: null
    };
    user.v1.resources.energy -= target.energyCost;
    user.v1.marches.push({ marchId: huntId, targetId, departAtMs: now, arriveAtMs: hunt.endsAtMs, status: "marching" });
    db.hunts[operationId] = hunt;
    user.v1.stateVersion = (user.v1.stateVersion || 0) + 1;
    return { ...hunt, resources: { ...user.v1.resources } };
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
    if (user.v1.resources.energy < target.energyCost) return businessError(409, "Insufficient energy");
    const operationId = validId(payload.operationId) ? payload.operationId : "";
    if (!operationId) return businessError(400, "operationId is required");
    const prior = db.rallies[operationId];
    if (prior) {
        if (prior.leaderId !== userId) return businessError(409, "operationId already used");
        return { ...prior, resources: { ...user.v1.resources }, replayed: true };
    }
    const now = Date.now();
    const rallyId = `rally_${crypto.randomUUID()}`;
    const rally = {
        rallyId, operationId, allianceId, targetId, leaderId: userId, capacity: RALLY_CAPACITY,
        status: "recruiting", createdAtMs: now, closeAtMs: now + 5 * 60_000,
        participants: [{ playerId: userId, heroIds: formation.map(hero => hero.heroId), formation, troopCount, energyCost: target.energyCost }],
        result: null, rewardReceipts: {}
    };
    user.v1.resources.energy -= target.energyCost;
    db.rallies[operationId] = rally;
    user.v1.stateVersion = (user.v1.stateVersion || 0) + 1;
    return { ...rally, resources: { ...user.v1.resources } };
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
    const target = HUNT_TARGETS[rally.targetId];
    if (!target || user.v1.resources.energy < target.energyCost) return businessError(409, "Insufficient energy or invalid target");
    const participant = { playerId: userId, heroIds: formation.map(hero => hero.heroId), formation, troopCount: payload.troopCount, energyCost: target.energyCost, joinedAtMs: Date.now() };
    rally.participants.push(participant);
    user.v1.resources.energy -= target.energyCost;
    user.v1.stateVersion = (user.v1.stateVersion || 0) + 1;
    return { rally, resources: { ...user.v1.resources } };
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

export function getMapRally(db, userId, user, operationId) {
    ensureV1State(user);
    const rally = db.rallies?.[operationId];
    if (!rally) return businessError(404, "Rally not found");
    if (!isAllianceMember(user, rally.allianceId)) return businessError(403, "Only members of the rally alliance can view it");
    return { rally };
}

export const MAP_HUNT_TARGETS = HUNT_TARGETS;
