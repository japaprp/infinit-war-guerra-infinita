import crypto from "node:crypto";
import { ensureV1State } from "./userService.js";

const PRESETS = ["I", "II", "III", "IV"];
const SLOTS = ["assault", "vanguard", "suppression", "gravity"];
const CHIP_CATALOG = {
    "assault-module": { name: "Módulo de Assalto", role: "Guerreiro", rarity: "Épico", stat: "attackPct", basePct: 32.6, levelStepPct: 9.6, upgradeCopies: 5 },
    "gravity-barrier": { name: "Barreira Gravitacional", role: "Guerreiro", rarity: "Épico", stat: "hpPct", basePct: 6.8, levelStepPct: 9.6, upgradeCopies: 3 },
    "recon-array": { name: "Matriz de Reconhecimento", role: "Batedor", rarity: "Raro", stat: "attackPct", basePct: 12, levelStepPct: 9.6, upgradeCopies: 4 },
    "supply-core": { name: "Núcleo de Suprimentos", role: "Suporte", rarity: "Raro", stat: "hpPct", basePct: 10, levelStepPct: 9.6, upgradeCopies: 4 }
};
const CHEST_TYPES = new Set(["explorer", "module"]);
const MAX_HEROES = 5;
const MAX_TROOPS = 1_000_000;

function nowMs() { return Date.now(); }
function id(prefix) { return `${prefix}_${crypto.randomUUID()}`; }
function safeInt(value, fallback = 0) {
    const n = Number(value);
    return Number.isSafeInteger(n) ? n : fallback;
}
function resultError(status, message) { return { error: { status, message } }; }

export function ensureGameData(user) {
    ensureV1State(user);
    if (!user.v1.gameData || typeof user.v1.gameData !== "object" || Array.isArray(user.v1.gameData)) user.v1.gameData = {};
    const data = user.v1.gameData;
    if (!data.hunts || typeof data.hunts !== "object" || Array.isArray(data.hunts)) data.hunts = {};
    if (!data.vehicle || typeof data.vehicle !== "object" || Array.isArray(data.vehicle)) data.vehicle = {};
    data.vehicle.inventory = Array.isArray(data.vehicle.inventory)
        ? data.vehicle.inventory.filter((chip) => chip && typeof chip.id === "string" && Object.hasOwn(CHIP_CATALOG, chip.typeId) && Number.isInteger(chip.level) && chip.level >= 1 && chip.level <= 10).slice(0, 500)
        : [];
    const sourcePresets = data.vehicle.presets && typeof data.vehicle.presets === "object" && !Array.isArray(data.vehicle.presets) ? data.vehicle.presets : {};
    const ownedIds = new Set(data.vehicle.inventory.map((chip) => chip.id));
    const presets = Object.fromEntries(PRESETS.map((preset) => [preset, Object.fromEntries(SLOTS.map((slot) => [slot, null]))]));
    for (const preset of PRESETS) {
        const seen = new Set();
        for (const slot of SLOTS) {
            const chipId = sourcePresets[preset]?.[slot];
            if (typeof chipId === "string" && ownedIds.has(chipId) && !seen.has(chipId)) {
                presets[preset][slot] = chipId;
                seen.add(chipId);
            }
        }
    }
    data.vehicle.presets = presets;
    data.vehicle.activePreset = PRESETS.includes(data.vehicle.activePreset) ? data.vehicle.activePreset : "I";
    data.vehicle.chipMaterials = Math.max(0, safeInt(data.vehicle.chipMaterials));
    data.chests = Array.isArray(data.chests)
        ? data.chests.filter((chest) => chest && typeof chest.id === "string" && CHEST_TYPES.has(chest.type)).slice(-100)
        : [];
    data.equipment = Array.isArray(data.equipment)
        ? data.equipment.filter((item) => item && typeof item.id === "string" && ["weapon", "armor", "boots"].includes(item.slot) && Number.isFinite(item.bonus) && item.bonus > 0).slice(-500)
        : [];
    data.shards = data.shards && typeof data.shards === "object" && !Array.isArray(data.shards) ? data.shards : { bronze: 0, silver: 0, gold: 0 };
    for (const key of ["bronze", "silver", "gold"]) data.shards[key] = Math.max(0, safeInt(data.shards[key]));
    if (!data.chestReceipts || typeof data.chestReceipts !== "object" || Array.isArray(data.chestReceipts)) data.chestReceipts = {};
    data.battleHistory = Array.isArray(data.battleHistory) ? data.battleHistory.filter((battle) => battle && typeof battle.operationId === "string").slice(0, 100) : [];
    return data;
}

