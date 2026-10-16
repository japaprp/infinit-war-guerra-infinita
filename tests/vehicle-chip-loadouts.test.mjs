import test from "node:test";
import assert from "node:assert/strict";
import {
    PRESETS,
    SLOTS,
    createDefaultLoadouts,
    normalizeLoadouts,
    assignChip,
    clearSlot,
    isChipInPreset,
    filledSlotCount
} from "../engine/chip-loadouts.js";

const chipIds = new Set(["chip-a", "chip-b", "chip-c", "chip-d"]);

test("creates four empty presets with four distinct slots each", () => {
    const loadouts = createDefaultLoadouts();
    assert.deepEqual(PRESETS, ["I", "II", "III", "IV"]);
    assert.equal(Object.keys(loadouts).length, 4);
    for (const preset of PRESETS) {
        assert.deepEqual(Object.keys(loadouts[preset]), SLOTS.map((slot) => slot.id));
        assert.equal(filledSlotCount(loadouts, preset), 0);
    }
});

test("assigns a valid chip and counts filled slots", () => {
    const result = assignChip(createDefaultLoadouts(), "I", "assault", "chip-a", chipIds);
    assert.equal(result.ok, true);
    assert.equal(result.loadouts.I.assault, "chip-a");
    assert.equal(filledSlotCount(result.loadouts, "I"), 1);
    assert.equal(isChipInPreset(result.loadouts, "I", "chip-a"), true);
});

test("rejects assigning the same physical chip to two slots in one preset", () => {
    const first = assignChip(createDefaultLoadouts(), "I", "assault", "chip-a", chipIds);
    const second = assignChip(first.loadouts, "I", "gravity", "chip-a", chipIds);
    assert.equal(second.ok, false);
    assert.equal(second.reason, "duplicate-in-preset");
    assert.equal(second.loadouts.I.assault, "chip-a");
    assert.equal(second.loadouts.I.gravity, null);
});

test("allows a saved chip to appear in an alternate preset", () => {
    const first = assignChip(createDefaultLoadouts(), "I", "assault", "chip-a", chipIds);
    const second = assignChip(first.loadouts, "II", "gravity", "chip-a", chipIds);
    assert.equal(second.ok, true);
    assert.equal(second.loadouts.I.assault, "chip-a");
    assert.equal(second.loadouts.II.gravity, "chip-a");
});

test("rejects missing chips, invalid presets, and invalid slots", () => {
    const defaults = createDefaultLoadouts();
    assert.equal(assignChip(defaults, "V", "assault", "chip-a", chipIds).reason, "invalid-preset");
    assert.equal(assignChip(defaults, "I", "unknown", "chip-a", chipIds).reason, "invalid-slot");
    assert.equal(assignChip(defaults, "I", "assault", "missing", chipIds).reason, "missing-chip");
});

test("normalizes stale IDs and duplicate slot references from saved data", () => {
    const normalized = normalizeLoadouts({
        I: { assault: "chip-a", vanguard: "chip-a", suppression: "old-chip", gravity: "chip-b" },
        II: { assault: "chip-c" }
    }, chipIds);
    assert.equal(normalized.I.assault, "chip-a");
    assert.equal(normalized.I.vanguard, null);
    assert.equal(normalized.I.suppression, null);
    assert.equal(normalized.I.gravity, "chip-b");
    assert.equal(normalized.II.assault, "chip-c");
    assert.equal(normalized.III.assault, null);
});

test("clears a slot without changing other slots", () => {
    const first = assignChip(createDefaultLoadouts(), "I", "assault", "chip-a", chipIds);
    const second = assignChip(first.loadouts, "I", "gravity", "chip-b", chipIds);
    const cleared = clearSlot(second.loadouts, "I", "assault", chipIds);
    assert.equal(cleared.ok, true);
    assert.equal(cleared.loadouts.I.assault, null);
    assert.equal(cleared.loadouts.I.gravity, "chip-b");
    assert.equal(filledSlotCount(cleared.loadouts, "I"), 1);
});
