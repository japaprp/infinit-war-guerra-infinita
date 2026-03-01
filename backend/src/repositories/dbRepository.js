import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = process.env.IWAR_DB_PATH || path.join(__dirname, "..", "..", "data", "db.json");

let mode = "json";
let mysqlPool = null;

function safeNumber(value, fallback = 0) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
}

function parseJsonField(rawValue, fallback) {
    if (rawValue === null || rawValue === undefined || rawValue === "") {
        return fallback;
    }

    if (typeof rawValue === "object") {
        return rawValue;
    }

    try {
        return JSON.parse(rawValue);
    } catch {
        return fallback;
    }
}

function inferProfileFromUserId(userId, fallbackNickname = "") {
    const parts = String(userId || "").split(":");
    const provider = parts[0] || "guest";
    const providerUid = parts.length > 1 ? parts.slice(1).join(":") : "guest";
    const displayName = fallbackNickname || `player_${providerUid.slice(0, 6)}`;

    return {
        provider,
        providerUid,
        email: "",
        displayName
    };
}

function buildDefaultV1(gems = 4210) {
    return {
        stateVersion: 1,
        level: 1,
        power: 12840,
        vipLevel: 0,
        resources: {
            gold: 80000,
            wood: 60000,
            steel: 50000,
            food: 55000,
            gems,
            energy: 120,
            energyMax: 120,
            energyRegenPerMinute: 1.2
        },
        heroes: [
            {
                heroId: "lucas",
                rarity: "LEGENDARY",
                level: 1,
                stars: 1,
                ascension: 0,
                stats: { atk: 15440, def: 14304, units: 503, power: 211203 },
                shardsOwned: 0,
                skillLevels: [1, 1, 1]
            },
            {
                heroId: "kai",
                rarity: "EPIC",
                level: 1,
                stars: 1,
                ascension: 0,
                stats: { atk: 12990, def: 11120, units: 422, power: 173520 },
                shardsOwned: 0,
                skillLevels: [1, 1, 1]
            }
        ],
        buildings: [
            {
                buildingId: "b_hq",
                buildingType: "hq",
                slotCode: "center",
                level: 1,
                state: "IDLE",
                endAtMs: 0,
                taskId: ""
            },
            {
                buildingId: "b_barracks",
                buildingType: "barracks",
                slotCode: "military_1",
                level: 1,
                state: "IDLE",
                endAtMs: 0,
                taskId: ""
            }
        ],
        alliances: {
            allianceId: "",
            name: "",
            tag: ""
        },
        pass: {
            seasonId: "season_1",
            claimed: {}
        }
    };
}

function normalizeDbShape(parsed) {
    return {
        users: parsed?.users || {},
        receipts: parsed?.receipts || {},
        alliances: parsed?.alliances || {}
    };
}

function readDbFromFile() {
    if (!fs.existsSync(DB_PATH)) {
        return normalizeDbShape(null);
    }

    try {
        const raw = fs.readFileSync(DB_PATH, "utf8");
        return normalizeDbShape(JSON.parse(raw));
    } catch {
        return normalizeDbShape(null);
    }
}

function writeDbToFile(db) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(normalizeDbShape(db), null, 2), "utf8");
}

