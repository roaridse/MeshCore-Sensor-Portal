import assert from "node:assert/strict";
import { CompanionRemoteCli, bytesToHex } from "../src/companion.js";
import { Constants } from "../vendor/meshcore/meshcore.js";

class FakeConnection {
  constructor(contacts) {
    this.contacts = contacts;
    this.listeners = new Map();
    this.closed = false;
  }

  on(event, callback) {
    this.listeners.set(event, [...(this.listeners.get(event) || []), callback]);
  }

  once(event, callback) {
    const once = (...values) => {
      this.off(event, once);
      callback(...values);
    };
    this.on(event, once);
  }

  off(event, callback) {
    this.listeners.set(event, (this.listeners.get(event) || []).filter((item) => item !== callback));
  }

  emit(event, value) {
    for (const callback of this.listeners.get(event) || []) callback(value);
  }

  async getContacts() { return this.contacts; }
  async login(publicKey, password) {
    assert.equal(bytesToHex(publicKey), bytesToHex(this.contacts[0].publicKey));
    assert.equal(password, "secret");
  }
  async sendTextMessage(publicKey, command, type) {
    assert.equal(command, "ruuvi list");
    assert.equal(type, Constants.TxtTypes.CliData);
    this.queuedReply = { publicKey, text: "2 configured sensors" };
    queueMicrotask(() => this.emit(Constants.PushCodes.MsgWaiting, {}));
    return { estTimeout: 250 };
  }
  async getWaitingMessages() {
    if (this.queuedReply) {
      const reply = this.queuedReply;
      this.queuedReply = null;
      this.emit(Constants.ResponseCodes.ContactMsgRecv, {
        pubKeyPrefix: reply.publicKey.subarray(0, 6),
        txtType: Constants.TxtTypes.CliData,
        text: reply.text
      });
    }
    return [];
  }
  async close() { this.closed = true; }
}

const publicKey = Uint8Array.from({ length: 32 }, (_, index) => index + 1);
const fake = new FakeConnection([{ publicKey, type: 4, advName: "Cabin sensor" }]);
const remoteOutput = [];
const companion = new CompanionRemoteCli({
  connectionFactories: {
    bluetooth: async () => {
      setTimeout(() => fake.emit("connected"), 0);
      return fake;
    }
  },
  onData: (text) => remoteOutput.push(text)
});

const contacts = await companion.connect("bluetooth");
assert.equal(contacts.length, 1);
assert.equal(contacts[0].advName, "Cabin sensor");
companion.selectContact(bytesToHex(publicKey));
await companion.login("secret");
assert.equal(companion.ready, true);
assert.equal(await companion.send("ruuvi list", { timeoutMs: 100 }), "2 configured sensors");
assert.match(remoteOutput.join(""), /Remote Cabin sensor.*2 configured sensors/s);
await companion.disconnect();
assert.equal(fake.closed, true);
assert.equal(companion.connected, false);

console.log("Companion contact, login, and remote CLI tests passed.");
