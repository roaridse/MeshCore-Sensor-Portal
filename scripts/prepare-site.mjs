import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(new URL("../", import.meta.url).pathname);
const outputArgument = process.argv.indexOf("--output");
const siteRoot = resolve(outputArgument >= 0 ? process.argv[outputArgument + 1] : "_site");
const publishable = ["index.html", "docs.html", "status.html", "LICENSE", "assets", "catalog", "firmware", "src", "vendor"];

if (siteRoot === root || !siteRoot.endsWith("/_site")) {
  throw new Error(`Refusing to replace unsafe site output path: ${siteRoot}`);
}

await rm(siteRoot, { recursive: true, force: true });
await mkdir(siteRoot, { recursive: true });
await Promise.all(publishable.map((entry) => cp(resolve(root, entry), resolve(siteRoot, entry), { recursive: true })));

const goatCounterSiteCode = (process.env.GOATCOUNTER_SITE_CODE || "").trim();
if (goatCounterSiteCode && !/^[a-z0-9][a-z0-9-]*$/.test(goatCounterSiteCode)) {
  throw new Error("GOATCOUNTER_SITE_CODE must contain only lowercase letters, numbers, and hyphens");
}
await Promise.all(["index.html", "docs.html", "status.html"].map(async (file) => {
  const path = resolve(siteRoot, file);
  const html = await readFile(path, "utf8");
  await writeFile(path, html.replaceAll("GOATCOUNTER_SITE_CODE", goatCounterSiteCode));
}));
console.log(`Prepared static site in ${siteRoot}`);