async function ensureSqlSchema() {
    if (!mysqlPool) return;

    await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS app_state (
            id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
            payload JSON NOT NULL,
            updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
        ) ENGINE=InnoDB;
    `);

    await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            external_id VARCHAR(80) NOT NULL UNIQUE,
            nickname VARCHAR(32) NOT NULL,
            level INT UNSIGNED NOT NULL DEFAULT 1,
            vip_level TINYINT UNSIGNED NOT NULL DEFAULT 0,
            power BIGINT UNSIGNED NOT NULL DEFAULT 0,
            realm_id INT UNSIGNED NOT NULL DEFAULT 1,
            profile_json JSON NULL,
            created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
            updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
        ) ENGINE=InnoDB;
    `);

    await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS heroes (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            user_id BIGINT UNSIGNED NOT NULL,
            hero_code VARCHAR(48) NOT NULL,
            rarity VARCHAR(16) NOT NULL,
            level SMALLINT UNSIGNED NOT NULL DEFAULT 1,
            stars TINYINT UNSIGNED NOT NULL DEFAULT 1,
            ascension TINYINT UNSIGNED NOT NULL DEFAULT 0,
            shards_owned INT UNSIGNED NOT NULL DEFAULT 0,
            stats_json JSON NULL,
            skill_levels_json JSON NULL,
            created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
            updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
            UNIQUE KEY uk_heroes_user_code (user_id, hero_code),
            CONSTRAINT fk_heroes_user FOREIGN KEY (user_id) REFERENCES users(id)
        ) ENGINE=InnoDB;
    `);

    await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS buildings (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            user_id BIGINT UNSIGNED NOT NULL,
            building_type VARCHAR(32) NOT NULL,
            slot_code VARCHAR(32) NOT NULL,
            level SMALLINT UNSIGNED NOT NULL DEFAULT 1,
            state VARCHAR(16) NOT NULL DEFAULT 'IDLE',
            end_at_ms BIGINT UNSIGNED NOT NULL DEFAULT 0,
            task_id VARCHAR(80) NULL,
            created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
            updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
            UNIQUE KEY uk_buildings_user_slot (user_id, slot_code),
            CONSTRAINT fk_buildings_user FOREIGN KEY (user_id) REFERENCES users(id)
        ) ENGINE=InnoDB;
    `);

    await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS inventory (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            external_id VARCHAR(80) NOT NULL,
            item_code VARCHAR(64) NOT NULL,
            quantity BIGINT UNSIGNED NOT NULL DEFAULT 0,
            metadata_json JSON NULL,
            updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
            UNIQUE KEY uk_inventory_owner_item (external_id, item_code)
        ) ENGINE=InnoDB;
    `);

    await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS receipts (
            receipt_id VARCHAR(64) NOT NULL PRIMARY KEY,
            external_id VARCHAR(80) NOT NULL,
            hero_id VARCHAR(64) NOT NULL,
            pack_id VARCHAR(64) NOT NULL,
            cost_gems INT UNSIGNED NOT NULL,
            issued_at_ms BIGINT UNSIGNED NOT NULL,
            signature VARCHAR(128) NOT NULL,
            used TINYINT(1) NOT NULL DEFAULT 0,
            used_at_ms BIGINT UNSIGNED NULL,
            updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
            KEY idx_receipts_external (external_id)
        ) ENGINE=InnoDB;
    `);

    await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS alliances (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            alliance_uid VARCHAR(80) NOT NULL UNIQUE,
            realm_id INT UNSIGNED NOT NULL DEFAULT 1,
            name VARCHAR(32) NOT NULL,
            tag VARCHAR(8) NOT NULL,
            leader_external_id VARCHAR(80) NOT NULL,
            member_count INT UNSIGNED NOT NULL DEFAULT 1,
            power BIGINT UNSIGNED NOT NULL DEFAULT 0,
            created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ) ENGINE=InnoDB;
    `);

    const [rows] = await mysqlPool.query("SELECT id FROM app_state WHERE id = 1 LIMIT 1");
    if (rows.length === 0) {
        const initialPayload = JSON.stringify(normalizeDbShape(null));
        await mysqlPool.query("INSERT INTO app_state (id, payload) VALUES (1, ?)", [initialPayload]);
    }
}

async function readDbFromMySqlAppState() {
    if (!mysqlPool) return normalizeDbShape(null);
    const [rows] = await mysqlPool.query("SELECT payload FROM app_state WHERE id = 1 LIMIT 1");
    if (!rows.length) return normalizeDbShape(null);

    const parsed = parseJsonField(rows[0].payload, normalizeDbShape(null));
    return normalizeDbShape(parsed);
}

async function writeDbToMySqlAppState(db) {
    if (!mysqlPool) return;
    const payload = JSON.stringify(normalizeDbShape(db));
    await mysqlPool.query(
        `INSERT INTO app_state (id, payload)
         VALUES (1, ?)
         ON DUPLICATE KEY UPDATE payload = VALUES(payload), updated_at = CURRENT_TIMESTAMP(3)`,
        [payload]
    );
}

function buildUserFromRow(row) {
    const meta = parseJsonField(row.profile_json, {});
    const v1Meta = meta?.v1Meta && typeof meta.v1Meta === "object" ? meta.v1Meta : {};
    const gems = safeNumber(meta?.economy?.gems, safeNumber(v1Meta?.resources?.gems, 4210));
    const defaults = buildDefaultV1(gems);
    const profile = meta?.profile && typeof meta.profile === "object" ? meta.profile : inferProfileFromUserId(row.external_id, row.nickname);
    const resourcesInput = v1Meta?.resources && typeof v1Meta.resources === "object" ? v1Meta.resources : {};

    return {
        profile,
        state: meta?.state ?? null,
        economy: { gems },
        inventory: {},
        createdAt: safeNumber(meta?.createdAt, Date.parse(row.created_at) || Date.now()),
        updatedAt: safeNumber(meta?.updatedAt, Date.parse(row.updated_at) || Date.now()),
        v1: {
            stateVersion: safeNumber(v1Meta?.stateVersion, 1),
            level: safeNumber(row.level, defaults.level),
            power: safeNumber(row.power, defaults.power),
            vipLevel: safeNumber(row.vip_level, defaults.vipLevel),
            resources: {
                gold: safeNumber(resourcesInput.gold, defaults.resources.gold),
                wood: safeNumber(resourcesInput.wood, defaults.resources.wood),
                steel: safeNumber(resourcesInput.steel, defaults.resources.steel),
                food: safeNumber(resourcesInput.food, defaults.resources.food),
                gems,
                energy: safeNumber(resourcesInput.energy, defaults.resources.energy),
                energyMax: safeNumber(resourcesInput.energyMax, defaults.resources.energyMax),
                energyRegenPerMinute: safeNumber(resourcesInput.energyRegenPerMinute, defaults.resources.energyRegenPerMinute)
            },
            heroes: [],
            buildings: [],
            alliances: v1Meta?.alliances && typeof v1Meta.alliances === "object" ? v1Meta.alliances : defaults.alliances,
            pass: v1Meta?.pass && typeof v1Meta.pass === "object" ? v1Meta.pass : defaults.pass
        }
    };
}

function buildHeroFromRow(row) {
    const stats = parseJsonField(row.stats_json, { atk: 0, def: 0, units: 0, power: 0 });
    const skillLevels = parseJsonField(row.skill_levels_json, [1, 1, 1]);

    return {
        heroId: row.hero_code,
        rarity: row.rarity || "COMMON",
        level: safeNumber(row.level, 1),
        stars: safeNumber(row.stars, 1),
        ascension: safeNumber(row.ascension, 0),
        stats: {
            atk: safeNumber(stats?.atk, 0),
            def: safeNumber(stats?.def, 0),
            units: safeNumber(stats?.units, 0),
            power: safeNumber(stats?.power, 0)
        },
        shardsOwned: safeNumber(row.shards_owned, 0),
        skillLevels: Array.isArray(skillLevels) ? skillLevels.map((value) => safeNumber(value, 1)) : [1, 1, 1]
    };
}

function buildBuildingFromRow(row) {
    const slotCode = row.slot_code || "slot";
    const buildingType = row.building_type || "unknown";

    return {
        buildingId: `b_${slotCode}`,
        buildingType,
        slotCode,
        level: safeNumber(row.level, 1),
        state: row.state || "IDLE",
        endAtMs: safeNumber(row.end_at_ms, 0),
        taskId: row.task_id || ""
    };
}

function buildReceiptFromRow(row) {
    return {
        receiptId: row.receipt_id,
        userId: row.external_id,
        heroId: row.hero_id,
        packId: row.pack_id,
        costGems: safeNumber(row.cost_gems, 0),
        issuedAt: safeNumber(row.issued_at_ms, Date.now()),
        signature: row.signature || "",
        used: Boolean(safeNumber(row.used, 0)),
        usedAt: row.used_at_ms ? safeNumber(row.used_at_ms, Date.now()) : undefined
    };
}

function quotePlaceholders(size) {
    return new Array(size).fill("?").join(", ");
}

async function readDbFromNormalizedTables() {
    if (!mysqlPool) return null;

    const [userRows] = await mysqlPool.query(
        "SELECT id, external_id, nickname, level, vip_level, power, realm_id, profile_json, created_at, updated_at FROM users"
    );

    if (!userRows.length) return null;

    const db = normalizeDbShape(null);
    const externalBySqlUserId = new Map();

    for (const row of userRows) {
        const externalId = row.external_id;
        db.users[externalId] = buildUserFromRow(row);
        externalBySqlUserId.set(safeNumber(row.id, 0), externalId);
    }

    const [heroRows] = await mysqlPool.query(
        "SELECT user_id, hero_code, rarity, level, stars, ascension, shards_owned, stats_json, skill_levels_json FROM heroes"
    );

    for (const row of heroRows) {
        const externalId = externalBySqlUserId.get(safeNumber(row.user_id, 0));
        if (!externalId || !db.users[externalId]) continue;
        db.users[externalId].v1.heroes.push(buildHeroFromRow(row));
    }

    const [buildingRows] = await mysqlPool.query(
        "SELECT user_id, building_type, slot_code, level, state, end_at_ms, task_id FROM buildings"
    );

    for (const row of buildingRows) {
        const externalId = externalBySqlUserId.get(safeNumber(row.user_id, 0));
        if (!externalId || !db.users[externalId]) continue;
        db.users[externalId].v1.buildings.push(buildBuildingFromRow(row));
    }

    const [inventoryRows] = await mysqlPool.query("SELECT external_id, item_code, quantity FROM inventory");
    for (const row of inventoryRows) {
        const user = db.users[row.external_id];
        if (!user) continue;
        user.inventory[row.item_code] = safeNumber(row.quantity, 0);
    }

    const [allianceRows] = await mysqlPool.query(
        "SELECT alliance_uid, realm_id, name, tag, leader_external_id, member_count, power FROM alliances"
    );

    for (const row of allianceRows) {
        db.alliances[row.alliance_uid] = {
            allianceId: row.alliance_uid,
            realmId: safeNumber(row.realm_id, 1),
            name: row.name,
            tag: row.tag,
            leaderPlayerId: row.leader_external_id,
            memberCount: safeNumber(row.member_count, 1),
            power: safeNumber(row.power, 0)
        };
    }

    const [receiptRows] = await mysqlPool.query(
        "SELECT receipt_id, external_id, hero_id, pack_id, cost_gems, issued_at_ms, signature, used, used_at_ms FROM receipts"
    );
    for (const row of receiptRows) {
        const receipt = buildReceiptFromRow(row);
        db.receipts[receipt.receiptId] = receipt;
    }

    for (const user of Object.values(db.users)) {
        const defaults = buildDefaultV1(user.economy?.gems || 4210);
        if (!Array.isArray(user.v1.heroes) || user.v1.heroes.length === 0) {
            user.v1.heroes = defaults.heroes;
        }
        if (!Array.isArray(user.v1.buildings) || user.v1.buildings.length === 0) {
            user.v1.buildings = defaults.buildings;
        }
        user.v1.resources.gems = user.economy?.gems || 4210;
    }

    return db;
}

async function syncHeroesForUser(connection, sqlUserId, heroes) {
    const byCode = new Map();
    for (const hero of Array.isArray(heroes) ? heroes : []) {
        const heroCode = String(hero?.heroId || "").trim();
        if (!heroCode) continue;
        byCode.set(heroCode, hero);
    }

    const heroCodes = [...byCode.keys()];

    for (const heroCode of heroCodes) {
        const hero = byCode.get(heroCode);
        const statsJson = JSON.stringify(hero?.stats || { atk: 0, def: 0, units: 0, power: 0 });
        const skillLevelsJson = JSON.stringify(Array.isArray(hero?.skillLevels) ? hero.skillLevels : [1, 1, 1]);

        await connection.query(
            `INSERT INTO heroes (user_id, hero_code, rarity, level, stars, ascension, shards_owned, stats_json, skill_levels_json)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                rarity = VALUES(rarity),
                level = VALUES(level),
                stars = VALUES(stars),
                ascension = VALUES(ascension),
                shards_owned = VALUES(shards_owned),
                stats_json = VALUES(stats_json),
                skill_levels_json = VALUES(skill_levels_json),
                updated_at = CURRENT_TIMESTAMP(3)`,
            [
                sqlUserId,
                heroCode,
                String(hero?.rarity || "COMMON"),
                safeNumber(hero?.level, 1),
                safeNumber(hero?.stars, 1),
                safeNumber(hero?.ascension, 0),
                safeNumber(hero?.shardsOwned, 0),
                statsJson,
                skillLevelsJson
            ]
        );
    }

    if (heroCodes.length > 0) {
        const placeholders = quotePlaceholders(heroCodes.length);
        await connection.query(`DELETE FROM heroes WHERE user_id = ? AND hero_code NOT IN (${placeholders})`, [sqlUserId, ...heroCodes]);
    } else {
        await connection.query("DELETE FROM heroes WHERE user_id = ?", [sqlUserId]);
    }
}

async function syncBuildingsForUser(connection, sqlUserId, buildings) {
    const bySlot = new Map();
    for (const building of Array.isArray(buildings) ? buildings : []) {
        const slotCode = String(building?.slotCode || building?.buildingId || "").trim();
        if (!slotCode) continue;
        bySlot.set(slotCode, building);
    }

    const slotCodes = [...bySlot.keys()];

    for (const slotCode of slotCodes) {
        const building = bySlot.get(slotCode);
        await connection.query(
            `INSERT INTO buildings (user_id, building_type, slot_code, level, state, end_at_ms, task_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                building_type = VALUES(building_type),
                level = VALUES(level),
                state = VALUES(state),
                end_at_ms = VALUES(end_at_ms),
                task_id = VALUES(task_id),
                updated_at = CURRENT_TIMESTAMP(3)`,
            [
                sqlUserId,
                String(building?.buildingType || "unknown"),
                slotCode,
                safeNumber(building?.level, 1),
                String(building?.state || "IDLE"),
                safeNumber(building?.endAtMs, 0),
                String(building?.taskId || "")
            ]
        );
    }

    if (slotCodes.length > 0) {
        const placeholders = quotePlaceholders(slotCodes.length);
        await connection.query(`DELETE FROM buildings WHERE user_id = ? AND slot_code NOT IN (${placeholders})`, [sqlUserId, ...slotCodes]);
    } else {
        await connection.query("DELETE FROM buildings WHERE user_id = ?", [sqlUserId]);
    }
}

async function syncInventoryForUser(connection, externalId, inventory) {
    const itemEntries = Object.entries(inventory || {})
        .map(([itemCode, quantity]) => [String(itemCode), safeNumber(quantity, 0)])
        .filter(([itemCode, quantity]) => itemCode && quantity > 0);

    const itemCodes = itemEntries.map(([itemCode]) => itemCode);

    for (const [itemCode, quantity] of itemEntries) {
        await connection.query(
            `INSERT INTO inventory (external_id, item_code, quantity, metadata_json)
             VALUES (?, ?, ?, NULL)
             ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), updated_at = CURRENT_TIMESTAMP(3)`,
            [externalId, itemCode, quantity]
        );
    }

    if (itemCodes.length > 0) {
        const placeholders = quotePlaceholders(itemCodes.length);
        await connection.query(`DELETE FROM inventory WHERE external_id = ? AND item_code NOT IN (${placeholders})`, [externalId, ...itemCodes]);
    } else {
        await connection.query("DELETE FROM inventory WHERE external_id = ?", [externalId]);
    }
}

async function syncAlliances(connection, alliances) {
    const allianceMap = alliances || {};
    const allianceUids = Object.keys(allianceMap);

    for (const allianceUid of allianceUids) {
        const item = allianceMap[allianceUid] || {};
        await connection.query(
            `INSERT INTO alliances (alliance_uid, realm_id, name, tag, leader_external_id, member_count, power)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                realm_id = VALUES(realm_id),
                name = VALUES(name),
                tag = VALUES(tag),
                leader_external_id = VALUES(leader_external_id),
                member_count = VALUES(member_count),
                power = VALUES(power)`,
            [
                String(item.allianceId || allianceUid),
                safeNumber(item.realmId, 1),
                String(item.name || "Alliance"),
                String(item.tag || "TAG").slice(0, 8),
                String(item.leaderPlayerId || "guest:guest"),
                safeNumber(item.memberCount, 1),
                safeNumber(item.power, 0)
            ]
        );
    }

    if (allianceUids.length > 0) {
        const placeholders = quotePlaceholders(allianceUids.length);
        await connection.query(`DELETE FROM alliances WHERE alliance_uid NOT IN (${placeholders})`, allianceUids);
    } else {
        await connection.query("DELETE FROM alliances");
    }
}

async function syncReceipts(connection, receipts) {
    const receiptMap = receipts || {};
    const receiptIds = Object.keys(receiptMap);

    for (const receiptId of receiptIds) {
        const receipt = receiptMap[receiptId] || {};
        await connection.query(
            `INSERT INTO receipts (receipt_id, external_id, hero_id, pack_id, cost_gems, issued_at_ms, signature, used, used_at_ms)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                external_id = VALUES(external_id),
                hero_id = VALUES(hero_id),
                pack_id = VALUES(pack_id),
                cost_gems = VALUES(cost_gems),
                issued_at_ms = VALUES(issued_at_ms),
                signature = VALUES(signature),
                used = VALUES(used),
                used_at_ms = VALUES(used_at_ms),
                updated_at = CURRENT_TIMESTAMP(3)`,
            [
                String(receipt.receiptId || receiptId),
                String(receipt.userId || "guest:guest"),
                String(receipt.heroId || "unknown"),
                String(receipt.packId || "unknown_pack"),
                safeNumber(receipt.costGems, 0),
                safeNumber(receipt.issuedAt, Date.now()),
                String(receipt.signature || ""),
                receipt.used ? 1 : 0,
                receipt.usedAt ? safeNumber(receipt.usedAt, Date.now()) : null
            ]
        );
    }

    if (receiptIds.length > 0) {
        const placeholders = quotePlaceholders(receiptIds.length);
        await connection.query(`DELETE FROM receipts WHERE receipt_id NOT IN (${placeholders})`, receiptIds);
    } else {
        await connection.query("DELETE FROM receipts");
    }
}

async function syncNormalizedTables(db) {
    if (!mysqlPool) return;

    const normalized = normalizeDbShape(db);
    const entries = Object.entries(normalized.users || {});
    const connection = await mysqlPool.getConnection();

    try {
        await connection.beginTransaction();

        for (const [externalId, user] of entries) {
            const fallbackProfile = inferProfileFromUserId(externalId);
            const profile = user?.profile || fallbackProfile;
            const nickname = String(profile.displayName || profile.email || externalId).slice(0, 32);
            const economy = user?.economy || { gems: safeNumber(user?.v1?.resources?.gems, 4210) };
            const defaults = buildDefaultV1(safeNumber(economy.gems, 4210));
            const resources = user?.v1?.resources || defaults.resources;

            const profileJson = JSON.stringify({
                profile: {
                    provider: profile.provider || fallbackProfile.provider,
                    providerUid: profile.providerUid || fallbackProfile.providerUid,
                    email: profile.email || "",
                    displayName: profile.displayName || nickname
                },
                state: user?.state ?? null,
                economy: { gems: safeNumber(economy.gems, resources.gems || 4210) },
                v1Meta: {
                    stateVersion: safeNumber(user?.v1?.stateVersion, 1),
                    resources: {
                        gold: safeNumber(resources.gold, defaults.resources.gold),
                        wood: safeNumber(resources.wood, defaults.resources.wood),
                        steel: safeNumber(resources.steel, defaults.resources.steel),
                        food: safeNumber(resources.food, defaults.resources.food),
                        gems: safeNumber(resources.gems, defaults.resources.gems),
                        energy: safeNumber(resources.energy, defaults.resources.energy),
                        energyMax: safeNumber(resources.energyMax, defaults.resources.energyMax),
                        energyRegenPerMinute: safeNumber(resources.energyRegenPerMinute, defaults.resources.energyRegenPerMinute)
                    },
                    alliances: user?.v1?.alliances || { allianceId: "", name: "", tag: "" },
                    pass: user?.v1?.pass || { seasonId: "season_1", claimed: {} }
                },
                createdAt: safeNumber(user?.createdAt, Date.now()),
                updatedAt: safeNumber(user?.updatedAt, Date.now())
            });

            await connection.query(
                `INSERT INTO users (external_id, nickname, level, vip_level, power, realm_id, profile_json)
                 VALUES (?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                    nickname = VALUES(nickname),
                    level = VALUES(level),
                    vip_level = VALUES(vip_level),
                    power = VALUES(power),
                    realm_id = VALUES(realm_id),
                    profile_json = VALUES(profile_json),
                    updated_at = CURRENT_TIMESTAMP(3)`,
                [
                    externalId,
                    nickname,
                    safeNumber(user?.v1?.level, defaults.level),
                    safeNumber(user?.v1?.vipLevel, defaults.vipLevel),
                    safeNumber(user?.v1?.power, defaults.power),
                    1,
                    profileJson
                ]
            );
        }

        const externalIds = entries.map(([externalId]) => externalId);
        const sqlIdByExternal = new Map();

        if (externalIds.length > 0) {
            const placeholders = quotePlaceholders(externalIds.length);
            const [rows] = await connection.query(
                `SELECT id, external_id FROM users WHERE external_id IN (${placeholders})`,
                externalIds
            );

            for (const row of rows) {
                sqlIdByExternal.set(row.external_id, safeNumber(row.id, 0));
            }
        }

        for (const [externalId, user] of entries) {
            const sqlUserId = sqlIdByExternal.get(externalId);
            if (!sqlUserId) continue;

            await syncHeroesForUser(connection, sqlUserId, user?.v1?.heroes || []);
            await syncBuildingsForUser(connection, sqlUserId, user?.v1?.buildings || []);
            await syncInventoryForUser(connection, externalId, user?.inventory || {});
        }

        await syncAlliances(connection, normalized.alliances || {});
        await syncReceipts(connection, normalized.receipts || {});
        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

async function migrateAppStateToNormalizedIfNeeded() {
    if (!mysqlPool) return;

    const [rows] = await mysqlPool.query("SELECT COUNT(*) AS total FROM users");
    const totalUsers = safeNumber(rows?.[0]?.total, 0);
    if (totalUsers > 0) return;

    const appStateDb = await readDbFromMySqlAppState();
    const userCount = Object.keys(appStateDb.users || {}).length;
    const allianceCount = Object.keys(appStateDb.alliances || {}).length;
    if (userCount === 0 && allianceCount === 0) return;

    await syncNormalizedTables(appStateDb);
    console.log(`[repo] Migracao inicial app_state -> tabelas normalizadas (users=${userCount}, alliances=${allianceCount}).`);
}

async function migrateReceiptsFromAppStateIfNeeded() {
    if (!mysqlPool) return;

    const [rows] = await mysqlPool.query("SELECT COUNT(*) AS total FROM receipts");
    const totalReceipts = safeNumber(rows?.[0]?.total, 0);
    if (totalReceipts > 0) return;

    const appStateDb = await readDbFromMySqlAppState();
    const receiptCount = Object.keys(appStateDb.receipts || {}).length;
    if (receiptCount === 0) return;

    const connection = await mysqlPool.getConnection();
    try {
        await connection.beginTransaction();
        await syncReceipts(connection, appStateDb.receipts || {});
        await connection.commit();
        console.log(`[repo] Migracao inicial de receipts do app_state (receipts=${receiptCount}).`);
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

export async function initializeRepository(env) {
    mode = "json";
    mysqlPool = null;

    if (env.DATA_DRIVER !== "mysql") return;

    try {
        mysqlPool = mysql.createPool({
            host: env.MYSQL_HOST,
            port: env.MYSQL_PORT,
            user: env.MYSQL_USER,
            password: env.MYSQL_PASSWORD,
            database: env.MYSQL_DATABASE,
            waitForConnections: true,
            connectionLimit: 8,
            queueLimit: 0
        });

        await ensureSqlSchema();
        await migrateAppStateToNormalizedIfNeeded();
        await migrateReceiptsFromAppStateIfNeeded();

        mode = "mysql";
        console.log("[repo] DATA_DRIVER=mysql ativo.");
    } catch (error) {
        mode = "json";
        mysqlPool = null;
        console.warn(`[repo] Falha ao conectar MySQL (${error.message}). Fallback para JSON local.`);
    }
}

export function getRepositoryMode() {
    return mode;
}

export async function readDb() {
    if (mode !== "mysql" || !mysqlPool) {
        return readDbFromFile();
    }

    try {
        const fromNormalized = await readDbFromNormalizedTables();
        if (fromNormalized) {
            const fromAppState = await readDbFromMySqlAppState();
            if (Object.keys(fromNormalized.receipts || {}).length === 0) {
                fromNormalized.receipts = fromAppState.receipts || {};
            }
            if (Object.keys(fromNormalized.alliances || {}).length === 0) {
                fromNormalized.alliances = fromAppState.alliances || {};
            }
            return normalizeDbShape(fromNormalized);
        }

        return await readDbFromMySqlAppState();
    } catch (error) {
        console.warn(`[repo] Erro ao ler MySQL (${error.message}). Usando JSON local.`);
        mode = "json";
        return readDbFromFile();
    }
}

export async function writeDb(db) {
    const normalized = normalizeDbShape(db);

    if (mode !== "mysql" || !mysqlPool) {
        writeDbToFile(normalized);
        return;
    }

    try {
        await syncNormalizedTables(normalized);
        await writeDbToMySqlAppState(normalized);
    } catch (error) {
        console.warn(`[repo] Erro ao gravar MySQL (${error.message}). Gravando em JSON local.`);
        mode = "json";
        writeDbToFile(normalized);
    }
}
