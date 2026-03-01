export function getUserId(provider, providerUid) {
    return `${provider}:${providerUid}`;
}

export function ensureUser(db, userId, profile) {
    if (!db.users[userId]) {
        db.users[userId] = {
            profile,
            state: null,
            economy: { gems: 4210 },
            inventory: {},
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
    }

    db.users[userId].profile = {
        ...db.users[userId].profile,
        ...profile
    };
    db.users[userId].updatedAt = Date.now();
    return db.users[userId];
}

export function validateLegacyStateShape(state) {
    if (!state || typeof state !== "object") return false;
    if (!state.resources || typeof state.resources !== "object") return false;

    const keys = ["gold", "silver", "wood", "food", "gems"];
    return keys.every((k) => Number.isFinite(state.resources[k]));
}

export function ensureV1State(user) {
    if (!user.v1) {
        user.v1 = {
            stateVersion: 1,
            level: 1,
            power: 12840,
            vipLevel: 0,
            resources: {
                gold: 80000,
                wood: 60000,
                steel: 50000,
                food: 55000,
                gems: user.economy?.gems || 4210,
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

    // Keep gems authoritative in one source.
    if (!user.economy) user.economy = { gems: 4210 };
    user.v1.resources.gems = user.economy.gems;
}

export function getEnergySnapshot(user) {
    const regenPerMinute = user.v1.resources.energyRegenPerMinute || 1.2;
    return {
        current: user.v1.resources.energy,
        max: user.v1.resources.energyMax,
        regenPerMinute
    };
}

export function toPlayerProfile(userId, user, realmId = 1) {
    ensureV1State(user);
    return {
        playerId: userId,
        nickname: user.profile?.displayName || user.profile?.email || userId,
        level: user.v1.level,
        power: user.v1.power,
        vipLevel: user.v1.vipLevel,
        realmId,
        energy: getEnergySnapshot(user),
        resources: {
            gold: user.v1.resources.gold,
            wood: user.v1.resources.wood,
            steel: user.v1.resources.steel,
            food: user.v1.resources.food,
            gems: user.v1.resources.gems
        }
    };
}
