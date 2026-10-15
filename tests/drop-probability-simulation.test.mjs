import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import testRunner from "node:test";

const SOURCE_URL = new URL("../engine/game.js", import.meta.url);
const TRIALS = 1_000_000;
const SEED = 0x1f1a17;

function seededRandom(seed) {
    let value = seed >>> 0;
    return () => {
        value += 0x6D2B79F5;
        let t = value;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function readWeightedTable(source, constantName) {
    const start = source.indexOf(`const ${constantName} = [`);
    assert.notEqual(start, -1, `Could not find ${constantName} in engine/game.js`);
    const end = source.indexOf("];", start);
    assert.notEqual(end, -1, `Could not find end of ${constantName}`);
    const block = source.slice(start, end + 2);
    const entries = [...block.matchAll(/\{\s*id:\s*"([^"]+)"[^}]*?weight:\s*([0-9.]+)/gs)]
        .map((match) => ({ id: match[1], weight: Number(match[2]) }));
    assert.ok(entries.length >= 2, `Could not parse weighted entries for ${constantName}`);
    assert.ok(entries.every((entry) => Number.isFinite(entry.weight) && entry.weight >= 0),
        `${constantName} contains an invalid weight`);
    return entries;
}

function pick(table, random) {
    const roll = random();
    let cumulative = 0;
    for (const entry of table) {
        cumulative += entry.weight;
        if (roll < cumulative) return entry.id;
    }
    return table[table.length - 1].id;
}

function assertWithinSamplingNoise(label, observed, sampleSize, expected) {
    const standardError = Math.sqrt(expected * (1 - expected) / sampleSize);
    const tolerance = 6 * standardError + 2 / sampleSize;
    assert.ok(
        Math.abs(observed / sampleSize - expected) <= tolerance,
        `${label}: observed ${(observed / sampleSize * 100).toFixed(3)}%, expected ${(expected * 100).toFixed(3)}%, tolerance ±${(tolerance * 100).toFixed(3)} percentage points`
    );
}

testRunner("drop tables are normalized and the Monte Carlo calibration matches configured probabilities", async (t) => {
    const source = await readFile(SOURCE_URL, "utf8");
    const chestTable = readWeightedTable(source, "CHEST_REWARD_TABLE");
    const rarityTable = readWeightedTable(source, "EQUIPMENT_RARITIES");
    const equipmentChanceMatch = source.match(/const EQUIPMENT_DROP_CHANCE = ([0-9.]+);/);
    const chestChanceMatch = source.match(/const CHEST_DROP_CHANCE = ([0-9.]+);/);

    assert.ok(equipmentChanceMatch, "Could not find EQUIPMENT_DROP_CHANCE");
    assert.ok(chestChanceMatch, "Could not find CHEST_DROP_CHANCE");

    const equipmentChance = Number(equipmentChanceMatch[1]);
    const chestChance = Number(chestChanceMatch[1]);
    assert.ok(equipmentChance >= 0 && equipmentChance <= 1);
    assert.ok(chestChance >= 0 && chestChance <= 1);
    assert.ok(Math.abs(chestTable.reduce((sum, item) => sum + item.weight, 0) - 1) < 1e-9,
        "Chest reward weights must sum to 1");
    assert.ok(Math.abs(rarityTable.reduce((sum, item) => sum + item.weight, 0) - 1) < 1e-9,
        "Equipment rarity weights must sum to 1");

    const random = seededRandom(SEED);
    const equipmentCount = { total: 0 };
    const rarityCounts = Object.fromEntries(rarityTable.map((entry) => [entry.id, 0]));
    const chestContents = Object.fromEntries(chestTable.map((entry) => [entry.id, 0]));
    let chestCount = 0;
    let equipmentFromChest = 0;

    for (let i = 0; i < TRIALS; i += 1) {
        if (random() < equipmentChance) {
            equipmentCount.total += 1;
            rarityCounts[pick(rarityTable, random)] += 1;
        }
        if (random() < chestChance) {
            chestCount += 1;
            const contents = pick(chestTable, random);
            chestContents[contents] += 1;
            if (contents === "equipment") equipmentFromChest += 1;
        }
    }

    assertWithinSamplingNoise("Equipment drop per monster", equipmentCount.total, TRIALS, equipmentChance);
    assertWithinSamplingNoise("Chest drop per monster", chestCount, TRIALS, chestChance);
    for (const entry of rarityTable) {
        assertWithinSamplingNoise(`Rarity ${entry.id} among dropped equipment`,
            rarityCounts[entry.id], equipmentCount.total, entry.weight);
    }
    for (const entry of chestTable) {
        assertWithinSamplingNoise(`Chest content ${entry.id}`,
            chestContents[entry.id], chestCount, entry.weight);
    }
    assertWithinSamplingNoise("Equipment reward from chests per monster",
        equipmentFromChest, TRIALS, chestChance * chestTable.find((entry) => entry.id === "equipment").weight);

    t.diagnostic(`Seed: ${SEED}; trials: ${TRIALS.toLocaleString("en-US")}`);
    t.diagnostic(`Equipment drops: ${equipmentCount.total} (${(equipmentCount.total / TRIALS * 100).toFixed(3)}%; configured ${(equipmentChance * 100).toFixed(2)}%)`);
    t.diagnostic(`Chest drops: ${chestCount} (${(chestCount / TRIALS * 100).toFixed(3)}%; configured ${(chestChance * 100).toFixed(2)}%)`);
    t.diagnostic(`Chest contents: ${Object.entries(chestContents).map(([id, count]) => `${id} ${(count / chestCount * 100).toFixed(2)}%`).join(", ")}`);
    t.diagnostic(`Equipment rarity: ${Object.entries(rarityCounts).map(([id, count]) => `${id} ${(count / equipmentCount.total * 100).toFixed(2)}%`).join(", ")}`);
});
