import assert from "node:assert/strict";
import { test } from "node:test";
import accessories from "../engine/vehicle-accessories.js";

const { SLOTS, createDefaultState, craftAccessory, equipAccessory, upgradeAccessory, getUpgradeCost, normalizeState, calculateBonuses } = accessories;
const rich = () => ({ gold: 100000, silver: 100000, wood: 100000, food: 0, energy: 100, gems: 0 });

test("new players start with empty accessory inventory and six empty slots", () => {
    const state = createDefaultState();
    assert.deepEqual(state.inventory, []);
    assert.equal(Object.keys(state.slots).length, 6);
    assert.ok(Object.values(state.slots).every((value) => value === null));
});

test("crafting is transactional and deducts the exact configured cost once", () => {
    const resources = rich();
    const result = craftAccessory(createDefaultState(), resources, "propulsor", "acc-1");
    assert.equal(result.ok, true);
    assert.deepEqual(result.cost, { gold: 300, silver: 200, wood: 100 });
    assert.equal(result.resources.gold, resources.gold - 300);
    assert.equal(result.resources.silver, resources.silver - 200);
    assert.equal(result.resources.wood, resources.wood - 100);
    assert.equal(resources.gold, 100000, "input balance must not be mutated");
    assert.equal(result.accessory.level, 1);
});

test("failed crafting leaves inventory and balances unchanged", () => {
    const resources = { gold: 299, silver: 999, wood: 999 };
    const state = createDefaultState();
    const result = craftAccessory(state, resources, "propulsor", "acc-1");
    assert.equal(result.ok, false);
    assert.equal(result.reason, "insufficient-resources");
    assert.deepEqual(result.state, state);
    assert.deepEqual(result.resources, resources);
});

test("only matching accessory types can be equipped, and an item has one slot", () => {
    const crafted = craftAccessory(createDefaultState(), rich(), "propulsor", "acc-1");
    const wrong = equipAccessory(crafted.state, "acc-1", "reactive-plates");
    assert.equal(wrong.reason, "wrong-slot");
    const right = equipAccessory(crafted.state, "acc-1", "propulsor");
    assert.equal(right.ok, true);
    assert.equal(right.state.slots.propulsor, "acc-1");
    assert.equal(right.state.slots["reactive-plates"], null);
});

test("upgrade cost scales, raises only the chosen entity level, and spends atomically", () => {
    const crafted = craftAccessory(createDefaultState(), rich(), "propulsor", "acc-1");
    const cost = getUpgradeCost(crafted.accessory);
    const upgraded = upgradeAccessory(crafted.state, crafted.resources, "acc-1");
    assert.equal(upgraded.ok, true);
    assert.equal(upgraded.accessory.level, 2);
    assert.deepEqual(upgraded.cost, cost);
    assert.equal(upgraded.resources.gold, crafted.resources.gold - cost.gold);
    assert.equal(upgraded.state.inventory.length, 1);
    assert.equal(upgraded.state.inventory[0].level, 2);
});

test("insufficient resources or a missing entity cannot partially upgrade", () => {
    const crafted = craftAccessory(createDefaultState(), rich(), "propulsor", "acc-1");
    const broke = { gold: 100000, silver: 0, wood: 100000 };
    const result = upgradeAccessory(crafted.state, broke, "acc-1");
    assert.equal(result.ok, false);
    assert.equal(result.reason, "insufficient-resources");
    assert.equal(result.state.inventory[0].level, 1);
    assert.deepEqual(result.resources, broke);
    const missing = upgradeAccessory(crafted.state, rich(), "missing");
    assert.equal(missing.reason, "missing-accessory");
});

test("maximum level cannot be exceeded and invalid saved references are discarded", () => {
    const maxed = normalizeState({
        inventory: [{ id: "max", typeId: "propulsor", level: 10 }, { id: "bad", typeId: "not-real", level: 1 }],
        slots: { propulsor: "max", "reactive-plates": "max", "tactical-sensor": "bad" }
    });
    assert.equal(maxed.inventory.length, 1);
    assert.equal(maxed.slots.propulsor, "max");
    assert.equal(maxed.slots["reactive-plates"], null);
    const result = upgradeAccessory(maxed, rich(), "max");
    assert.equal(result.ok, false);
    assert.equal(result.reason, "max-level");
});

test("equipped accessory bonuses are derived only from valid equipped entities", () => {
    let state = createDefaultState();
    const first = craftAccessory(state, rich(), "propulsor", "acc-1");
    state = equipAccessory(first.state, "acc-1", "propulsor").state;
    const bonuses = calculateBonuses(state);
    assert.equal(bonuses.attackPct, 1.5);
    assert.equal(bonuses.hpPct, 0);
});