function validateFormation(user, payload) {
    const ids = payload?.heroIds;
    if (!Array.isArray(ids) || ids.length < 1 || ids.length > MAX_HEROES || new Set(ids).size !== ids.length) {
        return resultError(400, "heroIds must contain 1 to 5 unique hero IDs");
    }
    const heroes = user.v1.heroes || [];
    const selected = ids.map((heroId) => heroes.find((hero) => hero.heroId === heroId));
    if (selected.some((hero) => !hero)) return resultError(400, "Formation contains a hero not owned by this player");
    const troopCount = Number(payload.troopCount);
    if (!Number.isSafeInteger(troopCount) || troopCount < 1 || troopCount > MAX_TROOPS) return resultError(400, "troopCount must be between 1 and 1,000,000");
    return { heroes: selected, troopCount };
}

function targetDifficulty(targetId) {
    const hash = crypto.createHash("sha256").update(String(targetId)).digest();
    return 1200 + hash.readUInt16BE(0) % 8800;
}

function battleResult({ operationId, targetId, heroes, troopCount, participants = [] }) {
    const heroPower = heroes.reduce((sum, hero) => sum + Math.max(0, Number(hero.stats?.power) || 0), 0);
    const participantPower = participants.reduce((sum, p) => sum + Math.max(0, Number(p.power) || 0), 0);
    const totalTroops = participants.length ? participants.reduce((sum, p) => sum + p.troopCount, 0) : troopCount;
    const force = Math.max(1, heroPower + participantPower + totalTroops * 18);
    const enemyHp = targetDifficulty(targetId);
    const seed = crypto.createHash("sha256").update(operationId).digest()[0];
    const damage = Math.min(enemyHp, Math.floor(force / 45) + seed * 5);
    const outcome = damage >= enemyHp * 0.72 ? "victory" : "defeat";
    return { resultId: `result_${crypto.createHash("sha256").update(operationId).digest("hex").slice(0, 24)}`, outcome, damage, enemyHp, resolvedAtMs: nowMs() };
}

function addChest(data, type = "explorer") {
    const chest = { id: id("chest"), type, source: "server", obtainedAt: nowMs() };
    data.chests.push(chest);
    data.chests = data.chests.slice(-100);
    return chest;
}

function grantBattleRewards(user, operationId, battle) {
    const data = ensureGameData(user);
    const rewards = battle.outcome === "victory"
        ? { gold: 180 + (battle.damage % 121), steel: 90 + (battle.enemyHp % 61), food: 25 + (battle.damage % 31) }
        : { gold: 25, steel: 10, food: 10 };
    for (const [key, amount] of Object.entries(rewards)) {
        user.v1.resources[key] = Math.max(0, safeInt(user.v1.resources[key]) + amount);
    }
    // The browser prototype's original chest drop chance is 10%. Derive the roll
    // from the operation ID so retries cannot reroll the reward.
    const chestRoll = crypto.createHash("sha256").update(`${operationId}:chest-drop`).digest()[0] % 100;
    const chestReward = battle.outcome === "victory" && chestRoll < 10 ? addChest(data, "explorer") : null;
    const lossRate = battle.outcome === "victory" ? 0.03 : 0.15;
    const troopsLost = Math.floor(safeInt(battle.troopCount) * lossRate);
    const receipt = {
        operationId,
        rewards,
        troopsReturned: Math.max(0, safeInt(battle.troopCount) - troopsLost),
        troopsLost,
        chestReward
    };
    return { rewards, receipt, chestReward, resources: { ...user.v1.resources } };
}

