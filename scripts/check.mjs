import { readFile, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";

const sourceRoot = new URL("../", import.meta.url).pathname;
const root = process.argv[2] ? resolve(process.argv[2]) : sourceRoot;
const siteMode = process.argv.includes("--site");
const required = [
  "index.html", "assets/styles.css", "src/app.js", "src/serial.js", "src/companion.js", "src/flasher.js",
  "catalog/firmware.json", "vendor/meshcore-flasher/dfu.js",
  "vendor/meshcore-flasher/zip.min.js", "vendor/meshcore-flasher/NOTICE.md",
  "vendor/meshcore/meshcore.js", "vendor/meshcore/NOTICE.md", "vendor/meshcore/LICENSE",
  "firmware/FLASH_ERASE_nrf52_softdevice_v6.zip"
];
if (!siteMode) required.push("scripts/serve.mjs", "firmware/RAK4631-BLE-Sensor-v0.3.1.zip", "firmware/RAK4631-BLE-Sensor-v0.3.1.uf2");
await Promise.all(required.map((file) => access(join(root, file))));

const html = await readFile(join(root, "index.html"), "utf8");
for (const marker of ["id=\"firmware\"", "id=\"connect\"", "id=\"configure\"", "id=\"console\""]) {
  if (!html.includes(marker)) throw new Error(`Missing ${marker} in index.html`);
}

const catalog = JSON.parse(await readFile(join(root, "catalog/firmware.json"), "utf8"));
if (catalog.schemaVersion !== 1) throw new Error("Unknown catalog version");
if (!Array.isArray(catalog.packages) || catalog.packages.length === 0) throw new Error("The firmware catalog is empty");
for (const item of catalog.packages) {
  for (const field of ["profile", "board", "version", "environment", "assets"]) {
    if (!item[field]) throw new Error(`Firmware package is missing ${field}`);
  }
  for (const assetName of ["uf2", "dfu"]) {
    const asset = item.assets[assetName];
    if (!asset?.url || !/^[0-9a-f]{64}$/.test(asset.sha256 || "")) throw new Error(`${assetName} is missing a URL or SHA-256`);
    if (!asset.url.startsWith("firmware/")) throw new Error(`${assetName} must be a local, publishable portal asset`);
    const assetHash = createHash("sha256").update(await readFile(join(root, asset.url))).digest("hex");
    if (assetHash !== asset.sha256) throw new Error(`${assetName} SHA-256 does not match the catalog`);
  }
  const erase = item.assets.erase;
  if (erase) {
    if (!erase.url?.startsWith("firmware/") || !/^[0-9a-f]{64}$/.test(erase.sha256 || "")) throw new Error("erase is missing a local URL or SHA-256");
    const eraseHash = createHash("sha256").update(await readFile(join(root, erase.url))).digest("hex");
    if (eraseHash !== erase.sha256) throw new Error("erase SHA-256 does not match the catalog");
  }
}

console.log(`Portal OK: ${catalog.packages.length} firmware package(s), ${required.length} core files.`);
