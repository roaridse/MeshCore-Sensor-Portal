import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { syncFirmware } from "../scripts/sync-firmware.mjs";

const fixtureRoot = await mkdtemp(join(tmpdir(), "portal-sync-"));
await mkdir(join(fixtureRoot, "catalog"));
await mkdir(join(fixtureRoot, "firmware"));

const formatter = new TextEncoder().encode("formatter fixture");
const formatterHash = sha256(formatter);
await writeFile(join(fixtureRoot, "firmware", "formatter.zip"), formatter);
await writeFile(join(fixtureRoot, "catalog", "firmware.json"), JSON.stringify({
  schemaVersion: 1,
  updated: "2026-01-01",
  packages: [{
    profile: { id: "sensor", name: "Sensor" },
    board: { id: "rak4631", name: "RAK4631", mcu: "nRF52840", flashMethod: "nrf52-dfu-or-uf2" },
    version: "v1.0.0",
    environment: "sensor_env",
    assets: {
      uf2: { url: "firmware/legacy.uf2", sha256: "1".repeat(64) },
      dfu: { url: "firmware/legacy.zip", sha256: "2".repeat(64) },
      erase: { url: "firmware/formatter.zip", sha256: formatterHash }
    }
  }]
}));

const uf2 = new TextEncoder().encode("new uf2");
const dfu = new TextEncoder().encode("new dfu");
const manifest = {
  schemaVersion: 1,
  updated: "2026-11-21",
  release: { tag: "v1.1.0", repository: "example/firmware", commit: "abc", generatedAt: "2026-11-21T12:00:00Z" },
  packages: [{
    profile: { id: "sensor", name: "Sensor" },
    board: { id: "rak4631", name: "RAK4631", mcu: "nRF52840", flashMethod: "nrf52-dfu-or-uf2" },
    version: "v1.1.0",
    environment: "sensor_env",
    description: "Fixture",
    features: ["Test"],
    validation: "automated",
    source: "https://github.com/example/firmware",
    assets: {
      uf2: { url: "https://github.com/example/firmware/releases/download/v1.1.0/Sensor-v1.1.0.uf2", sha256: sha256(uf2), size: uf2.length },
      dfu: { url: "https://github.com/example/firmware/releases/download/v1.1.0/Sensor-v1.1.0.zip", sha256: sha256(dfu), size: dfu.length }
    }
  }]
};
const releases = [{
  tag_name: "v1.1.0",
  draft: false,
  prerelease: false,
  assets: [
    { name: "portal-manifest.json", url: "https://api.test/manifest" },
    { name: "Sensor-v1.1.0.uf2", url: "https://api.test/uf2" },
    { name: "Sensor-v1.1.0.zip", url: "https://api.test/dfu" }
  ]
}];

const responses = new Map([
  ["https://api.github.com/repos/example/firmware/releases?per_page=100", jsonResponse(releases)],
  ["https://api.test/manifest", bytesResponse(new TextEncoder().encode(JSON.stringify(manifest)))],
  ["https://api.test/uf2", bytesResponse(uf2)],
  ["https://api.test/dfu", bytesResponse(dfu)]
]);
const fetchImpl = async (url) => responses.get(String(url)) || new Response("missing", { status: 404 });
const result = await syncFirmware({ siteRoot: fixtureRoot, repository: "example/firmware", keep: 2, fetchImpl });

assert.equal(result.manifestCount, 1);
assert.equal(result.remotePackageCount, 1);
assert.deepEqual(result.catalog.packages.map((item) => item.version), ["v1.1.0", "v1.0.0"]);
const current = result.catalog.packages[0];
assert.equal(current.assets.erase.sha256, formatterHash);
assert.match(current.assets.uf2.url, /^firmware\/example-firmware\/sensor\/rak4631\/v1.1.0\//);
assert.equal(sha256(await readFile(join(fixtureRoot, current.assets.uf2.url))), sha256(uf2));

console.log("Firmware release synchronization tests passed.");

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function jsonResponse(value) {
  return new Response(JSON.stringify(value), { status: 200, headers: { "Content-Type": "application/json" } });
}

function bytesResponse(value) {
  return new Response(value, { status: 200, headers: { "Content-Type": "application/octet-stream" } });
}
