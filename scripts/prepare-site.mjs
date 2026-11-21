import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(new URL("../", import.meta.url).pathname);
const outputArgument = process.argv.indexOf("--output");
const siteRoot = resolve(outputArgument >= 0 ? process.argv[outputArgument + 1] : "_site");
const publishable = ["index.html", "LICENSE", "assets", "catalog", "firmware", "src", "vendor"];

if (siteRoot === root || !siteRoot.endsWith("/_site")) {
  throw new Error(`Refusing to replace unsafe site output path: ${siteRoot}`);
}

await rm(siteRoot, { recursive: true, force: true });
await mkdir(siteRoot, { recursive: true });
await Promise.all(publishable.map((entry) => cp(resolve(root, entry), resolve(siteRoot, entry), { recursive: true })));
console.log(`Prepared static site in ${siteRoot}`);
