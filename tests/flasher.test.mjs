import assert from "node:assert/strict";
import { downloadVerifiedBlob, sha256Hex } from "../src/flasher.js";

const bytes = new TextEncoder().encode("abc");
const expected = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";
assert.equal(await sha256Hex(bytes), expected);

const fetchOk = async () => new Response(bytes, { status: 200 });
const blob = await downloadVerifiedBlob({ url: "https://example.test/firmware.zip", sha256: expected }, fetchOk);
assert.equal(blob.size, 3);

await assert.rejects(
  downloadVerifiedBlob({ url: "https://example.test/firmware.zip", sha256: "0".repeat(64) }, fetchOk),
  /SHA-256-kontrollen feilet/
);

await assert.rejects(
  downloadVerifiedBlob({ url: "https://example.test/missing.zip" }, async () => new Response("", { status: 404 })),
  /HTTP 404/
);

console.log("Flasher checksum- og nedlastingstester passerte.");
