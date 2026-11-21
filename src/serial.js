const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export class SerialCli {
  constructor({
    baudRate = 115200,
    serial = globalThis.navigator?.serial,
    onData = () => {},
    onDisconnect = () => {},
    onStatus = () => {}
  } = {}) {
    this.baudRate = baudRate;
    this.serial = serial;
    this.onData = onData;
    this.onDisconnect = onDisconnect;
    this.onStatus = onStatus;
    this.port = null;
    this.reader = null;
    this.reading = false;
    this.pending = null;
    this.decoder = new TextDecoder();
    this.receivedBytes = 0;
    this.portInfo = {};
  }

  static supported() {
    return Boolean(globalThis.navigator?.serial);
  }

  get connected() {
    return Boolean(this.port?.readable && this.port?.writable && this.reading);
  }

  async connect() {
    if (!this.serial?.requestPort) throw new Error("Web Serial is not supported by this browser.");
    if (this.connected) return this.port.getInfo();

    this.status("Select the sensor node's USB port.");
    this.port = await this.serial.requestPort({});
    const info = this.port.getInfo();
    this.portInfo = info;
    this.status(`Opening ${formatPortInfo(info)} at ${this.baudRate} baud.`);
    await this.port.open({ baudRate: this.baudRate, bufferSize: 4096 });

    // Match terminal programs such as minicom: start with both modem-control
    // lines low, then assert DTR and RTS. TinyUSB treats DTR as the CDC
    // connection state, and some Linux/USB combinations need a real edge here
    // rather than receiving the already-active state once.
    await this.pulseTerminalSignals();

    this.receivedBytes = 0;
    this.reading = true;
    void this.readLoop();
    await delay(100);
    return info;
  }

  async pulseTerminalSignals() {
    if (!this.port?.setSignals) return;
    try {
      await this.port.setSignals({ dataTerminalReady: false, requestToSend: false });
      await delay(75);
      await this.port.setSignals({ dataTerminalReady: true, requestToSend: true });
      this.status("DTR and RTS asserted; the USB CDC connection is active.");
    } catch (error) {
      this.status(`The port does not support DTR/RTS signals (${error.message}).`);
    }
  }

  async wake() {
    if (!this.connected) throw new Error("No USB device is connected.");
    this.status("Waking the USB CLI with a new terminal session.");
    await this.pulseTerminalSignals();
    await delay(100);
    await this.writeRaw("\r\n");
    await delay(150);
  }

  async probe(command = "ver", options = {}) {
    try {
      return await this.send(command, options);
    } catch (error) {
      if (error.code !== "CLI_NO_BYTES") throw error;
      this.status("The first CLI test returned no bytes; retrying after a terminal wake-up.");
      await this.wake();
      return this.send(command, options);
    }
  }

  async disconnect() {
    this.reading = false;
    if (this.reader) {
      try { await this.reader.cancel(); } catch { /* Port may already be gone. */ }
    }
    if (this.port?.setSignals) {
      try { await this.port.setSignals({ dataTerminalReady: false, requestToSend: false }); } catch { /* Optional. */ }
    }
    if (this.port) {
      try { await this.port.close(); } catch { /* Device may have disconnected. */ }
      this.port = null;
    }
    this.finishPending(new Error("The port was disconnected."));
    this.status("The USB port is closed.");
  }

  async readLoop() {
    try {
      while (this.port?.readable && this.reading) {
        this.reader = this.port.readable.getReader();
        try {
          while (this.reading) {
            const { value, done } = await this.reader.read();
            if (done) break;
            if (value?.byteLength) {
              this.receivedBytes += value.byteLength;
              this.handleChunk(this.decoder.decode(value, { stream: true }));
            }
          }
        } finally {
          this.reader.releaseLock();
          this.reader = null;
        }
      }
    } catch (error) {
      if (this.reading) {
        this.onData(`\n[USB read error: ${error.message}]\n`);
        this.status(`USB reading stopped: ${error.message}`);
      }
    } finally {
      if (this.reading) {
        this.reading = false;
        this.finishPending(new Error("The USB device disappeared."));
        this.onDisconnect();
      }
    }
  }

  handleChunk(text) {
    this.onData(text);
    if (!this.pending) return;
    this.pending.output += text;
    clearTimeout(this.pending.idleTimer);
    this.pending.idleTimer = setTimeout(() => this.finishPending(), this.pending.idleMs);
  }

  async send(command, { idleMs = 650, timeoutMs = 7000 } = {}) {
    if (!this.connected) throw new Error("No USB device is connected.");
    if (this.pending) throw new Error("Wait for the previous command to finish.");

    const normalized = command.trim();
    if (!normalized) return "";
    const receivedBefore = this.receivedBytes;

    return new Promise(async (resolve, reject) => {
      const timeoutTimer = setTimeout(() => {
        const received = this.receivedBytes - receivedBefore;
        const detail = received === 0
          ? noBytesMessage(this.portInfo)
          : `The port received ${received} bytes, but the response did not finish.`;
        const error = new Error(detail);
        if (received === 0) error.code = "CLI_NO_BYTES";
        this.finishPending(error);
      }, timeoutMs);
      this.pending = { resolve, reject, output: "", command: normalized, idleMs, idleTimer: null, timeoutTimer };

      try {
        await this.writeRaw(`${normalized}\r\n`);
      } catch (error) {
        this.finishPending(error);
      }
    });
  }

  async writeRaw(value) {
    let writer;
    try {
      writer = this.port.writable.getWriter();
      const payload = new TextEncoder().encode(value);
      await writer.write(payload);
      this.status(`Sent ${payload.byteLength} bytes to the CLI.`);
    } finally {
      try { writer?.releaseLock(); } catch { /* Ignore a released/closed writer. */ }
    }
  }

  finishPending(error = null) {
    if (!this.pending) return;
    const pending = this.pending;
    this.pending = null;
    clearTimeout(pending.idleTimer);
    clearTimeout(pending.timeoutTimer);
    if (error) pending.reject(error);
    else pending.resolve(cleanReply(pending.output, pending.command));
  }

  status(message) {
    this.onStatus({ timestamp: new Date(), message });
  }
}

export function formatPortInfo(info = {}) {
  const vendor = Number.isInteger(info.usbVendorId) ? hex4(info.usbVendorId) : "????";
  const product = Number.isInteger(info.usbProductId) ? hex4(info.usbProductId) : "????";
  return `USB ${vendor}:${product}`;
}

export function portRole(info = {}) {
  if (info.usbVendorId !== 0x239a) return "unknown";
  if (info.usbProductId === 0x8029) return "application";
  if (info.usbProductId === 0x0029 || info.usbProductId === 0x002a) return "bootloader";
  return "unknown";
}

function noBytesMessage(info) {
  if (portRole(info) === "application") {
    return "239A:8029 is the correct application port, but the firmware USB CLI returned no bytes. Close minicom or other programs using the port, reconnect the USB cable, and try again.";
  }
  if (portRole(info) === "bootloader") {
    return "This is the bootloader port. Start the sensor node normally and select application port 239A:8029.";
  }
  return "The command was sent, but the port received no bytes. Make sure you selected the sensor node's application port.";
}

function cleanReply(value, command) {
  const lines = value.replace(/\r/g, "").replace(/^>\s*/gm, "").trim().split("\n");
  if (lines[0]?.trim() === command) lines.shift();
  return lines.join("\n").trim();
}

function hex4(value) {
  return value.toString(16).toUpperCase().padStart(4, "0");
}