function recordBattle(db, userId, battle) {
    db.battles ||= {};
    db.battles[battle.operationId] = battle;
    const battleIds = Object.keys(db.battles);
    if (battleIds.length > 1000) {
        const removable = battleIds.sort((a, b) => (db.battles[a]?.endedAtMs || 0) - (db.battles[b]?.endedAtMs || 0));
        for (const oldId of removable.slice(0, battleIds.length - 1000)) delete db.battles[oldId];
    }
    const user = db.users[userId];
    if (user) {
        const data = ensureGameData(user);
        data.battleHistory = [battle, ...data.battleHistory.filter((entry) => entry.operationId !== battle.operationId)].slice(0, 100);
    }
}

export function getBattleHistory(user, limit = 20) {
    const data = ensureGameData(user);
    const count = Math.max(1, Math.min(100, safeInt(limit, 20)));
    return { battles: data.battleHistory.slice(0, count) };
}

export function startHunt(userId, user, payload = {}) {
    const data = ensureGameData(user);
    const operationId = String(payload.operationId || "").trim();
    const targetId = String(payload.targetId || "").trim();
    if (!operationId || operationId.length > 120 || !targetId || targetId.length > 120) return resultError(400, "operationId and targetId are required");
    if (data.hunts[operationId]) return { ...data.hunts[operationId], resources: { ...user.v1.resources }, stateVersion: user.v1.stateVersion, replayed: true };
    const formation = validateFormation(user, payload);
    if (formation.error) return formation;
    if (user.v1.resources.energy < 10) return resultError(409, "Insufficient energy");
    const startedAtMs = nowMs();
    const hunt = { operationId, huntId: id("hunt"), ownerPlayerId: userId, targetId, heroIds: payload.heroIds.slice(), troopCount: formation.troopCount, status: "IN_PROGRESS", startedAtMs, endsAtMs: startedAtMs + 60_000, result: null, rewardReceipt: null };
    user.v1.resources.energy -= 10;
    data.hunts[operationId] = hunt;
    const huntIds = Object.keys(data.hunts);
    if (huntIds.length > 100) {
        const removable = huntIds.sort((a, b) => (data.hunts[a]?.startedAtMs || 0) - (data.hunts[b]?.startedAtMs || 0));
        for (const oldId of removable.slice(0, huntIds.length - 100)) delete data.hunts[oldId];
    }
    user.v1.stateVersion += 1;
    return { ...hunt, resources: { ...user.v1.resources }, stateVersion: user.v1.stateVersion };
}

export function resolveHunt(db, userId, user, operationId) {
    const data = ensureGameData(user);
    const hunt = data.hunts[String(operationId || "")];
    if (!hunt) return resultError(404, "Hunt not found for this player");
    if (hunt.status === "RESOLVED") return { ...hunt, result: hunt.result, rewardReceipt: hunt.rewardReceipt, chestReward: hunt.rewardReceipt?.chestReward || null, resources: { ...user.v1.resources }, replayed: true };
    if (nowMs() < hunt.endsAtMs) return resultError(409, "Hunt has not arrived yet");
    const heroes = hunt.heroIds.map((heroId) => user.v1.heroes.find((hero) => hero.heroId === heroId)).filter(Boolean);
    const result = battleResult({ operationId: hunt.operationId, targetId: hunt.targetId, heroes, troopCount: hunt.troopCount });
    const rewards = grantBattleRewards(user, hunt.operationId, { ...result, troopCount: hunt.troopCount });
    Object.assign(hunt, { status: "RESOLVED", result, rewardReceipt: { operationId: hunt.operationId, rewards: rewards.rewards, troopsReturned: rewards.receipt.troopsReturned, troopsLost: rewards.receipt.troopsLost, chestReward: rewards.chestReward } });
    user.v1.stateVersion += 1;
    recordBattle(db, userId, { operationId: hunt.operationId, type: "hunt", targetId: hunt.targetId, status: hunt.status, result, rewardReceipt: hunt.rewardReceipt, endedAtMs: nowMs() });
    return { ...hunt, ...rewards, result, rewardReceipt: hunt.rewardReceipt, resources: { ...user.v1.resources }, stateVersion: user.v1.stateVersion };
}

