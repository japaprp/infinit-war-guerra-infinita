import test from "node:test";
import assert from "node:assert/strict";
import vehicleChipCombat from "../engine/vehicle-chip-combat.js";

const catalog = [
    { id: "assault-module", stat: "attackPct", basePct: 32.6, levelStepPct: 9.6 },
    { id: "gravity-barrier", stat: "hpPct", basePct: 6.8, levelStepPct: 9.6 },
    { id: "unknown", stat: "unsupported", basePct: 99, levelStepPct: 9.6 }
];
const chips = [
    { id: "chip-a", typeId: "assault-module", level: 1 },
    { id: "chip-b", typeId: "gravity-barrier", level: 3 },
    { id: "chip-c", typeId: "unknown", level: 1 }
];

test("only active preset bonuses are calculated", () => {
    const loadouts = {
        I: { assault: "chip-a", vanguard: "chip-b" },
        II: { assault: "chip-c" }
    };
    assert.deepEqual(
        vehicleChipCombat.calculatePresetBonuses(loadouts, "I", chips, catalog),
        { attackPct: 32.6, hpPct: 26, appliedChipIds: ["chip-a", "chip-b"] }
    );
    assert.deepEqual(
        vehicleChipCombat.calculatePresetBonuses(loadouts, "II", chips, catalog),
        { attackPct: 0, hpPct: 0, appliedChipIds: [] }
    );
});

test("same chip saved in alternate presets contributes only when that preset is active", () => {
    const loadouts = {
        I: { assault: "chip-a" },
        II: { gravity: "chip-a" }
    };
    assert.equal(vehicleChipCombat.calculatePresetBonuses(loadouts, "I", chips, catalog).attackPct, 32.6);
    assert.equal(vehicleChipCombat.calculatePresetBonuses(loadouts, "II", chips, catalog).attackPct, 32.6);
});

test("duplicate references in malformed saves never double-count the same physical chip", () => {
    const result = vehicleChipCombat.calculatePresetBonuses(
        { I: { assault: "chip-a", vanguard: "chip-a" } }, "I", chips, catalog
    );
    assert.equal(result.attackPct, 32.6);
    assert.deepEqual(result.appliedChipIds, ["chip-a"]);
});

test("missing inventory items and unsupported stats are ignored safely", () => {
    const result = vehicleChipCombat.calculatePresetBonuses(
        { I: { assault: "deleted-chip", vanguard: "chip-c" } }, "I", chips, catalog
    );
    assert.deepEqual(result, { attackPct: 0, hpPct: 0, appliedChipIds: [] });
});

test("unknown preset or empty loadout returns zero bonuses", () => {
    assert.deepEqual(
        vehicleChipCombat.calculatePresetBonuses({}, "IV", chips, catalog),
        { attackPct: 0, hpPct: 0, appliedChipIds: [] }
    );
});

test("chip level progression follows the configured per-chip step", () => {
    const result = vehicleChipCombat.calculatePresetBonuses(
        { I: { assault: "chip-b" } }, "I", chips, catalog
    );
    assert.equal(result.hpPct, 26);
});

test("changing catalog levelStepPct changes combat progression without code changes", () => {
    const customCatalog = [{ id: "custom-chip", stat: "attackPct", basePct: 5, levelStepPct: 2.25 }];
    const customChips = [{ id: "custom-instance", typeId: "custom-chip", level: 4 }];
    const result = vehicleChipCombat.calculatePresetBonuses(
        { I: { assault: "custom-instance" } }, "I", customChips, customCatalog
    );
    assert.equal(result.attackPct, 11.75);
});

test("missing levelStepPct never silently assumes a reference-game formula", () => {
    const customCatalog = [{ id: "custom-chip", stat: "attackPct", basePct: 5 }];
    const customChips = [{ id: "custom-instance", typeId: "custom-chip", level: 4 }];
    const result = vehicleChipCombat.calculatePresetBonuses(
        { I: { assault: "custom-instance" } }, "I", customChips, customCatalog
    );
    assert.equal(result.attackPct, 5);
});
