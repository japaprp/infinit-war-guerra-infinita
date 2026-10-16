/* Original Guerra Infinita vehicle-chip loadout domain helpers.
 * Presets are alternate saved configurations. A chip may appear in multiple presets,
 * but never in two slots within the same preset. Active-preset ownership is enforced
 * by the game UI/state layer. No Dark War: Survival resonance formula is assumed.
 */
(function exposeChipLoadouts(root, factory) {
    const api = factory();
    if (typeof module === "object" && module.exports) module.exports = api;
    if (root) root.IWChipLoadouts = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createChipLoadoutApi() {
    const PRESETS = Object.freeze(["I", "II", "III", "IV"]);
    const SLOTS = Object.freeze([
        { id: "assault", label: "Assalto" },
        { id: "vanguard", label: "Vanguarda" },
        { id: "suppression", label: "Supressão" },
        { id: "gravity", label: "Gravidade" }
    ]);

    function createDefaultLoadouts() {
        return Object.fromEntries(PRESETS.map((preset) => [
            preset,
            Object.fromEntries(SLOTS.map((slot) => [slot.id, null]))
        ]));
    }

    function normalizeLoadouts(input, validChipIds) {
        const validIds = validChipIds instanceof Set ? validChipIds : new Set(validChipIds || []);
        const defaults = createDefaultLoadouts();
        const result = createDefaultLoadouts();
        const source = input && typeof input === "object" ? input : {};
        for (const preset of PRESETS) {
            const sourceSlots = source[preset] && typeof source[preset] === "object" ? source[preset] : {};
            const seen = new Set();
            for (const slot of SLOTS) {
                const chipId = sourceSlots[slot.id];
                if (typeof chipId !== "string" || !validIds.has(chipId) || seen.has(chipId)) {
                    result[preset][slot.id] = defaults[preset][slot.id];
                    continue;
                }
                result[preset][slot.id] = chipId;
                seen.add(chipId);
            }
        }
        return result;
    }

    function assignChip(loadouts, preset, slotId, chipId, validChipIds) {
        if (!PRESETS.includes(preset)) return { ok: false, reason: "invalid-preset", loadouts };
        if (!SLOTS.some((slot) => slot.id === slotId)) return { ok: false, reason: "invalid-slot", loadouts };
        const validIds = validChipIds instanceof Set ? validChipIds : new Set(validChipIds || []);
        if (typeof chipId !== "string" || !validIds.has(chipId)) return { ok: false, reason: "missing-chip", loadouts };
        const normalized = normalizeLoadouts(loadouts, validIds);
        if (Object.entries(normalized[preset]).some(([otherSlot, otherId]) => otherSlot !== slotId && otherId === chipId)) {
            return { ok: false, reason: "duplicate-in-preset", loadouts: normalized };
        }
        normalized[preset][slotId] = chipId;
        return { ok: true, reason: null, loadouts: normalized };
    }

    function clearSlot(loadouts, preset, slotId, validChipIds) {
        if (!PRESETS.includes(preset)) return { ok: false, reason: "invalid-preset", loadouts };
        if (!SLOTS.some((slot) => slot.id === slotId)) return { ok: false, reason: "invalid-slot", loadouts };
        const normalized = normalizeLoadouts(loadouts, validChipIds);
        normalized[preset][slotId] = null;
        return { ok: true, reason: null, loadouts: normalized };
    }

    function isChipInPreset(loadouts, preset, chipId) {
        if (!PRESETS.includes(preset) || !chipId) return false;
        const slots = loadouts && loadouts[preset];
        return !!slots && Object.values(slots).includes(chipId);
    }

    function filledSlotCount(loadouts, preset) {
        if (!PRESETS.includes(preset) || !loadouts || !loadouts[preset]) return 0;
        return SLOTS.filter((slot) => !!loadouts[preset][slot.id]).length;
    }

    return Object.freeze({ PRESETS, SLOTS, createDefaultLoadouts, normalizeLoadouts, assignChip, clearSlot, isChipInPreset, filledSlotCount });
});
