/* Original accessory entities and transactional vehicle upgrades for Guerra Infinita.
 * Costs and stats are prototype tuning values, not copied from Dark War: Survival.
 */
(function exposeVehicleAccessories(root, factory) {
    const api = factory();
    if (typeof module === "object" && module.exports) module.exports = api;
    if (root) root.IWVehicleAccessories = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createVehicleAccessoriesApi() {
    const MAX_LEVEL = 10;
    const CRAFT_COST = Object.freeze({ gold: 300, silver: 200, wood: 100 });
    const SLOTS = Object.freeze([
        { id: "propulsor", label: "Propulsor", typeId: "propulsor", description: "Mobilidade e ritmo de ataque", stat: "attackPct", baseBonus: 1.5 },
        { id: "reactive-plates", label: "Placas Reativas", typeId: "reactive-plates", description: "Proteção estrutural", stat: "defensePct", baseBonus: 1.5 },
        { id: "tactical-sensor", label: "Sensor Tático", typeId: "tactical-sensor", description: "Leitura de pontos vulneráveis", stat: "precisionPct", baseBonus: 1 },
        { id: "reinforced-treads", label: "Esteiras Reforçadas", typeId: "reinforced-treads", description: "Estabilidade e resistência", stat: "hpPct", baseBonus: 2 },
        { id: "power-core", label: "Núcleo de Potência", typeId: "power-core", description: "Distribuição de energia", stat: "attackPct", baseBonus: 2 },
        { id: "siege-module", label: "Módulo de Cerco", typeId: "siege-module", description: "Eficiência contra estruturas", stat: "siegeDamagePct", baseBonus: 2 }
    ]);
    const SLOT_BY_ID = new Map(SLOTS.map((slot) => [slot.id, slot]));
    const COST_KEYS = Object.freeze(["gold", "silver", "wood"]);

    function createDefaultState() {
        return { inventory: [], slots: Object.fromEntries(SLOTS.map((slot) => [slot.id, null])) };
    }

    function normalizeState(value) {
        const normalized = createDefaultState();
        if (!value || typeof value !== "object") return normalized;
        const seen = new Set();
        if (Array.isArray(value.inventory)) {
            normalized.inventory = value.inventory.filter((item) =>
                item && typeof item.id === "string" && item.id.length > 0 &&
                SLOT_BY_ID.has(item.typeId) && Number.isInteger(item.level) &&
                item.level >= 1 && item.level <= MAX_LEVEL && !seen.has(item.id) &&
                seen.add(item.id)
            ).slice(0, 200);
        }
        const owned = new Set(normalized.inventory.map((item) => item.id));
        const equipped = new Set();
        for (const slot of SLOTS) {
            const id = value.slots && value.slots[slot.id];
            const item = normalized.inventory.find((entry) => entry.id === id);
            if (item && item.typeId === slot.typeId && !equipped.has(id)) {
                normalized.slots[slot.id] = id;
                equipped.add(id);
            }
        }
        return normalized;
    }

    function getCraftCost() {
        return { ...CRAFT_COST };
    }

    function getUpgradeCost(accessory) {
        if (!accessory || !Number.isInteger(accessory.level) || accessory.level < 1 || accessory.level >= MAX_LEVEL) return null;
        const scale = 1.45 ** (accessory.level - 1);
        return { gold: Math.ceil(120 * scale), silver: Math.ceil(80 * scale), wood: Math.ceil(40 * scale) };
    }

    function hasResources(resources, cost) {
        return COST_KEYS.every((key) => Number.isFinite(resources?.[key]) && resources[key] >= cost[key]);
    }

    function deductResources(resources, cost) {
        const next = { ...resources };
        for (const key of COST_KEYS) next[key] -= cost[key];
        return next;
    }

    function craftAccessory(state, resources, typeId, id) {
        const current = normalizeState(state);
        if (!SLOTS.some((slot) => slot.typeId === typeId)) return { ok: false, reason: "invalid-type", state: current, resources: { ...resources } };
        if (current.inventory.length >= 200) return { ok: false, reason: "inventory-full", state: current, resources: { ...resources } };
        if (typeof id !== "string" || !id || current.inventory.some((item) => item.id === id)) return { ok: false, reason: "invalid-id", state: current, resources: { ...resources } };
        const cost = getCraftCost();
        if (!hasResources(resources, cost)) return { ok: false, reason: "insufficient-resources", state: current, resources: { ...resources }, cost };
        const accessory = { id, typeId, level: 1 };
        return { ok: true, state: { ...current, inventory: [...current.inventory, accessory] }, resources: deductResources(resources, cost), accessory, cost };
    }

    function equipAccessory(state, accessoryId, slotId) {
        const current = normalizeState(state);
        const slot = SLOT_BY_ID.get(slotId);
        const accessory = current.inventory.find((item) => item.id === accessoryId);
        if (!slot) return { ok: false, reason: "invalid-slot", state: current };
        if (!accessory) return { ok: false, reason: "missing-accessory", state: current };
        if (accessory.typeId !== slot.typeId) return { ok: false, reason: "wrong-slot", state: current };
        const slots = { ...current.slots };
        for (const key of Object.keys(slots)) if (slots[key] === accessoryId) slots[key] = null;
        slots[slotId] = accessoryId;
        return { ok: true, state: { ...current, slots } };
    }

    function upgradeAccessory(state, resources, accessoryId) {
        const current = normalizeState(state);
        const accessory = current.inventory.find((item) => item.id === accessoryId);
        if (!accessory) return { ok: false, reason: "missing-accessory", state: current, resources: { ...resources } };
        const cost = getUpgradeCost(accessory);
        if (!cost) return { ok: false, reason: "max-level", state: current, resources: { ...resources } };
        if (!hasResources(resources, cost)) return { ok: false, reason: "insufficient-resources", state: current, resources: { ...resources }, cost };
        const nextInventory = current.inventory.map((item) => item.id === accessoryId ? { ...item, level: item.level + 1 } : item);
        return {
            ok: true,
            state: { ...current, inventory: nextInventory },
            resources: deductResources(resources, cost),
            accessory: nextInventory.find((item) => item.id === accessoryId),
            cost
        };
    }

    function calculateBonuses(state) {
        const current = normalizeState(state);
        const result = { attackPct: 0, defensePct: 0, precisionPct: 0, hpPct: 0, siegeDamagePct: 0 };
        for (const slot of SLOTS) {
            const id = current.slots[slot.id];
            const accessory = current.inventory.find((item) => item.id === id);
            if (!accessory) continue;
            result[slot.stat] += slot.baseBonus + (accessory.level - 1) * 0.75;
        }
        return result;
    }

    return Object.freeze({ MAX_LEVEL, CRAFT_COST, SLOTS, createDefaultState, normalizeState, getCraftCost, getUpgradeCost, craftAccessory, equipAccessory, upgradeAccessory, calculateBonuses });
});
