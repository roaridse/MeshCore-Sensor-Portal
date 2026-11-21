import { WebBleConnection, WebSerialConnection, Constants } from "../vendor/meshcore/meshcore.js";

const SENSOR_CONTACT_TYPE = 4;
const DEFAULT_REPLY_TIMEOUT_MS = 45000;

export class CompanionRemoteCli {
  constructor({
    connectionFactories = {
      bluetooth: () => WebBleConnection.open(),
      serial: () => WebSerialConnection.open()
    },
    onData = () => {},
    onDisconnect = () => {},
    onStatus = () => {}
  } = {}) {
    this.connectionFactories = connectionFactories;
    this.onData = onData;
    this.onDisconnect = onDisconnect;
    this.onStatus = onStatus;
    this.connection = null;
    this.contacts = [];
    this.target = null;
    this.authenticated = false;
    this.pending = null;
    this.draining = false;
    this.drainRequested = false;
  }

  static supported(method) {
    return method === "bluetooth" ? Boolean(globalThis.navigator?.bluetooth) : Boolean(globalThis.navigator?.serial);
  }

  get connected() {
    return Boolean(this.connection);
  }

  get ready() {
    return this.connected && this.authenticated && Boolean(this.target);
  }

  async connect(method = "bluetooth") {
    if (!CompanionRemoteCli.supported(method) && !this.connectionFactories[method]) {
      throw new Error(`${method === "bluetooth" ? "Web Bluetooth" : "Web Serial"} is not supported by this browser.`);
    }
    if (this.connected) return this.contacts;
    const factory = this.connectionFactories[method];
    if (!factory) throw new Error(`Unknown Companion connection method: ${method}`);

    this.status(`Select the MeshCore Companion (${method === "bluetooth" ? "Bluetooth" : "USB"}).`);
    const connection = await factory();
    if (!connection) throw new Error("No Companion was selected.");
    this.connection = connection;
    this.bindConnection(connection);
    await waitForEvent(connection, "connected", 12000, "The Companion did not finish connecting.");
    this.status("Companion connected; reading contacts.");
    return this.refreshContacts();
  }

  bindConnection(connection) {
    connection.on("disconnected", () => {
      const wasConnected = this.connected;
      this.reset();
      if (wasConnected) this.onDisconnect();
    });
    connection.on(Constants.PushCodes.MsgWaiting, () => { void this.drainMessages(); });
    connection.on(Constants.ResponseCodes.ContactMsgRecv, (message) => this.handleMessage(message));
  }

  async refreshContacts() {
    if (!this.connection) throw new Error("Connect to a Companion first.");
    const allContacts = await withTimeout(this.connection.getContacts(), 12000, "Timed out while reading Companion contacts.");
    const sensors = allContacts.filter((contact) => contact.type === SENSOR_CONTACT_TYPE);
    this.contacts = sensors;
    this.status(sensors.length
      ? `Found ${sensors.length} sensor contact${sensors.length === 1 ? "" : "s"}.`
      : "No sensor contacts were found. Wait for the sensor advert and refresh the contact list.");
    return this.contacts;
  }

  selectContact(publicKeyHex) {
    const normalized = publicKeyHex.toLowerCase();
    const contact = this.contacts.find((item) => bytesToHex(item.publicKey) === normalized);
    if (!contact) throw new Error("The selected sensor is no longer in the Companion contact list.");
    this.target = contact;
    this.authenticated = false;
    return contact;
  }

  async login(password) {
    if (!this.connection || !this.target) throw new Error("Select a sensor contact first.");
    this.status(`Authenticating with ${this.target.advName || "sensor node"}.`);
    try {
      await this.connection.login(this.target.publicKey, password, 8000);
    } catch (error) {
      throw new Error(error === "timeout" ? "The sensor did not accept the login before timeout." : "Remote administrator login failed.");
    }
    this.authenticated = true;
    this.status(`Remote CLI ready for ${this.target.advName || "sensor node"}.`);
    return this.target;
  }

  async send(command, { timeoutMs = DEFAULT_REPLY_TIMEOUT_MS } = {}) {
    if (!this.ready) throw new Error("Connect, select a sensor, and log in before sending commands.");
    if (this.pending) throw new Error("Wait for the previous remote command to finish.");

    const normalized = command.trim();
    if (!normalized) return "";
    const prefix = this.target.publicKey.subarray(0, 6);
    const reply = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending = null;
        reject(new Error("The sensor did not return a remote CLI response before timeout."));
      }, timeoutMs);
      this.pending = { prefix, resolve, reject, timeout };
    });

    try {
      const sent = await this.connection.sendTextMessage(this.target.publicKey, normalized, Constants.TxtTypes.CliData);
      this.status(`Remote command accepted by the Companion; estimated round trip ${sent?.estTimeout ?? "unknown"} ms.`);
      return await reply;
    } catch (error) {
      if (this.pending) {
        clearTimeout(this.pending.timeout);
        this.pending = null;
      }
      throw error instanceof Error ? error : new Error("The Companion could not send the remote command.");
    }
  }

  handleMessage(message) {
    if (message.txtType !== Constants.TxtTypes.CliData) return;
    const name = this.contactName(message.pubKeyPrefix);
    this.onData(`\n[Remote ${name}] ${message.text}\n`);
    if (!this.pending || !equalBytes(this.pending.prefix, message.pubKeyPrefix)) return;
    const pending = this.pending;
    this.pending = null;
    clearTimeout(pending.timeout);
    pending.resolve(message.text.trim());
  }

  async drainMessages() {
    if (!this.connection) return;
    if (this.draining) {
      this.drainRequested = true;
      return;
    }
    this.draining = true;
    try {
      do {
        this.drainRequested = false;
        await this.connection.getWaitingMessages();
      } while (this.drainRequested && this.connection);
    } catch (error) {
      this.status(`Could not read the Companion message queue: ${error.message || error}`);
    } finally {
      this.draining = false;
    }
  }

  async disconnect() {
    const connection = this.connection;
    this.reset();
    if (connection) await connection.close();
    this.status("Companion disconnected.");
  }

  reset() {
    this.rejectPending(new Error("The Companion was disconnected."));
    this.connection = null;
    this.contacts = [];
    this.target = null;
    this.authenticated = false;
    this.draining = false;
    this.drainRequested = false;
  }

  rejectPending(error) {
    if (!this.pending) return;
    const pending = this.pending;
    this.pending = null;
    clearTimeout(pending.timeout);
    pending.reject(error);
  }

  contactName(prefix) {
    return this.contacts.find((contact) => equalBytes(contact.publicKey.subarray(0, prefix.length), prefix))?.advName || bytesToHex(prefix);
  }

  status(message) {
    this.onStatus({ timestamp: new Date(), message });
  }
}

export function bytesToHex(bytes) {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

function equalBytes(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function waitForEvent(emitter, event, timeoutMs, timeoutMessage) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    emitter.once(event, (...values) => {
      clearTimeout(timeout);
      resolve(values);
    });
  });
}

function withTimeout(promise, timeoutMs, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), timeoutMs))
  ]);
}
