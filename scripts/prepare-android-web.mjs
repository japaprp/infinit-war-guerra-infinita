import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const webDir = resolve(root, "www");
const files = ["index.html", "game.html", "main.js", "style.css", "sytle.css"];
const directories = ["api", "auth", "assets", "engine", "entities", "scenes", "systems"];

rmSync(webDir, { recursive: true, force: true });
mkdirSync(webDir, { recursive: true });

for (const file of files) {
  const source = resolve(root, file);
  if (existsSync(source)) cpSync(source, resolve(webDir, file), { recursive: true });
}

const guestBootstrapSource = resolve(root, "scripts/guest-bootstrap.js");
if (!existsSync(guestBootstrapSource)) {
  throw new Error("Android guest bootstrap script is missing.");
}
cpSync(guestBootstrapSource, resolve(webDir, "guest-bootstrap.js"));

for (const directory of directories) {
  const source = resolve(root, directory);
  if (existsSync(source)) cpSync(source, resolve(webDir, directory), { recursive: true });
}

if (!existsSync(resolve(webDir, "index.html")) || !existsSync(resolve(webDir, "game.html"))) {
  throw new Error("Android web bundle is incomplete: index.html or game.html is missing.");
}

// Keep the original entry screen in the Android package. The player can start
// as a local guest from index.html; main.js creates the local session and then
// opens game.html. Do not replace the menu with the gameplay HTML here.

const heroPortrait = resolve(webDir, "assets/characters/hero_recruit.png");
if (!existsSync(heroPortrait)) {
  throw new Error("Android web bundle is missing assets/characters/hero_recruit.png.");
}

console.log("Android web bundle prepared: base-builder scene is the entry point and local guest mode is enabled.");
