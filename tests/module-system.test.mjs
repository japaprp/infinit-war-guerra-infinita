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
    assert.ok(source.includes("function isChipEquipped(chipId)"),
        "equipped modules need a shared guard before duplicate consumption");
    assert.ok(source.includes("item.id !== chip.id && !isChipEquipped(item.id)"),
        "evolution must not consume copies equipped on another hero");
    assert.ok(source.includes("A physical module may only be equipped by one hero at a time."),
        "one physical module cannot grant bonuses to multiple heroes simultaneously");
    assert.ok(source.includes("const seenEquippedChipIds = new Set();"),
        "save loading must discard duplicate equipped references");
    assert.ok(source.includes("definition?.stat !== stat || seenEquippedChipIds.has(chipId)"),
        "save loading must reject missing, mismatched, or duplicate module references");
});

test("new accounts start with clean progression instead of copied endgame data", async () => {
    const source = await readFile(SOURCE_URL, "utf8");
    const heroFactoryStart = source.indexOf("function createHeroState(template) {");
    const defaultStateStart = source.indexOf("function createDefaultState() {");
    const loadStateStart = source.indexOf("function loadState() {");
    assert.ok(heroFactoryStart >= 0 && defaultStateStart > heroFactoryStart && loadStateStart > defaultStateStart,
        "fresh account factories must remain explicit and independently auditable");

    const heroFactory = source.slice(heroFactoryStart, defaultStateStart);
    const defaultState = source.slice(defaultStateStart, loadStateStart);
    assert.match(heroFactory, /level:\s*1/, "new heroes must start at level one");
    assert.match(heroFactory, /stars:\s*1/, "new heroes must start at the base star level");
    assert.match(heroFactory, /specificShards:\s*0/, "new heroes must not inherit shards");
    assert.match(heroFactory, /weapon:\s*0,\s*armor:\s*0,\s*boots:\s*0/,
        "new heroes must not inherit upgraded equipment");
    assert.match(heroFactory, /attackPct:\s*null,\s*hpPct:\s*null/,
        "new heroes must not inherit equipped modules");
    assert.match(defaultState, /equipment:\s*\[\],\s*chests:\s*\[\],\s*chips:\s*\[\],\s*chipMaterials:\s*0/,
        "new accounts must have empty equipment, chest and module inventories");
    assert.match(defaultState, /genericShards:\s*\{\s*bronze:\s*0,\s*silver:\s*0,\s*gold:\s*0\s*\}/,
        "new accounts must start with zero generic shards");
    assert.match(defaultState, /totalPuzzles:\s*0/,
        "hero-unlock progress must start at zero");
    assert.match(defaultState, /hq:\s*\{\s*level:\s*1\s*\}/,
        "the headquarters must start at its base level");
    assert.match(defaultState, /constructionStarted:\s*false/,
        "tutorial progression must not be pre-completed");
    assert.match(defaultState, /completedCount:\s*0/,
        "new accounts must have no completed expeditions");
    assert.match(defaultState, /energy:\s*100/,
        "starting energy is an explicit prototype allowance, not inherited account progress");
});

test("fresh account unlocks heroes progressively and starts with a single-hero squad", async () => {
    const source = await readFile(SOURCE_URL, "utf8");
    const templateStart = source.indexOf("const heroTemplates = [");
    const templateEnd = source.indexOf("];", templateStart);
    const templates = source.slice(templateStart, templateEnd + 2);
    const unlockOrders = [...templates.matchAll(/id:\s*"([^"]+)"\s*,\s*unlockOrder:\s*(\d+)/g)]
        .map((match) => ({ id: match[1], order: Number(match[2]) }));
    assert.ok(unlockOrders.length >= 2, "hero templates must declare a progressive unlock order");
    assert.equal(new Set(unlockOrders.map((hero) => hero.order)).size, unlockOrders.length,
        "hero unlock order must not contain duplicates");
    assert.equal(Math.min(...unlockOrders.map((hero) => hero.order)), 1);
    assert.ok(unlockOrders.filter((hero) => hero.order > 1).length > 0,
        "new players should have heroes left to unlock");

    const factoryStart = source.indexOf("function createHeroState(template) {");
    const defaultStart = source.indexOf("function createDefaultState() {");
    const loadStart = source.indexOf("function loadState() {");
    const heroFactory = source.slice(factoryStart, defaultStart);
    const defaultState = source.slice(defaultStart, loadStart);
    assert.match(heroFactory, /unlocked:\s*template\.unlockOrder\s*<=\s*INITIAL_UNLOCKED/,
        "fresh hero unlock state must be derived from the initial unlock threshold");
    assert.match(defaultState, /squad:\s*\[\s*"lucas",\s*null,\s*null,\s*null,\s*null\s*\]/,
        "a fresh squad must not contain a full endgame formation");
    assert.match(defaultState, /selectedHeroId:\s*"lucas"/,
        "the initial selected hero must be available to a fresh account");
    assert.match(source, /if\s*\(!heroState\s*\|\|\s*!heroState\.unlocked\)\s*return;/,
        "locked heroes must not be assignable to the squad");
});
