import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const MANIFEST_NAME = "portal-manifest.json";
const API_VERSION = "2022-11-28";
const REMOTE_ASSET_TYPES = new Set(["uf2", "dfu", "hex", "bin"]);

export async function syncFirmware({ siteRoot, repository, token = "", keep = 3, fetchImpl = globalThis.fetch }) {
  validateRepository(repository);
  if (!Number.isInteger(keep) || keep < 1) throw new Error("keep must be a positive integer");
  if (typeof fetchImpl !== "function") throw new Error("A fetch implementation is required");

  const catalogPath = join(siteRoot, "catalog", "firmware.json");
  const baseCatalog = JSON.parse(await readFile(catalogPath, "utf8"));
  validateCatalog(baseCatalog, "bundled catalog");
  const formatters = formatterAssetsByBoard(baseCatalog);
  const releases = await fetchJson(
    `https://api.github.com/repos/${repository}/releases?per_page=100`,
    apiHeaders(token),
    fetchImpl
  );
  if (!Array.isArray(releases)) throw new Error("GitHub releases response was not an array");

  const remotePackages = [];
  let manifestCount = 0;
  for (const release of releases.filter((item) => !item.draft && !item.prerelease)) {
    const manifestAsset = release.assets?.find((asset) => asset.name === MANIFEST_NAME);
    if (!manifestAsset) continue;
    const manifest = await fetchReleaseJson(manifestAsset, token, fetchImpl);
    validateReleaseManifest(manifest, release, repository);
    manifestCount += 1;
    for (const firmwarePackage of manifest.packages) {
      const synced = await downloadPackageAssets({
        firmwarePackage,
        release,
        repository,
        siteRoot,
        token,
        fetchImpl
      });
      const formatter = formatters.get(firmwarePackage.board.id);
      if (formatter) synced.assets.erase = structuredClone(formatter);
      remotePackages.push(synced);
    }
  }

  const bundledPackages = baseCatalog.packages.map((item) => sanitizeBundledPackage(item));
  const packages = retainVersions([...remotePackages, ...bundledPackages], keep);
  if (packages.length === 0) throw new Error("No firmware packages were available after synchronization");

  const catalog = {
    schemaVersion: 1,
    updated: new Date().toISOString().slice(0, 10),
    packages
  };
  validateCatalog(catalog, "generated catalog");
  await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
  return { catalog, manifestCount, remotePackageCount: remotePackages.length };
}

async function downloadPackageAssets({ firmwarePackage, release, repository, siteRoot, token, fetchImpl }) {
  const output = structuredClone(firmwarePackage);
  output.assets = {};
  for (const [type, descriptor] of Object.entries(firmwarePackage.assets)) {
    if (!REMOTE_ASSET_TYPES.has(type)) continue;
    validateAssetDescriptor(descriptor, `${firmwarePackage.environment}.${type}`);
    const filename = assetFilename(descriptor.url);
    const releaseAsset = release.assets?.find((asset) => asset.name === filename);
    if (!releaseAsset) throw new Error(`${release.tag_name} does not contain declared asset ${filename}`);
    const bytes = await fetchReleaseBytes(releaseAsset, token, fetchImpl);
    const actualHash = createHash("sha256").update(bytes).digest("hex");
    if (actualHash !== descriptor.sha256) throw new Error(`SHA-256 mismatch for ${release.tag_name}/${filename}`);
    if (descriptor.size != null && descriptor.size !== bytes.byteLength) throw new Error(`Size mismatch for ${release.tag_name}/${filename}`);

    const relativePath = join(
      "firmware",
      safeSegment(repository.replace("/", "-")),
      safeSegment(firmwarePackage.profile.id),
      safeSegment(firmwarePackage.board.id),
      safeSegment(firmwarePackage.version),
      filename
    );
    const outputPath = join(siteRoot, relativePath);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, bytes);
    output.assets[type] = { ...descriptor, url: relativePath };
  }
  for (const required of ["uf2", "dfu"]) {
    if (!output.assets[required]) throw new Error(`${firmwarePackage.environment} ${firmwarePackage.version} is missing ${required}`);
  }
  return output;
}

function sanitizeBundledPackage(item) {
  const output = structuredClone(item);
  output.assets = Object.fromEntries(Object.entries(output.assets).filter(([, asset]) => (
    asset?.url?.startsWith("firmware/") && /^[0-9a-f]{64}$/.test(asset.sha256 || "")
  )));
  return output;
}

function formatterAssetsByBoard(catalog) {
  const result = new Map();
  for (const item of catalog.packages) {
    if (item.assets?.erase) result.set(item.board.id, structuredClone(item.assets.erase));
  }
  return result;
}

