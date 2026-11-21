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
  (error) => error.code === "CLI_NO_BYTES" && /received no bytes/.test(error.message)
);

const signalStates = [];
written = "";
cli.port.setSignals = async (state) => signalStates.push(state);
await cli.wake();
assert.deepEqual(signalStates, [
  { dataTerminalReady: false, requestToSend: false },
  { dataTerminalReady: true, requestToSend: true }
]);
assert.equal(written, "\r\n", "wake-up must send an empty terminal line");

cli.portInfo = { usbVendorId: 0x239a, usbProductId: 0x8029 };
const staleVersionError = await cli.send("status", { timeoutMs: 5 }).catch((error) => error);
assert.doesNotMatch(staleVersionError.message, /v0\.3\.1/);

console.log("Serial CLI writer, wake-up, response, and timeout tests passed.");
