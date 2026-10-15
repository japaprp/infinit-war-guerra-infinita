import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const gamePath = resolve(root, "engine/game.js");
const manifestPath = resolve(root, "assets/manifest.json");
const manifestText = readFileSync(manifestPath, "utf8").replace(/^\\uFEFF/, "");
const manifest = JSON.parse(manifestText);
const game = readFileSync(gamePath, "utf8");

const heroId = "luis";
const portraitPath = manifest.characters?.hero_recruit;
assert.equal(portraitPath, "assets/characters/hero_recruit.png", "manifest must register the recruit portrait");

const absolutePortraitPath = resolve(root, portraitPath);
assert.ok(existsSync(absolutePortraitPath), `portrait file is missing: ${portraitPath}`);
const png = readFileSync(absolutePortraitPath);
assert.ok(png.length > 8, "portrait file must not be empty");
assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], "portrait must be a PNG file");

assert.match(
  game,
  new RegExp('id: "' + heroId + '",\\s*unlockOrder: 8,\\s*tier: "gold",\\s*name: "Luís"'),
  "Luis must be registered as the eighth gold-tier hero"
);
assert.ok(game.includes('portrait: "assets/characters/hero_recruit.png"'), "Luis must point to the registered portrait");
assert.ok(game.includes('class="hero-detail-portrait"'), "hero detail must render portrait image");
assert.ok(game.includes('class="hero-card-portrait"'), "hero roster must render portrait image");
assert.ok(game.includes('class="hero-mini-portrait"'), "squad slots must render portrait image");

for (const existingHeroId of ["lucas", "kai", "megan", "cyrus", "quinn", "corleone", "ivy"]) {
  assert.ok(game.includes(`id: "${existingHeroId}"`), `existing hero ${existingHeroId} must be preserved`);
}

console.log("Recruitable hero asset checks passed: manifest, PNG file, Luis config, portrait render hooks, existing heroes.");