function retainVersions(packages, keep) {
  const seenVersions = new Map();
  const seenPackages = new Set();
  const output = [];
  for (const item of packages) {
    const family = `${item.profile.id}/${item.board.id}/${item.environment}`;
    const identity = `${family}/${item.version}`;
    if (seenPackages.has(identity)) continue;
    seenPackages.add(identity);
    const versions = seenVersions.get(family) || new Set();
    if (!versions.has(item.version) && versions.size >= keep) continue;
    versions.add(item.version);
    seenVersions.set(family, versions);
    output.push(item);
  }
  return output;
}

function validateReleaseManifest(manifest, release, repository) {
  validateCatalog(manifest, `${release.tag_name}/${MANIFEST_NAME}`);
  if (manifest.release?.tag !== release.tag_name) throw new Error(`Manifest tag ${manifest.release?.tag} does not match release ${release.tag_name}`);
  if (manifest.release?.repository !== repository) throw new Error(`Manifest repository ${manifest.release?.repository} does not match ${repository}`);
  for (const item of manifest.packages) {
    if (item.version !== release.tag_name) throw new Error(`${item.environment} version ${item.version} does not match ${release.tag_name}`);
  }
}

function validateCatalog(catalog, label) {
  if (catalog?.schemaVersion !== 1 || !Array.isArray(catalog.packages) || catalog.packages.length === 0) {
    throw new Error(`${label} is not a non-empty schemaVersion 1 catalog`);
  }
  for (const [index, item] of catalog.packages.entries()) {
    for (const field of ["profile", "board", "version", "environment", "assets"]) {
      if (!item[field]) throw new Error(`${label} packages[${index}] is missing ${field}`);
    }
  }
}

function validateAssetDescriptor(asset, label) {
  if (!asset?.url || !/^[0-9a-f]{64}$/.test(asset.sha256 || "")) throw new Error(`${label} is missing a URL or SHA-256`);
  if (asset.size != null && (!Number.isInteger(asset.size) || asset.size < 1)) throw new Error(`${label} has an invalid size`);
}

async function fetchReleaseJson(asset, token, fetchImpl) {
  const bytes = await fetchReleaseBytes(asset, token, fetchImpl);
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch (error) {
    throw new Error(`Could not parse ${asset.name}: ${error.message}`);
  }
}

async function fetchReleaseBytes(asset, token, fetchImpl) {
  const response = await fetchImpl(asset.url, { headers: { ...apiHeaders(token), Accept: "application/octet-stream" } });
  if (!response.ok) throw new Error(`GitHub asset ${asset.name} returned HTTP ${response.status}`);
  return new Uint8Array(await response.arrayBuffer());
}

async function fetchJson(url, headers, fetchImpl) {
  const response = await fetchImpl(url, { headers });
  if (!response.ok) throw new Error(`GitHub API returned HTTP ${response.status} for ${url}`);
  return response.json();
}

function apiHeaders(token) {
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": API_VERSION,
    "User-Agent": "MeshCore-Sensor-Portal",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

function assetFilename(url) {
  const filename = basename(decodeURIComponent(new URL(url).pathname));
  if (!filename || filename === "." || filename === "..") throw new Error(`Invalid release asset URL: ${url}`);
  return filename;
}

function safeSegment(value) {
  const segment = String(value).replace(/[^A-Za-z0-9_.-]/g, "-");
  if (!segment || segment === "." || segment === "..") throw new Error(`Unsafe path segment: ${value}`);
  return segment;
}

function validateRepository(repository) {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository || "")) throw new Error("repository must use owner/name format");
}

function parseArguments(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 2) {
    if (!argv[index]?.startsWith("--") || argv[index + 1] == null) throw new Error(`Expected --name value near ${argv[index] || "end of arguments"}`);
    values[argv[index].slice(2)] = argv[index + 1];
  }
  return values;
}

async function main() {
  const args = parseArguments(process.argv.slice(2));
  const siteRoot = resolve(args.site || "_site");
  const repository = args.repository || process.env.FIRMWARE_REPOSITORY;
  if (!repository) throw new Error("Missing --repository or FIRMWARE_REPOSITORY");
  const result = await syncFirmware({
    siteRoot,
    repository,
    token: process.env.FIRMWARE_REPO_TOKEN || "",
    keep: Number.parseInt(args.keep || "3", 10)
  });
  console.log(`Firmware sync complete: ${result.manifestCount} manifest(s), ${result.remotePackageCount} remote package(s), ${result.catalog.packages.length} published package(s).`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