export function createAllianceRally(db, userId, user, payload = {}) {
    const operationId = String(payload.operationId || "").trim();
    const targetId = String(payload.targetId || "").trim();
    if (!operationId || operationId.length > 120 || !targetId || targetId.length > 120) return resultError(400, "operationId and targetId are required");
    db.rallies ||= {};
    if (db.rallies[operationId]) {
        if (db.rallies[operationId].leaderPlayerId === userId) return { rally: db.rallies[operationId], replayed: true };
        return resultError(409, "operationId is already in use");
    }
    const formation = validateFormation(user, payload);
    if (formation.error) return formation;
    if (!Number.isSafeInteger(Number(payload.troopCount)) || formation.troopCount < 1) return resultError(400, "troopCount must be between 1 and 1,000,000");
    if (!user.v1.alliances?.allianceId) return resultError(409, "Join or create an alliance before creating a rally");
    const rally = {
        operationId, rallyId: id("rally"), targetId, allianceId: user.v1.alliances.allianceId,
        leaderPlayerId: userId, status: "OPEN", capacity: 5,
        createdAtMs: nowMs(), closeAtMs: nowMs() + 300_000, endsAtMs: null,
        participants: [{ playerId: userId, heroIds: payload.heroIds.slice(), troopCount: formation.troopCount, power: formation.heroes.reduce((sum, hero) => sum + (Number(hero.stats?.power) || 0), 0) }],
        result: null, rewardReceipts: {}
    };
    db.rallies[operationId] = rally;
    const rallyIds = Object.keys(db.rallies);
    if (rallyIds.length > 500) {
        const removable = rallyIds
            .filter((key) => db.rallies[key]?.status === "RESOLVED")
            .sort((a, b) => (db.rallies[a]?.resolvedAtMs || 0) - (db.rallies[b]?.resolvedAtMs || 0));
        for (const oldId of removable.slice(0, Math.max(0, rallyIds.length - 500))) delete db.rallies[oldId];
    }
    return { rally, resources: { ...user.v1.resources } };
}

export function getAllianceRally(db, userId, operationId) {
    const rally = (db.rallies || {})[operationId];
    if (!rally) return resultError(404, "Rally not found");
    const user = db.users[userId];
    if (!user || user.v1?.alliances?.allianceId !== rally.allianceId) return resultError(403, "Only members of this alliance can view the rally");
    return { rally };
}

export function joinAllianceRally(db, userId, user, payload = {}) {
    const operationId = String(payload.operationId || "");
    const rally = (db.rallies || {})[operationId];
    if (!rally) return resultError(404, "Rally not found");
    if (rally.status !== "OPEN" || nowMs() > rally.closeAtMs) return resultError(409, "Rally is no longer accepting participants");
    if (user.v1?.alliances?.allianceId !== rally.allianceId) return resultError(403, "Join the rally's alliance first");
    const existing = rally.participants.find((p) => p.playerId === userId);
    if (existing) return { rally, resources: { ...user.v1.resources }, replayed: true };
    const formation = validateFormation(user, payload);
    if (formation.error) return formation;
    if (!Number.isSafeInteger(Number(payload.troopCount)) || formation.troopCount < 1) return resultError(400, "troopCount must be between 1 and 1,000,000");
    if (rally.participants.length >= rally.capacity) return resultError(409, "Rally is full");
    rally.participants.push({ playerId: userId, heroIds: payload.heroIds.slice(), troopCount: formation.troopCount, power: formation.heroes.reduce((sum, hero) => sum + (Number(hero.stats?.power) || 0), 0) });
    return { rally, resources: { ...user.v1.resources } };
}

