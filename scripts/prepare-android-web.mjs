import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
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

console.log("Android web bundle prepared in www/.");
