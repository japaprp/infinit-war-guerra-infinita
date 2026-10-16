/* Original Guerra Infinita vehicle preset combat bonuses.
 * Only the active preset contributes. Bonus values reuse the prototype's chip
 * progression formula; they are not copied from Dark War: Survival.
 */
(function exposeVehicleChipCombat(root, factory) {
    const api = factory();
    if (typeof module === "object" && module.exports) module.exports = api;
    if (root) root.IWVehicleChipCombat = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createVehicleChipCombatApi() {
    function calculatePresetBonuses(loadouts, activePreset, ownedChips, catalog) {
        const result = { attackPct: 0, hpPct: 0, appliedChipIds: [] };
        const slots = loadouts && loadouts[activePreset];
        if (!slots || typeof slots !== "object") return result;

        const inventory = Array.isArray(ownedChips) ? ownedChips : [];
        const definitions = Array.isArray(catalog) ? catalog : [];
        const seen = new Set();

        for (const chipId of Object.values(slots)) {
            if (typeof chipId !== "string" || seen.has(chipId)) continue;
            seen.add(chipId);
            const chip = inventory.find((item) => item && item.id === chipId);
            if (!chip) continue;
            const definition = definitions.find((item) => item && item.id === chip.typeId);
            if (!definition || !["attackPct", "hpPct"].includes(definition.stat)) continue;

            const level = Number.isFinite(chip.level) ? Math.max(1, Math.floor(chip.level)) : 1;
            const bonus = Math.max(0, Number(definition.basePct) || 0) + (level - 1) * 9.6;
            result[definition.stat] += bonus;
            result.appliedChipIds.push(chipId);
        }
        return result;
    }

    return Object.freeze({ calculatePresetBonuses });
});
