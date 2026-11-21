import { build } from "esbuild";

await build({
  entryPoints: ["src/meshcore-browser-entry.js"],
  outfile: "vendor/meshcore/meshcore.js",
  bundle: true,
  format: "esm",
  platform: "browser",
  target: ["chrome105", "edge105"],
  legalComments: "eof"
});

console.log("Built vendor/meshcore/meshcore.js");
