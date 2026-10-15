import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const SOURCE_URL = new URL("../engine/game.js", import.meta.url);

function readArrayBlock(source, constantName) {
    const start = source.indexOf(`const ${constantName} = [`);
    assert.notEqual(start, -1, `Could not find ${constantName}`);
    const end = source.indexOf("];", start);
    assert.notEqual(end, -1, `Could not find end of ${constantName}`);
    return source.slice(start, end + 2);
}

test("module chest odds are valid, transparent and sum to 100%", async () => {
    const source = await readFile(SOURCE_URL, "utf8");
    const block = readArrayBlock(source, "MODULE_CHEST_ODDS");
    const entries = [...block.matchAll(/\{\s*id:\s*"([^"]+)"[^}]*?chance:\s*([0-9.]+)/gs)]
        .map((match) => ({ id: match[1], chance: Number(match[2]) }));

    assert.ok(entries.length >= 6, "module chest should expose all configured tiers");
    assert.ok(entries.every(({ chance }) => Number.isFinite(chance) && chance >= 0 && chance <= 100));
    assert.equal(new Set(entries.map(({ id }) => id)).size, entries.length, "odds IDs must be unique");
    assert.ok(Math.abs(entries.reduce((sum, { chance }) => sum + chance, 0) - 100) < 1e-9,
        "module chest odds must sum to 100%");
    assert.equal(entries.find(({ id }) => id === "legendary")?.chance, 0.2,
        "the observed orange-tier probability should remain 0.2%");
    assert.equal(entries.filter(({ id }) => id.startsWith("blue-")).reduce((sum, { chance }) => sum + chance, 0), 30,
        "the four blue rewards should total 30%");
});

test("original prototype module catalog is structurally valid without claiming reference-game fidelity", async () => {
    const source = await readFile(SOURCE_URL, "utf8");
    const block = readArrayBlock(source, "CHIP_CATALOG");
    const entries = [...block.matchAll(/\{\s*id:\s*"([^"]+)"[^}]*?name:\s*"([^"]+)"[^}]*?role:\s*"([^"]+)"[^}]*?stat:\s*"([^"]+)"[^}]*?basePct:\s*([0-9.]+)[^}]*?upgradeCopies:\s*(\d+)/gs)]
        .map((match) => ({
            id: match[1],
            name: match[2],
            role: match[3],
            stat: match[4],
            basePct: Number(match[5]),
            upgradeCopies: Number(match[6])
        }));

    assert.equal(entries.length, 4, "the initial original module catalog should contain four modules");
    assert.equal(new Set(entries.map(({ id }) => id)).size, entries.length, "module IDs must be unique");
    assert.ok(entries.every((entry) => entry.name && entry.role && ["attackPct", "hpPct"].includes(entry.stat)));
    assert.ok(entries.every(({ basePct, upgradeCopies }) => basePct > 0 && upgradeCopies > 0));
    assert.equal(source.match(/const CHIP_MAX_LEVEL = (\d+);/)?.[1], "10");

    // These are Guerra Infinita prototype values. The screenshots provide two visible
    // before/after anchors, but do not establish a complete level formula or all level costs.
    assert.ok(entries.some(({ id }) => id === "assault-module"), "original assault module must exist");
    assert.ok(entries.some(({ id }) => id === "gravity-barrier"), "original gravity barrier must exist");
    assert.ok(source.includes("Prototype chest odds are original design values"),
        "prototype odds must remain explicitly separated from reference-game facts");
});
