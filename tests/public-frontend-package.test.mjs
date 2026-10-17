import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(root, "frontend", "public");
const allowlist = [
  "index.html",
  "game.html",
  "style.css",
  "main.js",
  "api/client.js",
  "api/config.js",
  "auth/auth.js",
  "auth/firebase-config.js",
  "engine/game.js",
  "engine/ui.js",
  "entities/player.js"
];

test("public frontend contains only the explicit browser-file allowlist", () => {
  assert.ok(fs.existsSync(publicRoot), "frontend/public must exist");
  const actual = [];
  const visit = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else actual.push(path.relative(publicRoot, absolute).split(path.sep).join("/"));
    }
  };
  visit(publicRoot);
  actual.sort();
  assert.deepEqual(actual, [...allowlist].sort(), "public files must match the reviewed allowlist exactly");
});

test("public frontend files match the source files and local HTML dependencies resolve", () => {
  for (const relative of allowlist) {
    const source = fs.readFileSync(path.join(root, relative));
    const published = fs.readFileSync(path.join(publicRoot, relative));
    assert.deepEqual(published, source, `staged file differs from source: ${relative}`);
  }

  for (const page of ["index.html", "game.html"]) {
    const html = fs.readFileSync(path.join(publicRoot, page), "utf8");
    const references = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((match) => match[1]);
    for (const reference of references) {
      if (/^(?:https?:|data:|#)/i.test(reference)) continue;
      const pathname = reference.split(/[?#]/, 1)[0];
      assert.ok(fs.existsSync(path.join(publicRoot, pathname)), `${page} references missing public file: ${reference}`);
    }
  }
});

test("public menu contains every statically referenced authentication control", () => {
  const indexHtml = fs.readFileSync(path.join(publicRoot, "index.html"), "utf8");
  for (const relative of ["auth/auth.js", "main.js"]) {
    const source = fs.readFileSync(path.join(publicRoot, relative), "utf8");
    const ids = new Set([...source.matchAll(/getElementById\(["']([^"']+)["']\)/g)].map((match) => match[1]));
    for (const id of ids) {
      assert.match(indexHtml, new RegExp(`id=["']${id}["']`), `index.html is missing ${id}, referenced by ${relative}`);
    }
  }
});

test("public package excludes server, tooling, tests, and private project documentation", () => {
  const forbidden = ["backend", "tests", "docs", "scripts", "electron", ".github", "package.json", "render.yaml", "DEPLOYMENT_PREPARATION.md"];
  for (const item of forbidden) {
    assert.ok(!fs.existsSync(path.join(publicRoot, item)), `private/server path must not be published: ${item}`);
  }
});
