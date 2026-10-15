import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, "assets", "original-art-manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

test("original art manifest has unique, safe paths and usable dimensions", () => {
    assert.equal(manifest.version, 1);
    assert.ok(Array.isArray(manifest.assets) && manifest.assets.length >= 1);

    const ids = new Set();
    const paths = new Set();
    for (const asset of manifest.assets) {
        assert.ok(asset.id && typeof asset.id === "string", "every asset needs an id");
        assert.ok(!ids.has(asset.id), `duplicate asset id: ${asset.id}`);
        ids.add(asset.id);

        assert.ok(asset.path && typeof asset.path === "string", `${asset.id} needs a path`);
        assert.ok(path.posix.isAbsolute(asset.path) === false, `${asset.id} path must be relative`);
        assert.ok(!asset.path.split("/").includes(".."), `${asset.id} path cannot traverse parent directories`);
        assert.ok(asset.path.startsWith("assets/art/"), `${asset.id} must live under assets/art/`);
        assert.ok(!paths.has(asset.path), `duplicate asset path: ${asset.path}`);
        paths.add(asset.path);

        assert.ok(Number.isInteger(asset.minWidth) && asset.minWidth > 0, `${asset.id} needs a positive minWidth`);
        assert.ok(Number.isInteger(asset.minHeight) && asset.minHeight > 0, `${asset.id} needs a positive minHeight`);
        assert.equal(typeof asset.required, "boolean", `${asset.id} needs an explicit required flag`);
    }

    for (const expected of [
        "assets/art/heroes/hero_recruit.png",
        "assets/art/enemies/enemy_mutant_scavenger.png",
        "assets/art/equipment/equipment_scrap_blade.png",
        "assets/art/chests/chest_supply_common.png",
        "assets/art/maps/map_wasteland_expedition.png"
    ]) {
        assert.ok(paths.has(expected), `missing expected original asset path: ${expected}`);
    }
});

test("art validator accepts the preparation state and reports malformed present files", () => {
    const result = spawnSync(process.execPath, ["scripts/validate-art-assets.mjs"], {
        cwd: root,
        encoding: "utf8"
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.match(result.stdout, /Recursos verificados:/);
    assert.match(result.stdout, /PENDENTE|Pacote de arte validado/);
});