export function transitionAllianceRally(db, userId, action, operationId) {
    const rally = (db.rallies || {})[operationId];
    if (!rally) return resultError(404, "Rally not found");
    if (rally.leaderPlayerId !== userId) return resultError(403, "Only the rally leader can perform this action");
    if (action === "close") {
        if (rally.status !== "OPEN") return resultError(409, "Only an open rally can be closed");
        rally.status = "CLOSED";
        rally.closedAtMs = nowMs();
    } else if (action === "dispatch") {
        if (rally.status !== "OPEN" && rally.status !== "CLOSED") return resultError(409, "Rally cannot be dispatched in its current state");
        if (!rally.participants.length) return resultError(409, "Rally has no participants");
        rally.status = "DISPATCHED";
        rally.dispatchedAtMs = nowMs();
        rally.endsAtMs = rally.dispatchedAtMs + 60_000;
    }
    return { rally };
}

export function resolveAllianceRally(db, userId, operationId) {
    const rally = (db.rallies || {})[operationId];
    if (!rally) return resultError(404, "Rally not found");
    const user = db.users[userId];
    if (!user || user.v1?.alliances?.allianceId !== rally.allianceId) return resultError(403, "Only members of this alliance can resolve the rally");
    if (rally.status === "RESOLVED") {
        const prior = rally.rewardReceipts[userId];
        return { rally, result: rally.result, rewardReceipt: prior || null, ...(prior || {}), resources: { ...user.v1.resources }, replayed: true };
    }
    if (rally.status !== "DISPATCHED") return resultError(409, "Dispatch the rally before resolving it");
    if (nowMs() < rally.endsAtMs) return resultError(409, "Rally has not arrived yet");
    const allHeroes = rally.participants.flatMap((participant) => {
        const participantUser = db.users[participant.playerId];
        return (participant.heroIds || []).map((heroId) => participantUser?.v1?.heroes?.find((hero) => hero.heroId === heroId)).filter(Boolean);
    });
    const result = battleResult({ operationId: rally.operationId, targetId: rally.targetId, heroes: allHeroes, troopCount: 0, participants: rally.participants });
    rally.result = result;
    rally.status = "RESOLVED";
    rally.resolvedAtMs = nowMs();
    for (const participant of rally.participants) {
        const participantUser = db.users[participant.playerId];
        if (!participantUser) continue;
        ensureGameData(participantUser);
        const rewards = grantBattleRewards(participantUser, rally.operationId, { ...result, troopCount: participant.troopCount });
        const receipt = { operationId: rally.operationId, rewards: rewards.rewards, troopsReturned: rewards.receipt.troopsReturned, troopsLost: rewards.receipt.troopsLost, chestReward: rewards.chestReward };
        rally.rewardReceipts[participant.playerId] = receipt;
        participantUser.v1.stateVersion += 1;
        recordBattle(db, participant.playerId, { operationId: rally.operationId, type: "alliance-rally", targetId: rally.targetId, status: rally.status, result, rewardReceipt: receipt, endedAtMs: rally.resolvedAtMs });
    }
    const receipt = rally.rewardReceipts[userId];
    return { rally, result, rewardReceipt: receipt, ...(receipt || {}), resources: { ...user.v1.resources } };
}

export function getVehicleLoadout(user) {
    const data = ensureGameData(user);
    return { inventory: data.vehicle.inventory, presets: data.vehicle.presets, activePreset: data.vehicle.activePreset, chipMaterials: data.vehicle.chipMaterials };
}

export function setActiveVehiclePreset(user, presetId) {
    const data = ensureGameData(user);
    if (!PRESETS.includes(presetId)) return resultError(400, "Invalid vehicle preset");
    data.vehicle.activePreset = presetId;
    user.v1.stateVersion += 1;
    return getVehicleLoadout(user);
}

