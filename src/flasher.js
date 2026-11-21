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
    this.log("Velg sensornodens vanlige USB-port for 1200-baud reset.");
    const port = await this.serial.requestPort({});
    const info = port.getInfo();
    this.log(`Valgt ${formatPortInfo(info)}. Sender 1200-baud touch-reset.`);
    if (info.usbVendorId === 0x239a && info.usbProductId !== 0x8029) {
      this.log("Merk: RAK4631-applikasjonsporten er normalt 239A:8029.");
    }
    await Dfu.forceDfuMode(port);
    this.log("Reset-signalet er sendt. Nettleseren kan ikke bekrefte at bootloaderen startet; se etter en ny USB-port eller pulserende LED.");
  }

  async flashAsset(asset, onProgress = () => {}) {
    this.log(`Laster ${asset.url}.`);
    const blob = await downloadVerifiedBlob(asset, this.fetchImpl);
    this.log(`Firmware lastet (${formatBytes(blob.size)})${asset.sha256 ? " og SHA-256 godkjent" : ""}.`);
    return this.flashBlob(blob, onProgress);
  }

  async flashBlob(blob, onProgress = () => {}) {
    this.assertSupported();
    if (!(blob instanceof Blob) || blob.size === 0) throw new Error("DFU ZIP-filen er tom eller ugyldig.");
    this.log(`Velg DFU/bootloader-porten for ${formatBytes(blob.size)} firmware.`);
    const port = await this.serial.requestPort({});
    const info = port.getInfo();
    this.log(`Valgt ${formatPortInfo(info)}. Åpner Nordic serial DFU.`);
    if (info.usbVendorId === 0x239a && info.usbProductId === 0x8029) {
      this.log("239A:8029 er applikasjonsporten. Aktiver DFU først; bootloaderen bruker normalt 239A:0029 eller 239A:002A.");
    }
    const dfu = new Dfu(port);
    this.lastProgressStep = -1;
    try {
      await dfu.dfuUpdate(blob, (percent) => {
        this.logProgress(percent);
        onProgress(percent);
      });
      this.log("DFU-overføringen er fullført.");
    } catch (error) {
      this.log(`DFU feilet: ${error.message}`);
      throw error;
    }
  }

  assertSupported() {
    if (!this.supported) throw new Error("Web Serial støttes ikke av denne nettleseren.");
  }

  log(message) {
    this.onLog({ timestamp: new Date(), message });
  }

  logProgress(percent) {
    const step = Math.floor(percent / 10) * 10;
    if (step !== this.lastProgressStep) {
      this.lastProgressStep = step;
      this.log(`DFU fremdrift: ${Math.min(100, step)} %.`);
    }
  }
}

export async function downloadVerifiedBlob(asset, fetchImpl = globalThis.fetch) {
  if (!asset?.url) throw new Error("Firmwarepakken mangler en DFU-adresse.");
  const response = await fetchImpl(asset.url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Kunne ikke laste ned firmware (HTTP ${response.status}).`);
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength === 0) throw new Error("Nedlastet firmwarefil er tom.");

  if (asset.sha256) {
    const actual = await sha256Hex(buffer);
    if (actual !== asset.sha256.toLowerCase()) {
      throw new Error("SHA-256-kontrollen feilet. Filen blir ikke flashet.");
    }
  }

  return new Blob([buffer], { type: "application/zip" });
}

export async function sha256Hex(data) {
  if (!globalThis.crypto?.subtle) throw new Error("Nettleseren kan ikke kontrollere firmware-checksum.");
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
