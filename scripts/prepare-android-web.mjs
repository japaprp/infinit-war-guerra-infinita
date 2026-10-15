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

for (const directory of directories) {
  const source = resolve(root, directory);
  if (existsSync(source)) cpSync(source, resolve(webDir, directory), { recursive: true });
}

if (!existsSync(resolve(webDir, "index.html")) || !existsSync(resolve(webDir, "game.html"))) {
  throw new Error("Android web bundle is incomplete: index.html or game.html is missing.");
}

// The Android APK should open the base-builder gameplay, not the legacy
// element-selection/arena login screen. Keep the browser entry page untouched;
// only the generated Android web bundle gets this guest-mode bootstrap.
const gameHtmlPath = resolve(webDir, "game.html");
let gameHtml = readFileSync(gameHtmlPath, "utf8");
const scriptAnchor = '<script src="entities/player.js"></script>';
if (!gameHtml.includes(scriptAnchor)) {
  throw new Error("Cannot prepare Android base-builder entry: entities/player.js script anchor is missing.");
}
gameHtml = gameHtml.replace(scriptAnchor, '<script src="guest-bootstrap.js"></script>\n' + scriptAnchor);
writeFileSync(resolve(webDir, "index.html"), gameHtml, "utf8");

const heroPortrait = resolve(webDir, "assets/characters/hero_recruit.png");
if (!existsSync(heroPortrait)) {
  throw new Error("Android web bundle is missing assets/characters/hero_recruit.png.");
}

console.log("Android web bundle prepared: base-builder scene is the entry point and local guest mode is enabled.");