export function equipVehicleChip(user, { chipId, slotId, presetId } = {}) {
    const data = ensureGameData(user);
    const preset = presetId || data.vehicle.activePreset;
    if (!PRESETS.includes(preset)) return resultError(400, "Invalid vehicle preset");
    if (!SLOTS.includes(slotId)) return resultError(400, "Invalid vehicle slot");
    if (!data.vehicle.inventory.some((chip) => chip.id === chipId)) return resultError(404, "Chip not found in inventory");
    const slots = data.vehicle.presets[preset];
    if (Object.entries(slots).some(([slot, current]) => slot !== slotId && current === chipId)) return resultError(409, "Chip is already assigned to another slot in this preset");
    slots[slotId] = chipId;
    data.vehicle.activePreset = preset;
    user.v1.stateVersion += 1;
    return getVehicleLoadout(user);
}

export function removeVehicleChip(user, { slotId, presetId } = {}) {
    const data = ensureGameData(user);
    const preset = presetId || data.vehicle.activePreset;
    if (!PRESETS.includes(preset)) return resultError(400, "Invalid vehicle preset");
    if (!SLOTS.includes(slotId)) return resultError(400, "Invalid vehicle slot");
    data.vehicle.presets[preset][slotId] = null;
    data.vehicle.activePreset = preset;
    user.v1.stateVersion += 1;
    return getVehicleLoadout(user);
}

export function upgradeVehicleChip(user, chipId) {
    const data = ensureGameData(user);
    const chip = data.vehicle.inventory.find((item) => item.id === chipId);
    if (!chip) return resultError(404, "Chip not found in inventory");
    if (chip.level >= 10) return resultError(409, "Chip is already at max level");
    const definition = CHIP_CATALOG[chip.typeId];
    if (!definition) return resultError(400, "Unknown chip type");
    if (PRESETS.some((preset) => Object.values(data.vehicle.presets[preset]).includes(chipId))) return resultError(409, "Remove chip from vehicle presets before upgrading");
    const copies = data.vehicle.inventory.filter((item) => item.typeId === chip.typeId && item.id !== chipId && !PRESETS.some((preset) => Object.values(data.vehicle.presets[preset]).includes(item.id)));
    if (copies.length < definition.upgradeCopies) return resultError(409, `Upgrade requires ${definition.upgradeCopies} additional copies`);
    const consumeIds = new Set(copies.slice(0, definition.upgradeCopies).map((item) => item.id));
    data.vehicle.inventory = data.vehicle.inventory.filter((item) => !consumeIds.has(item.id));
    chip.level += 1;
    user.v1.stateVersion += 1;
    return getVehicleLoadout(user);
}

export function getServerChests(user) {
    const data = ensureGameData(user);
    return { chests: data.chests, chipMaterials: data.vehicle.chipMaterials, equipment: data.equipment, shards: data.shards, receipts: Object.values(data.chestReceipts) };
}

