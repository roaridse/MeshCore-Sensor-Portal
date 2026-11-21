import { readFile, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";

const root = new URL("../", import.meta.url).pathname;
const required = [
  "index.html", "assets/styles.css", "src/app.js", "src/serial.js", "src/flasher.js",
  "catalog/firmware.json", "scripts/serve.mjs", "vendor/meshcore-flasher/dfu.js",
  "vendor/meshcore-flasher/zip.min.js", "vendor/meshcore-flasher/NOTICE.md",
  "firmware/FLASH_ERASE_nrf52_softdevice_v6.zip",
  "firmware/RAK4631-BLE-Sensor-v0.3.1.zip", "firmware/RAK4631-BLE-Sensor-v0.3.1.uf2"
];
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
  for (const assetName of ["uf2", "dfu", "erase"]) {
    const asset = item.assets[assetName];
    if (!asset?.url || !/^[0-9a-f]{64}$/.test(asset.sha256 || "")) throw new Error(`${assetName} is missing a URL or SHA-256`);
    if (!asset.url.startsWith("firmware/")) throw new Error(`${assetName} must be a local, publishable portal asset`);
    const assetHash = createHash("sha256").update(await readFile(join(root, asset.url))).digest("hex");
    if (assetHash !== asset.sha256) throw new Error(`${assetName} SHA-256 does not match the catalog`);
  }
}

console.log(`Portal OK: ${catalog.packages.length} firmware package(s), ${required.length} core files.`);
