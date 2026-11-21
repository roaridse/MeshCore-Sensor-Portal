import { Dfu } from "../vendor/meshcore-flasher/dfu.js";

export class Nrf52Flasher {
  constructor({ serial = globalThis.navigator?.serial, fetchImpl = globalThis.fetch, onLog = () => {} } = {}) {
    this.serial = serial;
    this.fetchImpl = fetchImpl;
    this.onLog = onLog;
  }

  get supported() {
    return Boolean(this.serial?.requestPort);
  }

  async enterDfuMode() {
    this.assertSupported();
    this.log("Select the sensor node's normal USB port for the 1200-baud reset.");
    const port = await this.serial.requestPort({});
    const info = port.getInfo();
    this.log(`Selected ${formatPortInfo(info)}. Sending 1200-baud touch reset.`);
    if (info.usbVendorId === 0x239a && info.usbProductId !== 0x8029) {
      this.log("Note: the RAK4631 application port is normally 239A:8029.");
    }
    await Dfu.forceDfuMode(port);
    this.log("The reset signal was sent. The browser cannot verify that the bootloader started; look for a new USB port or a pulsing LED.");
  }

  async flashAsset(asset, onProgress = () => {}) {
    this.log(`Downloading ${asset.url}.`);
    const blob = await downloadVerifiedBlob(asset, this.fetchImpl);
    this.log(`Firmware downloaded (${formatBytes(blob.size)})${asset.sha256 ? " and SHA-256 verified" : ""}.`);
    return this.flashBlob(blob, onProgress);
  }

  async flashBlob(blob, onProgress = () => {}) {
    this.assertSupported();
    if (!(blob instanceof Blob) || blob.size === 0) throw new Error("The DFU ZIP file is empty or invalid.");
    this.log(`Select the DFU/bootloader port for the ${formatBytes(blob.size)} firmware image.`);
    const port = await this.serial.requestPort({});
    const info = port.getInfo();
    this.log(`Selected ${formatPortInfo(info)}. Opening Nordic serial DFU.`);
    if (info.usbVendorId === 0x239a && info.usbProductId === 0x8029) {
      this.log("239A:8029 is the application port. Enter DFU mode first; the bootloader normally uses 239A:0029 or 239A:002A.");
    }
    const dfu = new Dfu(port);
    this.lastProgressStep = -1;
    try {
      await dfu.dfuUpdate(blob, (percent) => {
        this.logProgress(percent);
        onProgress(percent);
      });
      this.log("DFU transfer completed.");
    } catch (error) {
      this.log(`DFU failed: ${error.message}`);
      throw error;
    }
  }

  assertSupported() {
    if (!this.supported) throw new Error("Web Serial is not supported by this browser.");
  }

  log(message) {
    this.onLog({ timestamp: new Date(), message });
  }

  logProgress(percent) {
    const step = Math.floor(percent / 10) * 10;
    if (step !== this.lastProgressStep) {
      this.lastProgressStep = step;
      this.log(`DFU progress: ${Math.min(100, step)}%.`);
    }
  }
}

export async function downloadVerifiedBlob(asset, fetchImpl = globalThis.fetch) {
  if (!asset?.url) throw new Error("The firmware package does not contain a DFU URL.");
  const response = await fetchImpl(asset.url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not download firmware (HTTP ${response.status}).`);
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength === 0) throw new Error("The downloaded firmware file is empty.");

  if (asset.sha256) {
    const actual = await sha256Hex(buffer);
    if (actual !== asset.sha256.toLowerCase()) {
      throw new Error("SHA-256 verification failed. The file will not be flashed.");
    }
  }

  return new Blob([buffer], { type: "application/zip" });
}

export async function sha256Hex(data) {
  if (!globalThis.crypto?.subtle) throw new Error("The browser cannot verify the firmware checksum.");
  const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function formatPortInfo(info = {}) {
  const hex = (value) => Number.isInteger(value) ? value.toString(16).toUpperCase().padStart(4, "0") : "????";
  return `USB ${hex(info.usbVendorId)}:${hex(info.usbProductId)}`;
}

function formatBytes(bytes) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} kB`;
}