function chestReward(user, chest) {
    const data = ensureGameData(user);
    const digest = crypto.createHash("sha256").update(chest.id).digest();
    const roll = digest[0] % 100;

    if (chest.type === "module") {
        // Preserve the original prototype's module-chest distribution:
        // legendary 0.2%, four rare modules 7.5% each, epic 30%, materials 39.8%.
        const preciseRoll = (digest.readUInt32BE(0) / 0x1_0000_0000) * 100;
        if (preciseRoll < 0.2) {
            const definition = CHIP_CATALOG["assault-module"];
            const chip = { id: id("chip"), typeId: "assault-module", name: definition.name, role: definition.role, level: 5, rarity: "Lendário", source: "server", obtainedAt: nowMs() };
            data.vehicle.inventory.push(chip);
            return { type: "chip", chip };
        }
        if (preciseRoll < 7.7) return grantChip(data, "assault-module", 1, "Raro");
        if (preciseRoll < 15.2) return grantChip(data, "gravity-barrier", 1, "Raro");
        if (preciseRoll < 22.7) return grantChip(data, "recon-array", 1, "Raro");
        if (preciseRoll < 30.2) return grantChip(data, "supply-core", 1, "Raro");
        if (preciseRoll < 60.2) {
            const typeId = digest[1] % 2 === 0 ? "assault-module" : "gravity-barrier";
            return grantChip(data, typeId, 2, "Épico");
        }
        const amount = 20 + (digest[1] % 41);
        data.vehicle.chipMaterials += amount;
        return { type: "chipMaterials", amount };
    }

    // Explorer chest weights match the browser prototype: resources 45%, shards
    // 25%, equipment 15%, and a module chest 15%. Reward selection is deterministic
    // per chest ID so an idempotent retry cannot generate a different item.
    if (roll < 45) {
        const rewards = { gold: 250 + (digest[1] % 751), steel: 200 + (digest[2] % 601), food: 40 + (digest[3] % 81) };
        for (const [key, amount] of Object.entries(rewards)) user.v1.resources[key] = safeInt(user.v1.resources[key]) + amount;
        return { type: "resources", ...rewards };
    }
    if (roll < 70) {
        const pool = ["bronze", "silver", "gold"][digest[1] % 3];
        const amount = pool === "bronze" ? 3 : pool === "silver" ? 2 : 1;
        data.shards[pool] = safeInt(data.shards[pool]) + amount;
        return { type: "shards", pool, amount };
    }
    if (roll < 85) {
        const slot = ["weapon", "armor", "boots"][digest[1] % 3];
        const rarityRoll = digest[2] % 100;
        const rarity = rarityRoll < 72 ? "common" : rarityRoll < 95 ? "rare" : "epic";
        const multiplier = rarity === "common" ? 1 : rarity === "rare" ? 1.6 : 2.5;
        const bonus = Math.max(1, Math.floor((5 + 8 * 0.6) * multiplier));
        const slotLabel = { weapon: "Lâmina", armor: "Couraça", boots: "Grevas" }[slot];
        const rarityLabel = { common: "Comum", rare: "Raro", epic: "Épico" }[rarity];
        const item = { id: id("equipment"), slot, rarity, rarityLabel, name: `${slotLabel} ${rarityLabel}`, bonus, obtainedAt: nowMs() };
        data.equipment.push(item);
        data.equipment = data.equipment.slice(-500);
        return { type: "equipment", item };
    }
    const moduleChest = addChest(data, "module");
    return { type: "moduleChest", moduleChestAdded: true, moduleChest };
}

function grantChip(data, typeId, level, rarity) {
    const definition = CHIP_CATALOG[typeId];
    const chip = { id: id("chip"), typeId, name: definition.name, role: definition.role, level, rarity, source: "server", obtainedAt: nowMs() };
    data.vehicle.inventory.push(chip);
    data.vehicle.inventory = data.vehicle.inventory.slice(-500);
    return { type: "chip", chip };
}

export function openServerChest(user, chestId, idempotencyKey) {
    const data = ensureGameData(user);
    if (!chestId || !idempotencyKey || idempotencyKey.length > 160) return resultError(400, "chestId and idempotencyKey are required");
    const prior = data.chestReceipts[idempotencyKey];
    if (prior) return { ...prior, replayed: true };
    const index = data.chests.findIndex((chest) => chest.id === chestId);
    if (index < 0) return resultError(404, "Chest not found or already opened");
    const [chest] = data.chests.splice(index, 1);
    const reward = chestReward(user, chest);
    const receipt = { chestId, idempotencyKey, reward, resources: { ...user.v1.resources }, openedAtMs: nowMs() };
    data.chestReceipts[idempotencyKey] = receipt;
    const keys = Object.keys(data.chestReceipts);
    for (const key of keys.slice(0, Math.max(0, keys.length - 500))) delete data.chestReceipts[key];
    user.v1.stateVersion += 1;
    return receipt;
}
