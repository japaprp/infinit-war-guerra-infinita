const CHIP_CATALOG = Object.freeze({
    "assault-module": { name: "Módulo de Assalto", role: "Guerreiro", stat: "attackPct", statLabel: "Dano de combate", basePct: 32.6, upgradeCopies: 5, maxLevel: 10, rarity: "Épico" },
    "gravity-barrier": { name: "Barreira Gravitacional", role: "Guerreiro", stat: "hpPct", statLabel: "Vida e proteção", basePct: 6.8, upgradeCopies: 3, maxLevel: 10, rarity: "Épico" },
    "recon-array": { name: "Matriz de Reconhecimento", role: "Batedor", stat: "attackPct", statLabel: "Dano de combate", basePct: 12, upgradeCopies: 4, maxLevel: 10, rarity: "Raro" },
    "supply-core": { name: "Núcleo de Suprimentos", role: "Suporte", stat: "hpPct", statLabel: "Vida e proteção", basePct: 10, upgradeCopies: 4, maxLevel: 10, rarity: "Raro" }
});
const SLOT_IDS = Object.freeze(["assault", "vanguard", "suppression", "gravity"]);
const PRESET_IDS = Object.freeze(["I", "II", "III", "IV"]);

function fail(status, message) {
    return { error: { status, message } };
}

export function ensureVehicleLoadout(user) {
    user.v1 ||= {};
    user.v1.vehicle ||= {
        chips: [],
        activePreset: "I",
        presets: Object.fromEntries(PRESET_IDS.map(id => [id, Object.fromEntries(SLOT_IDS.map(slot => [slot, null]))]))
    };
    const vehicle = user.v1.vehicle;
    if (!Array.isArray(vehicle.chips)) vehicle.chips = [];
    if (!PRESET_IDS.includes(vehicle.activePreset)) vehicle.activePreset = "I";
    vehicle.presets ||= {};
    for (const presetId of PRESET_IDS) {
        const slots = vehicle.presets[presetId] ||= {};
        for (const slotId of SLOT_IDS) {
            const chipId = slots[slotId];
            if (!vehicle.chips.some(chip => chip.id === chipId)) slots[slotId] = null;
        }
        for (const slotId of Object.keys(slots)) if (!SLOT_IDS.includes(slotId)) delete slots[slotId];
    }
    const ids = new Set();
    vehicle.chips = vehicle.chips.filter(chip =>
        chip && typeof chip.id === "string" && chip.id.length > 0 && !ids.has(chip.id) &&
        Object.hasOwn(CHIP_CATALOG, chip.typeId) && Number.isInteger(chip.level) &&
        chip.level >= 1 && chip.level <= CHIP_CATALOG[chip.typeId].maxLevel && ids.add(chip.id)
    ).slice(0, 200);
    const owned = new Set(vehicle.chips.map(chip => chip.id));
    for (const presetId of PRESET_IDS) {
        const used = new Set();
        for (const slotId of SLOT_IDS) {
            const chipId = vehicle.presets[presetId][slotId];
            if (!owned.has(chipId) || used.has(chipId)) vehicle.presets[presetId][slotId] = null;
            else if (chipId) used.add(chipId);
        }
    }
    return vehicle;
}

function publicChip(chip) {
    const definition = CHIP_CATALOG[chip.typeId];
    return { ...chip, name: definition.name, role: definition.role, rarity: definition.rarity, stat: definition.stat, statLabel: definition.statLabel, basePct: definition.basePct, upgradeCopies: definition.upgradeCopies, maxLevel: definition.maxLevel, bonusPct: Number((definition.basePct + (chip.level - 1) * 9.6).toFixed(2)) };
}

export function getVehicleLoadout(user) {
    const vehicle = ensureVehicleLoadout(user);
    return {
        inventory: vehicle.chips.map(publicChip),
        activePreset: vehicle.activePreset,
        presets: structuredClone(vehicle.presets),
        slots: SLOT_IDS,
        presetIds: PRESET_IDS
    };
}

export function setActiveVehiclePreset(user, presetId) {
    const vehicle = ensureVehicleLoadout(user);
    if (!PRESET_IDS.includes(presetId)) return fail(400, "Unknown vehicle preset");
    vehicle.activePreset = presetId;
    user.v1.stateVersion = (user.v1.stateVersion || 0) + 1;
    return getVehicleLoadout(user);
}

export function equipVehicleChip(user, { chipId, slotId, presetId } = {}) {
    const vehicle = ensureVehicleLoadout(user);
    if (!PRESET_IDS.includes(presetId)) return fail(400, "Unknown vehicle preset");
    if (!SLOT_IDS.includes(slotId)) return fail(400, "Unknown vehicle chip slot");
    const chip = vehicle.chips.find(item => item.id === chipId);
    if (!chip) return fail(404, "Chip is not owned by this player");
    const slots = vehicle.presets[presetId];
    for (const slot of SLOT_IDS) if (slots[slot] === chipId) slots[slot] = null;
    slots[slotId] = chipId;
    user.v1.stateVersion = (user.v1.stateVersion || 0) + 1;
    return getVehicleLoadout(user);
}

export function removeVehicleChip(user, { slotId, presetId } = {}) {
    const vehicle = ensureVehicleLoadout(user);
    if (!PRESET_IDS.includes(presetId)) return fail(400, "Unknown vehicle preset");
    if (!SLOT_IDS.includes(slotId)) return fail(400, "Unknown vehicle chip slot");
    vehicle.presets[presetId][slotId] = null;
    user.v1.stateVersion = (user.v1.stateVersion || 0) + 1;
    return getVehicleLoadout(user);
}

export function upgradeVehicleChip(user, chipId) {
    const vehicle = ensureVehicleLoadout(user);
    const chip = vehicle.chips.find(item => item.id === chipId);
    if (!chip) return fail(404, "Chip is not owned by this player");
    const definition = CHIP_CATALOG[chip.typeId];
    if (chip.level >= definition.maxLevel) return fail(409, "Chip is already at max level");
    const equipped = new Set(PRESET_IDS.flatMap(presetId => SLOT_IDS.map(slot => vehicle.presets[presetId][slot]).filter(Boolean)));
    const copies = vehicle.chips.filter(item => item.typeId === chip.typeId && item.id !== chip.id && !equipped.has(item.id));
    if (copies.length < definition.upgradeCopies) {
        return fail(409, `Upgrade requires ${definition.upgradeCopies} un-equipped duplicate chips`);
    }
    const consumed = new Set(copies.slice(0, definition.upgradeCopies).map(item => item.id));
    vehicle.chips = vehicle.chips.filter(item => !consumed.has(item.id));
    chip.level += 1;
    user.v1.stateVersion = (user.v1.stateVersion || 0) + 1;
    return getVehicleLoadout(user);
}

export function getActiveVehicleBonuses(user) {
    const vehicle = ensureVehicleLoadout(user);
    const bonuses = { attackPct: 0, hpPct: 0 };
    const slots = vehicle.presets[vehicle.activePreset];
    for (const chipId of Object.values(slots)) {
        const chip = vehicle.chips.find(item => item.id === chipId);
        if (!chip) continue;
        const definition = CHIP_CATALOG[chip.typeId];
        bonuses[definition.stat] += definition.basePct + (chip.level - 1) * 9.6;
    }
    return bonuses;
}

export const VEHICLE_CHIP_CATALOG = CHIP_CATALOG;
