import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, "assets", "original-art-manifest.json");
const strict = process.argv.includes("--strict");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const errors = [];
const missing = [];
const present = [];

function inspectPng(filePath) {
  const bytes = fs.readFileSync(filePath);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (bytes.length < 33 || !bytes.subarray(0, 8).equals(signature)) {
    throw new Error("arquivo não é um PNG válido");
  }
  if (bytes.toString("ascii", 12, 16) !== "IHDR") {
    throw new Error("cabeçalho IHDR ausente");
  }
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    colorType: bytes[25],
    hasAlphaChannel: bytes[25] === 4 || bytes[25] === 6,
    hasTransparencyChunk: bytes.includes(Buffer.from("tRNS"))
  };
}

for (const asset of manifest.assets) {
  const filePath = path.resolve(root, asset.path);
  if (!filePath.startsWith(root + path.sep)) {
    errors.push(`${asset.id}: caminho fora do repositório`);
    continue;
  }
  if (!fs.existsSync(filePath)) {
    if (asset.required) missing.push(asset.path);
    continue;
  }
  try {
    const image = inspectPng(filePath);
    if (image.width < asset.minWidth || image.height < asset.minHeight) {
      errors.push(`${asset.id}: ${image.width}x${image.height}; mínimo ${asset.minWidth}x${asset.minHeight}`);
    }
    if (asset.alphaRecommended && !image.hasAlphaChannel && !image.hasTransparencyChunk) {
      console.warn(`AVISO ${asset.id}: PNG sem canal de transparência aparente; confira o fundo visualmente.`);
    }
    present.push(`${asset.id}: ${image.width}x${image.height}`);
  } catch (error) {
    errors.push(`${asset.id}: ${error.message}`);
  }
}

console.log(`Recursos verificados: ${present.length}/${manifest.assets.length}`);
for (const item of present) console.log(`OK ${item}`);
for (const item of missing) console.log(`PENDENTE ${item}`);
for (const item of errors) console.error(`ERRO ${item}`);

if (errors.length || (strict && missing.length)) process.exitCode = 1;
else if (missing.length) console.log("Modo de preparação: faltam recursos; use --strict para exigir o pacote completo.");
else console.log("Pacote de arte validado.");
