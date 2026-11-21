import assert from "node:assert/strict";
import { SerialCli, formatPortInfo, portRole } from "../src/serial.js";

let released = false;
let written = "";
const cli = new SerialCli();
cli.port = {
  readable: {},
  writable: {
    getWriter() {
      return {
        async write(bytes) { written += new TextDecoder().decode(bytes); },
        releaseLock() { released = true; }
      };
    }
  }
};
cli.reading = true;

const replyPromise = cli.send("ver", { idleMs: 5, timeoutMs: 100 });
cli.handleChunk("ver\r\nMeshCore Sensor v0.3.1\r\n");
assert.equal(await replyPromise, "MeshCore Sensor v0.3.1");
assert.equal(written, "ver\r\n");
assert.equal(released, true, "the writer lock must be released after every command");
assert.equal(formatPortInfo({ usbVendorId: 0x239a, usbProductId: 0x8029 }), "USB 239A:8029");
assert.equal(portRole({ usbVendorId: 0x239a, usbProductId: 0x8029 }), "application");
assert.equal(portRole({ usbVendorId: 0x239a, usbProductId: 0x0029 }), "bootloader");

await assert.rejects(
  cli.send("status", { timeoutMs: 5 }),
  /received no bytes/
);

console.log("Serial CLI writer, response, and timeout tests passed.");
