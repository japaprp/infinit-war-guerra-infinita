import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const gameUrl = new URL("../engine/game.js", import.meta.url);
const htmlUrl = new URL("../game.html", import.meta.url);

test("active vehicle preset is saved, validated on load, and used by hero stat calculation", async () => {
    const source = await readFile(gameUrl, "utf8");
    const html = await readFile(htmlUrl, "utf8");
    assert.match(source, /vehicleChipLoadouts:\s*window\.IWChipLoadouts\.createDefaultLoadouts\(\)/,
        "new accounts must start with four empty vehicle presets");
    assert.match(source, /activeVehicleChipPreset:\s*"I"/,
        "new accounts must start with preset I active");
    assert.match(source, /merged\.vehicleChipLoadouts\s*=\s*window\.IWChipLoadouts\.normalizeLoadouts\(/,
        "loaded presets must be normalized against owned chip IDs");
    assert.match(source, /merged\.activeVehicleChipPreset\s*=\s*window\.IWChipLoadouts\.PRESETS\.includes\(parsed\.activeVehicleChipPreset\)/,
        "invalid saved active presets must fall back safely");
    assert.match(source, /function saveState\(\)\s*\{\s*const payload = \{\s*\.\.\.state/s,
        "saveState must persist active preset and loadouts as part of game state");
    assert.match(source, /window\.IWVehicleChipCombat\.calculatePresetBonuses\(\s*state\.vehicleChipLoadouts,\s*state\.activeVehicleChipPreset/s,
        "hero combat stats must use only the active vehicle preset");
    assert.match(source, /const atk = Math\.floor\([\s\S]*?chipPct\("attackPct"\)/,
        "vehicle attack bonuses must feed the ATK calculation");
    assert.match(source, /const troops = Math\.floor\([\s\S]*?chipPct\("hpPct"\)/,
        "vehicle health bonuses must feed the unit/health calculation");
    assert.ok(html.indexOf('src="engine/vehicle-chip-combat.js"') < html.indexOf('src="engine/game.js"'),
        "the combat helper must load before the game engine");
});

test("vehicle chip evolution cannot consume any chip saved in a preset", async () => {
    const source = await readFile(gameUrl, "utf8");
    const start = source.indexOf("function upgradeChip(chipId) {");
    const end = source.indexOf("\nfunction ", start + 10);
    assert.ok(start >= 0 && end > start, "upgradeChip function must exist");
    const upgrade = source.slice(start, end);
    assert.match(upgrade, /!isChipEquipped\(item\.id\)/,
        "evolution must exclude chips equipped by heroes or reserved in vehicle presets");
    assert.match(source, /function isChipEquipped\(chipId\)/,
        "a shared ownership guard must check all equipment locations");
    assert.match(source, /savedInVehiclePreset = window\.IWChipLoadouts\.PRESETS\.some/,
        "the ownership guard must include every saved vehicle preset");
});
