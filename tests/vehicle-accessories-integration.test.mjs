import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("vehicle accessory entities are loaded before game bootstrap and normalized into persisted state", async () => {
    const html = await readFile(new URL("../game.html", import.meta.url), "utf8");
    const game = await readFile(new URL("../engine/game.js", import.meta.url), "utf8");
    assert.ok(html.indexOf('src="engine/vehicle-accessories.js"') < html.indexOf('src="engine/game.js"'));
    assert.match(game, /vehicleAccessories:\s*window\.IWVehicleAccessories\.createDefaultState\(\)/);
    assert.match(game, /merged\.vehicleAccessories\s*=\s*window\.IWVehicleAccessories\.normalizeState\(/);
    assert.match(game, /payload\.vehicleAccessories|\.\.\.state/);
    assert.match(game, /window\.IWVehicleAccessories\.calculateBonuses\(state\.vehicleAccessories\)/);
    assert.match(game, /function upgradeVehicleAccessory\(accessoryId\)/);
    assert.match(game, /function renderVehicleAccessoriesPanel\(\)/);
});

test("new account progression remains level 1 and accessory system has no active core synchrony", async () => {
    const game = await readFile(new URL("../engine/game.js", import.meta.url), "utf8");
    const module = await readFile(new URL("../engine/vehicle-accessories.js", import.meta.url), "utf8");
    assert.match(game, /level:\s*1/);
    assert.match(module, /function createDefaultState\(\)\s*\{\s*return \{ inventory: \[\], slots:/);
    assert.doesNotMatch(module, /coreSynchrony|sincroniaDeNucleo/i);
});
