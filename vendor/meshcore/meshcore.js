// node_modules/@liamcottle/meshcore.js/src/constants.js
var Constants = class {
  static SupportedCompanionProtocolVersion = 3;
  static SerialFrameTypes = {
    Incoming: 62,
    // ">"
    Outgoing: 60
    // "<"
  };
  static Ble = {
    ServiceUuid: "6E400001-B5A3-F393-E0A9-E50E24DCCA9E",
    CharacteristicUuidRx: "6E400002-B5A3-F393-E0A9-E50E24DCCA9E",
    CharacteristicUuidTx: "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"
  };
  static DataTypes = {
    Dev: 65535
    // developer namespace for experimenting with group/channel datagrams and building apps
  };
  static StatsTypes = {
    Core: 0,
    Radio: 1,
    Packets: 2
  };
  static CommandCodes = {
    AppStart: 1,
    SendTxtMsg: 2,
    SendChannelTxtMsg: 3,
    GetContacts: 4,
    GetDeviceTime: 5,
    SetDeviceTime: 6,
    SendSelfAdvert: 7,
    SetAdvertName: 8,
    AddUpdateContact: 9,
    SyncNextMessage: 10,
    SetRadioParams: 11,
    SetTxPower: 12,
    ResetPath: 13,
    SetAdvertLatLon: 14,
    RemoveContact: 15,
    ShareContact: 16,
    ExportContact: 17,
    ImportContact: 18,
    Reboot: 19,
    GetBatteryVoltage: 20,
    SetTuningParams: 21,
    // todo
    DeviceQuery: 22,
    ExportPrivateKey: 23,
    ImportPrivateKey: 24,
    SendRawData: 25,
    SendLogin: 26,
    // todo
    SendStatusReq: 27,
    // todo
    GetChannel: 31,
    SetChannel: 32,
    SignStart: 33,
    SignData: 34,
    SignFinish: 35,
    SendTracePath: 36,
    // todo set device pin command
    SetOtherParams: 38,
    SendTelemetryReq: 39,
    SendBinaryReq: 50,
    SetFloodScope: 54,
    GetStats: 56,
    SendChannelData: 62
  };
  static ResponseCodes = {
    Ok: 0,
    // todo
    Err: 1,
    // todo
    ContactsStart: 2,
    Contact: 3,
    EndOfContacts: 4,
    SelfInfo: 5,
    Sent: 6,
    ContactMsgRecv: 7,
    ChannelMsgRecv: 8,
    CurrTime: 9,
    NoMoreMessages: 10,
    ExportContact: 11,
    BatteryVoltage: 12,
    DeviceInfo: 13,
    PrivateKey: 14,
    Disabled: 15,
    ContactMsgRecvV3: 16,
    ChannelMsgRecvV3: 17,
    ChannelInfo: 18,
    SignStart: 19,
    Signature: 20,
    Stats: 24,
    ChannelDataRecv: 27
  };
  static PushCodes = {
    Advert: 128,
    // when companion is set to auto add contacts
    PathUpdated: 129,
    SendConfirmed: 130,
    MsgWaiting: 131,
    RawData: 132,
    LoginSuccess: 133,
    LoginFail: 134,
    // not usable yet
    StatusResponse: 135,
    LogRxData: 136,
    TraceData: 137,
    NewAdvert: 138,
    // when companion is set to manually add contacts
    TelemetryResponse: 139,
    BinaryResponse: 140,
    ControlData: 142
  };
  static ErrorCodes = {
    UnsupportedCmd: 1,
    NotFound: 2,
    TableFull: 3,
    BadState: 4,
    FileIoError: 5,
    IllegalArg: 6
  };
  static AdvType = {
    None: 0,
    Chat: 1,
    Repeater: 2,
    Room: 3
  };
  static SelfAdvertTypes = {
    ZeroHop: 0,
    Flood: 1
  };
  static TxtTypes = {
    Plain: 0,
    CliData: 1,
    SignedPlain: 2
  };
  static BinaryRequestTypes = {
    GetTelemetryData: 3,
    // #define REQ_TYPE_GET_TELEMETRY_DATA 0x03
    GetAvgMinMax: 4,
    // #define REQ_TYPE_GET_AVG_MIN_MAX 0x04
    GetAccessList: 5,
    // #define REQ_TYPE_GET_ACCESS_LIST 0x05
    GetNeighbours: 6
    // #define REQ_TYPE_GET_NEIGHBOURS 0x06
  };
};
var constants_default = Constants;

// node_modules/@liamcottle/meshcore.js/src/buffer_writer.js
var BufferWriter = class {
  constructor() {
    this.buffer = [];
  }
  toBytes() {
    return new Uint8Array(this.buffer);
  }
  writeBytes(bytes) {
    this.buffer = [
      ...this.buffer,
      ...bytes
    ];
  }
  writeByte(byte) {
    this.writeBytes([
      byte
    ]);
  }
  writeUInt16LE(num) {
    const bytes = new Uint8Array(2);
    const view = new DataView(bytes.buffer);
    view.setUint16(0, num, true);
    this.writeBytes(bytes);
  }
  writeUInt32LE(num) {
    const bytes = new Uint8Array(4);
    const view = new DataView(bytes.buffer);
    view.setUint32(0, num, true);
    this.writeBytes(bytes);
  }
  writeInt32LE(num) {
    const bytes = new Uint8Array(4);
    const view = new DataView(bytes.buffer);
    view.setInt32(0, num, true);
    this.writeBytes(bytes);
  }
  writeString(string) {
    this.writeBytes(new TextEncoder().encode(string));
  }
  writeCString(string, maxLength) {
    const bytes = new Uint8Array(new ArrayBuffer(maxLength));
    const encodedString = new TextEncoder().encode(string);
    for (var i = 0; i < maxLength && i < encodedString.length; i++) {
      bytes[i] = encodedString[i];
    }
    bytes[bytes.length - 1] = 0;
    this.writeBytes(bytes);
  }
};
var buffer_writer_default = BufferWriter;

// node_modules/@liamcottle/meshcore.js/src/buffer_reader.js
var BufferReader = class {
  constructor(data) {
    this.pointer = 0;
    this.buffer = new Uint8Array(data);
  }
  getRemainingBytesCount() {
    return this.buffer.length - this.pointer;
  }
  readByte() {
    return this.readBytes(1)[0];
  }
  readBytes(count) {
    const data = this.buffer.slice(this.pointer, this.pointer + count);
    this.pointer += count;
    return data;
  }
  readRemainingBytes() {
    return this.readBytes(this.getRemainingBytesCount());
  }
  readString() {
    return new TextDecoder().decode(this.readRemainingBytes());
  }
  readCString(maxLength) {
    const value = [];
    const bytes = this.readBytes(maxLength);
    for (const byte of bytes) {
      if (byte === 0) {
        return new TextDecoder().decode(new Uint8Array(value));
      }
      value.push(byte);
    }
  }
  readInt8() {
    const bytes = this.readBytes(1);
    const view = new DataView(bytes.buffer);
    return view.getInt8(0);
  }
  readUInt8() {
    const bytes = this.readBytes(1);
    const view = new DataView(bytes.buffer);
    return view.getUint8(0);
  }
  readUInt16LE() {
    const bytes = this.readBytes(2);
    const view = new DataView(bytes.buffer);
    return view.getUint16(0, true);
  }
  readUInt16BE() {
    const bytes = this.readBytes(2);
    const view = new DataView(bytes.buffer);
    return view.getUint16(0, false);
  }
  readUInt32LE() {
    const bytes = this.readBytes(4);
    const view = new DataView(bytes.buffer);
    return view.getUint32(0, true);
  }
  readUInt32BE() {
    const bytes = this.readBytes(4);
    const view = new DataView(bytes.buffer);
    return view.getUint32(0, false);
  }
  readInt16LE() {
    const bytes = this.readBytes(2);
    const view = new DataView(bytes.buffer);
    return view.getInt16(0, true);
  }
  readInt16BE() {
    const bytes = this.readBytes(2);
    const view = new DataView(bytes.buffer);
    return view.getInt16(0, false);
  }
  readInt32LE() {
    const bytes = this.readBytes(4);
    const view = new DataView(bytes.buffer);
    return view.getInt32(0, true);
  }
  readInt24BE() {
    var value = this.readByte() << 16 | this.readByte() << 8 | this.readByte();
    if ((value & 8388608) !== 0) {
      value -= 16777216;
    }
    return value;
  }
};
var buffer_reader_default = BufferReader;

// node_modules/@liamcottle/meshcore.js/src/events.js
var EventEmitter = class {
  constructor() {
    this.eventListenersMap = /* @__PURE__ */ new Map();
  }
  on(event, callback) {
    if (!this.eventListenersMap.has(event)) {
      this.eventListenersMap.set(event, []);
    }
    this.eventListenersMap.get(event).push(callback);
  }
  off(event, callback) {
    if (this.eventListenersMap.has(event)) {
      const callbacks = this.eventListenersMap.get(event).filter((cb) => cb !== callback);
      this.eventListenersMap.set(event, callbacks);
    }
  }
  once(event, callback) {
    const internalCallback = (...data) => {
      this.off(event, internalCallback);
      setTimeout(() => callback(...data), 0);
    };
    this.on(event, internalCallback);
  }
  emit(event, ...data) {
    if (this.eventListenersMap.has(event)) {
      for (const eventListener of this.eventListenersMap.get(event)) {
        setTimeout(() => eventListener(...data), 0);
      }
    }
  }
};
var events_default = EventEmitter;

// node_modules/@liamcottle/meshcore.js/src/buffer_utils.js
var BufferUtils = class {
  static bytesToHex(uint8Array) {
    return Array.from(uint8Array).map((byte) => {
      return byte.toString(16).padStart(2, "0");
    }).join("");
  }
  static hexToBytes(hex) {
    return Uint8Array.from(hex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
  }
  static base64ToBytes(base64) {
    return Uint8Array.from(atob(base64), (c) => {
      return c.charCodeAt(0);
    });
  }
  static areBuffersEqual(byteArray1, byteArray2) {
    if (byteArray1.length !== byteArray2.length) {
      return false;
    }
    for (let i = 0; i < byteArray1.length; i++) {
      if (byteArray1[i] !== byteArray2[i]) {
        return false;
      }
    }
    return true;
  }
};
var buffer_utils_default = BufferUtils;

// node_modules/@liamcottle/meshcore.js/src/random_utils.js
var RandomUtils = class {
  static getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
};
var random_utils_default = RandomUtils;

// node_modules/@liamcottle/meshcore.js/src/connection/connection.js
var Connection = class extends events_default {
  async onConnected() {
    try {
      await this.deviceQuery(constants_default.SupportedCompanionProtocolVersion);
    } catch (e) {
    }
    this.emit("connected");
  }
  onDisconnected() {
    this.emit("disconnected");
  }
  async close() {
    throw new Error("This method must be implemented by the subclass.");
  }
  async sendToRadioFrame(data) {
    throw new Error("This method must be implemented by the subclass.");
  }
  async sendCommandAppStart() {
    const data = new buffer_writer_default();
    data.writeByte(constants_default.CommandCodes.AppStart);
    data.writeByte(1);
    data.writeBytes(new Uint8Array(6));
    data.writeString("test");
    await this.sendToRadioFrame(data.toBytes());
  }
  async sendCommandSendTxtMsg(txtType, attempt, senderTimestamp, pubKeyPrefix, text) {
    const data = new buffer_writer_default();
    data.writeByte(constants_default.CommandCodes.SendTxtMsg);
    data.writeByte(txtType);
    data.writeByte(attempt);
    data.writeUInt32LE(senderTimestamp);
    data.writeBytes(pubKeyPrefix.slice(0, 6));
    data.writeString(text);
    await this.sendToRadioFrame(data.toBytes());
  }
  async sendCommandSendChannelTxtMsg(txtType, channelIdx, senderTimestamp, text) {
    const data = new buffer_writer_default();
    data.writeByte(constants_default.CommandCodes.SendChannelTxtMsg);
    data.writeByte(txtType);
    data.writeByte(channelIdx);
    data.writeUInt32LE(senderTimestamp);
    data.writeString(text);
    await this.sendToRadioFrame(data.toBytes());
  }
  async sendCommandGetContacts(since) {
    const data = new buffer_writer_default();
    data.writeByte(constants_default.CommandCodes.GetContacts);
    if (since) {
      data.writeUInt32LE(since);
    }
    await this.sendToRadioFrame(data.toBytes());
  }
  async sendCommandGetDeviceTime() {
    const data = new buffer_writer_default();
    data.writeByte(constants_default.CommandCodes.GetDeviceTime);
    await this.sendToRadioFrame(data.toBytes());
  }
  async sendCommandSetDeviceTime(epochSecs) {
    const data = new buffer_writer_default();
    data.writeByte(constants_default.CommandCodes.SetDeviceTime);
    data.writeUInt32LE(epochSecs);
    await this.sendToRadioFrame(data.toBytes());
  }
  async sendCommandSendSelfAdvert(type) {
    const data = new buffer_writer_default();
    data.writeByte(constants_default.CommandCodes.SendSelfAdvert);
    data.writeByte(type);
    await this.sendToRadioFrame(data.toBytes());
  }
  async sendCommandSetAdvertName(name) {
    const data = new buffer_writer_default();
    data.writeByte(constants_default.CommandCodes.SetAdvertName);
    data.writeString(name);
    await this.sendToRadioFrame(data.toBytes());
  }
  async sendCommandAddUpdateContact(publicKey, type, flags, outPathLen, outPath, advName, lastAdvert, advLat, advLon) {
    const data = new buffer_writer_default();
    data.writeByte(constants_default.CommandCodes.AddUpdateContact);
    data.writeBytes(publicKey);
    data.writeByte(type);
    data.writeByte(flags);
    data.writeByte(outPathLen);
    data.writeBytes(outPath);
    data.writeCString(advName, 32);
    data.writeUInt32LE(lastAdvert);
    data.writeInt32LE(advLat);
    data.writeInt32LE(advLon);
    await this.sendToRadioFrame(data.toBytes());
  }
  async sendCommandSyncNextMessage() {
    const data = new buffer_writer_default();
    data.writeByte(constants_default.CommandCodes.SyncNextMessage);
    await this.sendToRadioFrame(data.toBytes());
  }
  async sendCommandSetRadioParams(radioFreq, radioBw, radioSf, radioCr) {
    const data = new buffer_writer_default();
    data.writeByte(constants_default.CommandCodes.SetRadioParams);
    data.writeUInt32LE(radioFreq);
    data.writeUInt32LE(radioBw);
    data.writeByte(radioSf);
    data.writeByte(radioCr);
    await this.sendToRadioFrame(data.toBytes());
  }
  async sendCommandSetTxPower(txPower) {
    const data = new buffer_writer_default();
    data.writeByte(constants_default.CommandCodes.SetTxPower);
    data.writeByte(txPower);
    await this.sendToRadioFrame(data.toBytes());
  }
  async sendCommandResetPath(pubKey) {
    const data = new buffer_writer_default();
    data.writeByte(constants_default.CommandCodes.ResetPath);
    data.writeBytes(pubKey);
    await this.sendToRadioFrame(data.toBytes());
  }
  async sendCommandSetAdvertLatLon(lat, lon) {
    const data = new buffer_writer_default();
    data.writeByte(constants_default.CommandCodes.SetAdvertLatLon);
    data.writeInt32LE(lat);
    data.writeInt32LE(lon);
    await this.sendToRadioFrame(data.toBytes());
  }
  async sendCommandRemoveContact(pubKey) {
    const data = new buffer_writer_default();
    data.writeByte(constants_default.CommandCodes.RemoveContact);
    data.writeBytes(pubKey);
    await this.sendToRadioFrame(data.toBytes());
  }
  async sendCommandShareContact(pubKey) {
    const data = new buffer_writer_default();
    data.writeByte(constants_default.CommandCodes.ShareContact);
    data.writeBytes(pubKey);
    await this.sendToRadioFrame(data.toBytes());
  }
  // provide a public key to export that contact
  // not providing a public key will export local identity as a contact instead
  async sendCommandExportContact(pubKey = null) {
    const data = new buffer_writer_default();
    data.writeByte(constants_default.CommandCodes.ExportContact);
    if (pubKey) {
      data.writeBytes(pubKey);
    }
    await this.sendToRadioFrame(data.toBytes());
  }
  async sendCommandImportContact(advertPacketBytes) {
    const data = new buffer_writer_default();
    data.writeByte(constants_default.CommandCodes.ImportContact);
    data.writeBytes(advertPacketBytes);
    await this.sendToRadioFrame(data.toBytes());
  }
  async sendCommandReboot() {
    const data = new buffer_writer_default();
    data.writeByte(constants_default.CommandCodes.Reboot);
    data.writeString("reboot");
    await this.sendToRadioFrame(data.toBytes());
  }
  async sendCommandGetBatteryVoltage() {
    const data = new buffer_writer_default();
    data.writeByte(constants_default.CommandCodes.GetBatteryVoltage);
    await this.sendToRadioFrame(data.toBytes());
  }
  async sendCommandDeviceQuery(appTargetVer) {
    const data = new buffer_writer_default();
    data.writeByte(constants_default.CommandCodes.DeviceQuery);
    data.writeByte(appTargetVer);
    await this.sendToRadioFrame(data.toBytes());
  }
  async sendCommandExportPrivateKey() {
    const data = new buffer_writer_default();
    data.writeByte(constants_default.CommandCodes.ExportPrivateKey);
    await this.sendToRadioFrame(data.toBytes());
  }
  async sendCommandImportPrivateKey(privateKey) {
    const data = new buffer_writer_default();
    data.writeByte(constants_default.CommandCodes.ImportPrivateKey);
    data.writeBytes(privateKey);
    await this.sendToRadioFrame(data.toBytes());
  }
  async sendCommandSendRawData(pathLen, path, rawData) {
    const data = new buffer_writer_default();
    data.writeByte(constants_default.CommandCodes.SendRawData);
    data.writeByte(pathLen);
    data.writeBytes(path);
    data.writeBytes(rawData);
    await this.sendToRadioFrame(data.toBytes());
  }
  async sendCommandSendLogin(publicKey, password) {
    const data = new buffer_writer_default();
    data.writeByte(constants_default.CommandCodes.SendLogin);
    data.writeBytes(publicKey);
    data.writeString(password);
    await this.sendToRadioFrame(data.toBytes());
  }
  async sendCommandSendStatusReq(publicKey) {
    const data = new buffer_writer_default();
    data.writeByte(constants_default.CommandCodes.SendStatusReq);
    data.writeBytes(publicKey);
    await this.sendToRadioFrame(data.toBytes());
  }
  async sendCommandSendTelemetryReq(publicKey) {
    const data = new buffer_writer_default();
    data.writeByte(constants_default.CommandCodes.SendTelemetryReq);
    data.writeByte(0);
    data.writeByte(0);
    data.writeByte(0);
    data.writeBytes(publicKey);
    await this.sendToRadioFrame(data.toBytes());
  }
  async sendCommandSendBinaryReq(publicKey, requestCodeAndParams) {
    const data = new buffer_writer_default();
    data.writeByte(constants_default.CommandCodes.SendBinaryReq);
    data.writeBytes(publicKey);
    data.writeBytes(requestCodeAndParams);
    await this.sendToRadioFrame(data.toBytes());
  }
  async sendCommandSetFloodScope(transportKey) {
    const data = new buffer_writer_default();
    data.writeByte(constants_default.CommandCodes.SetFloodScope);
    data.writeByte(0);
    data.writeBytes(transportKey);
    await this.sendToRadioFrame(data.toBytes());
  }
  async sendCommandGetStats(statsType) {
    const data = new buffer_writer_default();
    data.writeByte(constants_default.CommandCodes.GetStats);
    data.writeByte(statsType);
    await this.sendToRadioFrame(data.toBytes());
  }
  async sendCommandSendChannelData(channelIdx, pathLen, path, dataType, payload) {
    const data = new buffer_writer_default();
    data.writeByte(constants_default.CommandCodes.SendChannelData);
    data.writeByte(channelIdx);
    data.writeByte(pathLen);
    data.writeBytes(path);
    data.writeUInt16LE(dataType);
    data.writeBytes(payload);
    await this.sendToRadioFrame(data.toBytes());
  }
  async sendCommandGetChannel(channelIdx) {
    const data = new buffer_writer_default();
    data.writeByte(constants_default.CommandCodes.GetChannel);
    data.writeByte(channelIdx);
    await this.sendToRadioFrame(data.toBytes());
  }
  async sendCommandSetChannel(channelIdx, name, secret) {
    const data = new buffer_writer_default();
    data.writeByte(constants_default.CommandCodes.SetChannel);
    data.writeByte(channelIdx);
    data.writeCString(name, 32);
    data.writeBytes(secret);
    await this.sendToRadioFrame(data.toBytes());
  }
  async sendCommandSignStart() {
    const data = new buffer_writer_default();
    data.writeByte(constants_default.CommandCodes.SignStart);
    await this.sendToRadioFrame(data.toBytes());
  }
  async sendCommandSignData(dataToSign) {
    const data = new buffer_writer_default();
    data.writeByte(constants_default.CommandCodes.SignData);
    data.writeBytes(dataToSign);
    await this.sendToRadioFrame(data.toBytes());
  }
  async sendCommandSignFinish() {
    const data = new buffer_writer_default();
    data.writeByte(constants_default.CommandCodes.SignFinish);
    await this.sendToRadioFrame(data.toBytes());
  }
  async sendCommandSendTracePath(tag, auth, path) {
    const data = new buffer_writer_default();
    data.writeByte(constants_default.CommandCodes.SendTracePath);
    data.writeUInt32LE(tag);
    data.writeUInt32LE(auth);
    data.writeByte(0);
    data.writeBytes(path);
    await this.sendToRadioFrame(data.toBytes());
  }
  async sendCommandSetOtherParams(manualAddContacts) {
    const data = new buffer_writer_default();
    data.writeByte(constants_default.CommandCodes.SetOtherParams);
    data.writeByte(manualAddContacts);
    await this.sendToRadioFrame(data.toBytes());
  }
  onFrameReceived(frame) {
    this.emit("rx", frame);
    const bufferReader = new buffer_reader_default(frame);
    const responseCode = bufferReader.readByte();
    if (responseCode === constants_default.ResponseCodes.Ok) {
      this.onOkResponse(bufferReader);
    } else if (responseCode === constants_default.ResponseCodes.Err) {
      this.onErrResponse(bufferReader);
    } else if (responseCode === constants_default.ResponseCodes.SelfInfo) {
      this.onSelfInfoResponse(bufferReader);
    } else if (responseCode === constants_default.ResponseCodes.CurrTime) {
      this.onCurrTimeResponse(bufferReader);
    } else if (responseCode === constants_default.ResponseCodes.NoMoreMessages) {
      this.onNoMoreMessagesResponse(bufferReader);
    } else if (responseCode === constants_default.ResponseCodes.ContactMsgRecv) {
      this.onContactMsgRecvResponse(bufferReader, false);
    } else if (responseCode === constants_default.ResponseCodes.ChannelMsgRecv) {
      this.onChannelMsgRecvResponse(bufferReader, false);
    } else if (responseCode === constants_default.ResponseCodes.ContactsStart) {
      this.onContactsStartResponse(bufferReader);
    } else if (responseCode === constants_default.ResponseCodes.Contact) {
      this.onContactResponse(bufferReader);
    } else if (responseCode === constants_default.ResponseCodes.EndOfContacts) {
      this.onEndOfContactsResponse(bufferReader);
    } else if (responseCode === constants_default.ResponseCodes.Sent) {
      this.onSentResponse(bufferReader);
    } else if (responseCode === constants_default.ResponseCodes.ExportContact) {
      this.onExportContactResponse(bufferReader);
    } else if (responseCode === constants_default.ResponseCodes.BatteryVoltage) {
      this.onBatteryVoltageResponse(bufferReader);
    } else if (responseCode === constants_default.ResponseCodes.DeviceInfo) {
      this.onDeviceInfoResponse(bufferReader);
    } else if (responseCode === constants_default.ResponseCodes.PrivateKey) {
      this.onPrivateKeyResponse(bufferReader);
    } else if (responseCode === constants_default.ResponseCodes.Disabled) {
      this.onDisabledResponse(bufferReader);
    } else if (responseCode === constants_default.ResponseCodes.ContactMsgRecvV3) {
      this.onContactMsgRecvResponse(bufferReader, true);
    } else if (responseCode === constants_default.ResponseCodes.ChannelMsgRecvV3) {
      this.onChannelMsgRecvResponse(bufferReader, true);
    } else if (responseCode === constants_default.ResponseCodes.ChannelInfo) {
      this.onChannelInfoResponse(bufferReader);
    } else if (responseCode === constants_default.ResponseCodes.SignStart) {
      this.onSignStartResponse(bufferReader);
    } else if (responseCode === constants_default.ResponseCodes.Signature) {
      this.onSignatureResponse(bufferReader);
    } else if (responseCode === constants_default.ResponseCodes.Stats) {
      this.onStatsResponse(bufferReader);
    } else if (responseCode === constants_default.ResponseCodes.ChannelDataRecv) {
      this.onChannelDataRecvResponse(bufferReader);
    } else if (responseCode === constants_default.PushCodes.Advert) {
      this.onAdvertPush(bufferReader);
    } else if (responseCode === constants_default.PushCodes.PathUpdated) {
      this.onPathUpdatedPush(bufferReader);
    } else if (responseCode === constants_default.PushCodes.SendConfirmed) {
      this.onSendConfirmedPush(bufferReader);
    } else if (responseCode === constants_default.PushCodes.MsgWaiting) {
      this.onMsgWaitingPush(bufferReader);
    } else if (responseCode === constants_default.PushCodes.RawData) {
      this.onRawDataPush(bufferReader);
    } else if (responseCode === constants_default.PushCodes.LoginSuccess) {
      this.onLoginSuccessPush(bufferReader);
    } else if (responseCode === constants_default.PushCodes.StatusResponse) {
      this.onStatusResponsePush(bufferReader);
    } else if (responseCode === constants_default.PushCodes.LogRxData) {
      this.onLogRxDataPush(bufferReader);
    } else if (responseCode === constants_default.PushCodes.TelemetryResponse) {
      this.onTelemetryResponsePush(bufferReader);
    } else if (responseCode === constants_default.PushCodes.TraceData) {
      this.onTraceDataPush(bufferReader);
    } else if (responseCode === constants_default.PushCodes.NewAdvert) {
      this.onNewAdvertPush(bufferReader);
    } else if (responseCode === constants_default.PushCodes.BinaryResponse) {
      this.onBinaryResponsePush(bufferReader);
    } else if (responseCode === constants_default.PushCodes.ControlData) {
      this.onControlDataPush(bufferReader);
    } else {
      console.log(`unhandled frame: code=${responseCode}`, frame);
    }
  }
  onAdvertPush(bufferReader) {
    this.emit(constants_default.PushCodes.Advert, {
      publicKey: bufferReader.readBytes(32)
    });
  }
  onPathUpdatedPush(bufferReader) {
    this.emit(constants_default.PushCodes.PathUpdated, {
      publicKey: bufferReader.readBytes(32)
    });
  }
  onSendConfirmedPush(bufferReader) {
    this.emit(constants_default.PushCodes.SendConfirmed, {
      ackCode: bufferReader.readUInt32LE(),
      roundTrip: bufferReader.readUInt32LE()
    });
  }
  onMsgWaitingPush(bufferReader) {
    this.emit(constants_default.PushCodes.MsgWaiting, {});
  }
  onRawDataPush(bufferReader) {
    this.emit(constants_default.PushCodes.RawData, {
      lastSnr: bufferReader.readInt8() / 4,
      lastRssi: bufferReader.readInt8(),
      reserved: bufferReader.readByte(),
      payload: bufferReader.readRemainingBytes()
    });
  }
  onLoginSuccessPush(bufferReader) {
    this.emit(constants_default.PushCodes.LoginSuccess, {
      reserved: bufferReader.readByte(),
      // reserved
      pubKeyPrefix: bufferReader.readBytes(6)
      // 6 bytes of public key this login success is from
    });
  }
  onStatusResponsePush(bufferReader) {
    this.emit(constants_default.PushCodes.StatusResponse, {
      reserved: bufferReader.readByte(),
      // reserved
      pubKeyPrefix: bufferReader.readBytes(6),
      // 6 bytes of public key this status response is from
      statusData: bufferReader.readRemainingBytes()
    });
  }
  onLogRxDataPush(bufferReader) {
    this.emit(constants_default.PushCodes.LogRxData, {
      lastSnr: bufferReader.readInt8() / 4,
      lastRssi: bufferReader.readInt8(),
      raw: bufferReader.readRemainingBytes()
    });
  }
  onTelemetryResponsePush(bufferReader) {
    this.emit(constants_default.PushCodes.TelemetryResponse, {
      reserved: bufferReader.readByte(),
      // reserved
      pubKeyPrefix: bufferReader.readBytes(6),
      // 6 bytes of public key this telemetry response is from
      lppSensorData: bufferReader.readRemainingBytes()
    });
  }
  onBinaryResponsePush(bufferReader) {
    this.emit(constants_default.PushCodes.BinaryResponse, {
      reserved: bufferReader.readByte(),
      // reserved
      tag: bufferReader.readUInt32LE(),
      // 4 bytes tag
      responseData: bufferReader.readRemainingBytes()
    });
  }
  onControlDataPush(bufferReader) {
    const lastSnr = bufferReader.readInt8() / 4;
    const lastRssi = bufferReader.readInt8();
    const pathLen = bufferReader.readUInt8();
    const payload = bufferReader.readRemainingBytes();
    this.emit(constants_default.PushCodes.ControlData, {
      lastSnr,
      lastRssi,
      pathLen,
      payload
    });
  }
  onTraceDataPush(bufferReader) {
    const reserved = bufferReader.readByte();
    const pathLen = bufferReader.readUInt8();
    this.emit(constants_default.PushCodes.TraceData, {
      reserved,
      pathLen,
      flags: bufferReader.readUInt8(),
      tag: bufferReader.readUInt32LE(),
      authCode: bufferReader.readUInt32LE(),
      pathHashes: bufferReader.readBytes(pathLen),
      pathSnrs: bufferReader.readBytes(pathLen),
      lastSnr: bufferReader.readInt8() / 4
    });
  }
  onNewAdvertPush(bufferReader) {
    this.emit(constants_default.PushCodes.NewAdvert, {
      publicKey: bufferReader.readBytes(32),
      type: bufferReader.readByte(),
      flags: bufferReader.readByte(),
      outPathLen: bufferReader.readInt8(),
      outPath: bufferReader.readBytes(64),
      advName: bufferReader.readCString(32),
      lastAdvert: bufferReader.readUInt32LE(),
      advLat: bufferReader.readInt32LE(),
      advLon: bufferReader.readInt32LE(),
      lastMod: bufferReader.readUInt32LE()
    });
  }
  onOkResponse(bufferReader) {
    this.emit(constants_default.ResponseCodes.Ok, {});
  }
  onErrResponse(bufferReader) {
    const errCode = bufferReader.getRemainingBytesCount() > 0 ? bufferReader.readByte() : null;
    this.emit(constants_default.ResponseCodes.Err, {
      errCode
    });
  }
  onContactsStartResponse(bufferReader) {
    this.emit(constants_default.ResponseCodes.ContactsStart, {
      count: bufferReader.readUInt32LE()
    });
  }
  onContactResponse(bufferReader) {
    this.emit(constants_default.ResponseCodes.Contact, {
      publicKey: bufferReader.readBytes(32),
      type: bufferReader.readByte(),
      flags: bufferReader.readByte(),
      outPathLen: bufferReader.readInt8(),
      outPath: bufferReader.readBytes(64),
      advName: bufferReader.readCString(32),
      lastAdvert: bufferReader.readUInt32LE(),
      advLat: bufferReader.readInt32LE(),
      advLon: bufferReader.readInt32LE(),
      lastMod: bufferReader.readUInt32LE()
    });
  }
  onEndOfContactsResponse(bufferReader) {
    this.emit(constants_default.ResponseCodes.EndOfContacts, {
      mostRecentLastmod: bufferReader.readUInt32LE()
    });
  }
  onSentResponse(bufferReader) {
    this.emit(constants_default.ResponseCodes.Sent, {
      result: bufferReader.readInt8(),
      expectedAckCrc: bufferReader.readUInt32LE(),
      estTimeout: bufferReader.readUInt32LE()
    });
  }
  onExportContactResponse(bufferReader) {
    this.emit(constants_default.ResponseCodes.ExportContact, {
      advertPacketBytes: bufferReader.readRemainingBytes()
    });
  }
  onBatteryVoltageResponse(bufferReader) {
    this.emit(constants_default.ResponseCodes.BatteryVoltage, {
      batteryMilliVolts: bufferReader.readUInt16LE()
    });
  }
  onDeviceInfoResponse(bufferReader) {
    this.emit(constants_default.ResponseCodes.DeviceInfo, {
      firmwareVer: bufferReader.readInt8(),
      reserved: bufferReader.readBytes(6),
      // reserved
      firmware_build_date: bufferReader.readCString(12),
      // eg. "19 Feb 2025"
      manufacturerModel: bufferReader.readString()
      // remainder of frame
    });
  }
  onPrivateKeyResponse(bufferReader) {
    this.emit(constants_default.ResponseCodes.PrivateKey, {
      privateKey: bufferReader.readBytes(64)
    });
  }
  onDisabledResponse(bufferReader) {
    this.emit(constants_default.ResponseCodes.Disabled, {});
  }
  onChannelInfoResponse(bufferReader) {
    const idx = bufferReader.readUInt8();
    const name = bufferReader.readCString(32);
    const remainingBytesLength = bufferReader.getRemainingBytesCount();
    if (remainingBytesLength === 16) {
      this.emit(constants_default.ResponseCodes.ChannelInfo, {
        channelIdx: idx,
        name,
        secret: bufferReader.readBytes(remainingBytesLength)
      });
    } else {
      console.log(`ChannelInfo has unexpected key length: ${remainingBytesLength}`);
    }
  }
  onSignStartResponse(bufferReader) {
    this.emit(constants_default.ResponseCodes.SignStart, {
      reserved: bufferReader.readByte(),
      maxSignDataLen: bufferReader.readUInt32LE()
    });
  }
  onSignatureResponse(bufferReader) {
    this.emit(constants_default.ResponseCodes.Signature, {
      signature: bufferReader.readBytes(64)
    });
  }
  onStatsResponse(bufferReader) {
    const type = bufferReader.readUInt8();
    const raw = bufferReader.readRemainingBytes();
    const rawBufferReader = new buffer_reader_default(raw);
    var data = {};
    if (type === constants_default.StatsTypes.Core) {
      data = {
        batteryMilliVolts: rawBufferReader.readUInt16LE(),
        uptimeSecs: rawBufferReader.readUInt32LE(),
        errors: rawBufferReader.readUInt16LE(),
        queueLen: rawBufferReader.readUInt8()
      };
    } else if (type === constants_default.StatsTypes.Radio) {
      data = {
        noiseFloor: rawBufferReader.readInt16LE(),
        lastRssi: rawBufferReader.readInt8(),
        lastSnr: rawBufferReader.readInt8() / 4,
        txAirSecs: rawBufferReader.readUInt32LE(),
        rxAirSecs: rawBufferReader.readUInt32LE()
      };
    } else if (type === constants_default.StatsTypes.Packets) {
      data = {
        recv: rawBufferReader.readUInt32LE(),
        sent: rawBufferReader.readUInt32LE(),
        nSentFlood: rawBufferReader.readUInt32LE(),
        nSentDirect: rawBufferReader.readUInt32LE(),
        nRecvFlood: rawBufferReader.readUInt32LE(),
        nRecvDirect: rawBufferReader.readUInt32LE(),
        nRecvErrors: rawBufferReader.getRemainingBytesCount() >= 4 ? rawBufferReader.readUInt32LE() : null
      };
    }
    this.emit(constants_default.ResponseCodes.Stats, {
      type,
      raw,
      data
    });
  }
  onChannelDataRecvResponse(bufferReader) {
    const snr = bufferReader.readInt8() / 4;
    const reserved1 = bufferReader.readByte();
    const reserved2 = bufferReader.readByte();
    const channelIdx = bufferReader.readInt8();
    const pathLen = bufferReader.readByte();
    const dataType = bufferReader.readUInt16LE();
    const dataLen = bufferReader.readUInt8();
    const data = bufferReader.readBytes(dataLen);
    this.emit(constants_default.ResponseCodes.ChannelDataRecv, {
      snr,
      reserved1,
      reserved2,
      channelIdx,
      pathLen,
      dataType,
      dataLen,
      data
    });
  }
  onSelfInfoResponse(bufferReader) {
    this.emit(constants_default.ResponseCodes.SelfInfo, {
      type: bufferReader.readByte(),
      txPower: bufferReader.readByte(),
      maxTxPower: bufferReader.readByte(),
      publicKey: bufferReader.readBytes(32),
      advLat: bufferReader.readInt32LE(),
      advLon: bufferReader.readInt32LE(),
      reserved: bufferReader.readBytes(3),
      manualAddContacts: bufferReader.readByte(),
      radioFreq: bufferReader.readUInt32LE(),
      radioBw: bufferReader.readUInt32LE(),
      radioSf: bufferReader.readByte(),
      radioCr: bufferReader.readByte(),
      name: bufferReader.readString()
    });
  }
  onCurrTimeResponse(bufferReader) {
    this.emit(constants_default.ResponseCodes.CurrTime, {
      epochSecs: bufferReader.readUInt32LE()
    });
  }
  onNoMoreMessagesResponse(bufferReader) {
    this.emit(constants_default.ResponseCodes.NoMoreMessages, {});
  }
  onContactMsgRecvResponse(bufferReader, isV3) {
    var snr = null;
    if (isV3) {
      snr = bufferReader.readInt8() / 4;
      var reserved1 = bufferReader.readByte();
      var reserved2 = bufferReader.readByte();
    }
    this.emit(constants_default.ResponseCodes.ContactMsgRecv, {
      pubKeyPrefix: bufferReader.readBytes(6),
      pathLen: bufferReader.readByte(),
      txtType: bufferReader.readByte(),
      senderTimestamp: bufferReader.readUInt32LE(),
      text: bufferReader.readString(),
      snr
    });
  }
  onChannelMsgRecvResponse(bufferReader, isV3) {
    var snr = null;
    if (isV3) {
      snr = bufferReader.readInt8() / 4;
      var reserved1 = bufferReader.readByte();
      var reserved2 = bufferReader.readByte();
    }
    this.emit(constants_default.ResponseCodes.ChannelMsgRecv, {
      channelIdx: bufferReader.readInt8(),
      // reserved (0 for now, ie. 'public')
      pathLen: bufferReader.readByte(),
      // 0xFF if was sent direct, otherwise hop count for flood-mode
      txtType: bufferReader.readByte(),
      senderTimestamp: bufferReader.readUInt32LE(),
      text: bufferReader.readString(),
      snr
    });
  }
  getSelfInfo(timeoutMillis = null) {
    return new Promise(async (resolve, reject) => {
      this.once(constants_default.ResponseCodes.SelfInfo, (selfInfo) => {
        resolve(selfInfo);
      });
      if (timeoutMillis != null) {
        setTimeout(reject, timeoutMillis);
      }
      await this.sendCommandAppStart();
    });
  }
  async sendAdvert(type) {
    return new Promise(async (resolve, reject) => {
      try {
        const onOk = () => {
          this.off(constants_default.ResponseCodes.Ok, onOk);
          this.off(constants_default.ResponseCodes.Err, onErr);
          resolve();
        };
        const onErr = () => {
          this.off(constants_default.ResponseCodes.Ok, onOk);
          this.off(constants_default.ResponseCodes.Err, onErr);
          reject();
        };
        this.once(constants_default.ResponseCodes.Ok, onOk);
        this.once(constants_default.ResponseCodes.Err, onErr);
        await this.sendCommandSendSelfAdvert(type);
      } catch (e) {
        reject(e);
      }
    });
  }
  async sendFloodAdvert() {
    return await this.sendAdvert(constants_default.SelfAdvertTypes.Flood);
  }
  async sendZeroHopAdvert() {
    return await this.sendAdvert(constants_default.SelfAdvertTypes.ZeroHop);
  }
  setAdvertName(name) {
    return new Promise(async (resolve, reject) => {
      try {
        const onOk = () => {
          this.off(constants_default.ResponseCodes.Ok, onOk);
          this.off(constants_default.ResponseCodes.Err, onErr);
          resolve();
        };
        const onErr = () => {
          this.off(constants_default.ResponseCodes.Ok, onOk);
          this.off(constants_default.ResponseCodes.Err, onErr);
          reject();
        };
        this.once(constants_default.ResponseCodes.Ok, onOk);
        this.once(constants_default.ResponseCodes.Err, onErr);
        await this.sendCommandSetAdvertName(name);
      } catch (e) {
        reject(e);
      }
    });
  }
  setAdvertLatLong(latitude, longitude) {
    return new Promise(async (resolve, reject) => {
      try {
        const onOk = () => {
          this.off(constants_default.ResponseCodes.Ok, onOk);
          this.off(constants_default.ResponseCodes.Err, onErr);
          resolve();
        };
        const onErr = () => {
          this.off(constants_default.ResponseCodes.Ok, onOk);
          this.off(constants_default.ResponseCodes.Err, onErr);
          reject();
        };
        this.once(constants_default.ResponseCodes.Ok, onOk);
        this.once(constants_default.ResponseCodes.Err, onErr);
        await this.sendCommandSetAdvertLatLon(latitude, longitude);
      } catch (e) {
        reject(e);
      }
    });
  }
  setTxPower(txPower) {
    return new Promise(async (resolve, reject) => {
      try {
        const onOk = () => {
          this.off(constants_default.ResponseCodes.Ok, onOk);
          this.off(constants_default.ResponseCodes.Err, onErr);
          resolve();
        };
        const onErr = () => {
          this.off(constants_default.ResponseCodes.Ok, onOk);
          this.off(constants_default.ResponseCodes.Err, onErr);
          reject();
        };
        this.once(constants_default.ResponseCodes.Ok, onOk);
        this.once(constants_default.ResponseCodes.Err, onErr);
        await this.sendCommandSetTxPower(txPower);
      } catch (e) {
        reject(e);
      }
    });
  }
  setRadioParams(radioFreq, radioBw, radioSf, radioCr) {
    return new Promise(async (resolve, reject) => {
      try {
        const onOk = () => {
          this.off(constants_default.ResponseCodes.Ok, onOk);
          this.off(constants_default.ResponseCodes.Err, onErr);
          resolve();
        };
        const onErr = () => {
          this.off(constants_default.ResponseCodes.Ok, onOk);
          this.off(constants_default.ResponseCodes.Err, onErr);
          reject();
        };
        this.once(constants_default.ResponseCodes.Ok, onOk);
        this.once(constants_default.ResponseCodes.Err, onErr);
        await this.sendCommandSetRadioParams(radioFreq, radioBw, radioSf, radioCr);
      } catch (e) {
        reject(e);
      }
    });
  }
  getContacts() {
    return new Promise(async (resolve, reject) => {
      const contacts = [];
      const onContactReceived = (contact) => {
        contacts.push(contact);
      };
      this.on(constants_default.ResponseCodes.Contact, onContactReceived);
      this.once(constants_default.ResponseCodes.EndOfContacts, () => {
        this.off(constants_default.ResponseCodes.Contact, onContactReceived);
        resolve(contacts);
      });
      await this.sendCommandGetContacts();
    });
  }
  async findContactByName(name) {
    const contacts = await this.getContacts();
    return contacts.find((contact) => {
      return contact.advName === name;
    });
  }
  async findContactByPublicKeyPrefix(pubKeyPrefix) {
    const contacts = await this.getContacts();
    return contacts.find((contact) => {
      const contactPubKeyPrefix = contact.publicKey.subarray(0, pubKeyPrefix.length);
      return buffer_utils_default.areBuffersEqual(pubKeyPrefix, contactPubKeyPrefix);
    });
  }
  sendTextMessage(contactPublicKey, text, type) {
    return new Promise(async (resolve, reject) => {
      try {
        const onSent = (response) => {
          this.off(constants_default.ResponseCodes.Sent, onSent);
          this.off(constants_default.ResponseCodes.Err, onErr);
          resolve(response);
        };
        const onErr = () => {
          this.off(constants_default.ResponseCodes.Sent, onSent);
          this.off(constants_default.ResponseCodes.Err, onErr);
          reject();
        };
        this.once(constants_default.ResponseCodes.Sent, onSent);
        this.once(constants_default.ResponseCodes.Err, onErr);
        const txtType = type ?? constants_default.TxtTypes.Plain;
        const attempt = 0;
        const senderTimestamp = Math.floor(Date.now() / 1e3);
        await this.sendCommandSendTxtMsg(txtType, attempt, senderTimestamp, contactPublicKey, text);
      } catch (e) {
        reject(e);
      }
    });
  }
  sendChannelTextMessage(channelIdx, text) {
    return new Promise(async (resolve, reject) => {
      try {
        const onOk = () => {
          this.off(constants_default.ResponseCodes.Ok, onOk);
          this.off(constants_default.ResponseCodes.Err, onErr);
          resolve();
        };
        const onErr = () => {
          this.off(constants_default.ResponseCodes.Ok, onOk);
          this.off(constants_default.ResponseCodes.Err, onErr);
          reject();
        };
        this.once(constants_default.ResponseCodes.Ok, onOk);
        this.once(constants_default.ResponseCodes.Err, onErr);
        const txtType = constants_default.TxtTypes.Plain;
        const senderTimestamp = Math.floor(Date.now() / 1e3);
        await this.sendCommandSendChannelTxtMsg(txtType, channelIdx, senderTimestamp, text);
      } catch (e) {
        reject(e);
      }
    });
  }
  syncNextMessage() {
    return new Promise(async (resolve, reject) => {
      const onContactMessageReceived = (message) => {
        this.off(constants_default.ResponseCodes.ContactMsgRecv, onContactMessageReceived);
        this.off(constants_default.ResponseCodes.ChannelMsgRecv, onChannelMessageReceived);
        this.off(constants_default.ResponseCodes.ChannelDataRecv, onChannelDataReceived);
        this.off(constants_default.ResponseCodes.NoMoreMessages, onNoMoreMessagesReceived);
        resolve({
          contactMessage: message
        });
      };
      const onChannelMessageReceived = (message) => {
        this.off(constants_default.ResponseCodes.ContactMsgRecv, onContactMessageReceived);
        this.off(constants_default.ResponseCodes.ChannelMsgRecv, onChannelMessageReceived);
        this.off(constants_default.ResponseCodes.ChannelDataRecv, onChannelDataReceived);
        this.off(constants_default.ResponseCodes.NoMoreMessages, onNoMoreMessagesReceived);
        resolve({
          channelMessage: message
        });
      };
      const onChannelDataReceived = (message) => {
        this.off(constants_default.ResponseCodes.ContactMsgRecv, onContactMessageReceived);
        this.off(constants_default.ResponseCodes.ChannelMsgRecv, onChannelMessageReceived);
        this.off(constants_default.ResponseCodes.ChannelDataRecv, onChannelDataReceived);
        this.off(constants_default.ResponseCodes.NoMoreMessages, onNoMoreMessagesReceived);
        resolve({
          channelData: message
        });
      };
      const onNoMoreMessagesReceived = () => {
        this.off(constants_default.ResponseCodes.ContactMsgRecv, onContactMessageReceived);
        this.off(constants_default.ResponseCodes.ChannelMsgRecv, onChannelMessageReceived);
        this.off(constants_default.ResponseCodes.ChannelDataRecv, onChannelDataReceived);
        this.off(constants_default.ResponseCodes.NoMoreMessages, onNoMoreMessagesReceived);
        resolve(null);
      };
      this.once(constants_default.ResponseCodes.ContactMsgRecv, onContactMessageReceived);
      this.once(constants_default.ResponseCodes.ChannelMsgRecv, onChannelMessageReceived);
      this.once(constants_default.ResponseCodes.ChannelDataRecv, onChannelDataReceived);
      this.once(constants_default.ResponseCodes.NoMoreMessages, onNoMoreMessagesReceived);
      await this.sendCommandSyncNextMessage();
    });
  }
  async getWaitingMessages() {
    const waitingMessages = [];
    while (true) {
      const message = await this.syncNextMessage();
      if (!message) {
        break;
      }
      waitingMessages.push(message);
    }
    return waitingMessages;
  }
  getDeviceTime() {
    return new Promise(async (resolve, reject) => {
      try {
        const onCurrTime = (response) => {
          this.off(constants_default.ResponseCodes.CurrTime, onCurrTime);
          this.off(constants_default.ResponseCodes.Err, onErr);
          resolve(response);
        };
        const onErr = () => {
          this.off(constants_default.ResponseCodes.CurrTime, onCurrTime);
          this.off(constants_default.ResponseCodes.Err, onErr);
          reject();
        };
        this.once(constants_default.ResponseCodes.CurrTime, onCurrTime);
        this.once(constants_default.ResponseCodes.Err, onErr);
        await this.sendCommandGetDeviceTime();
      } catch (e) {
        reject(e);
      }
    });
  }
  setDeviceTime(epochSecs) {
    return new Promise(async (resolve, reject) => {
      try {
        const onOk = (response) => {
          this.off(constants_default.ResponseCodes.Ok, onOk);
          this.off(constants_default.ResponseCodes.Err, onErr);
          resolve(response);
        };
        const onErr = () => {
          this.off(constants_default.ResponseCodes.Ok, onOk);
          this.off(constants_default.ResponseCodes.Err, onErr);
          reject();
        };
        this.once(constants_default.ResponseCodes.Ok, onOk);
        this.once(constants_default.ResponseCodes.Err, onErr);
        await this.sendCommandSetDeviceTime(epochSecs);
      } catch (e) {
        reject(e);
      }
    });
  }
  async syncDeviceTime() {
    await this.setDeviceTime(Math.floor(Date.now() / 1e3));
  }
  importContact(advertPacketBytes) {
    return new Promise(async (resolve, reject) => {
      try {
        const onOk = (response) => {
          this.off(constants_default.ResponseCodes.Ok, onOk);
          this.off(constants_default.ResponseCodes.Err, onErr);
          resolve(response);
        };
        const onErr = () => {
          this.off(constants_default.ResponseCodes.Ok, onOk);
          this.off(constants_default.ResponseCodes.Err, onErr);
          reject();
        };
        this.once(constants_default.ResponseCodes.Ok, onOk);
        this.once(constants_default.ResponseCodes.Err, onErr);
        await this.sendCommandImportContact(advertPacketBytes);
      } catch (e) {
        reject(e);
      }
    });
  }
  exportContact(pubKey = null) {
    return new Promise(async (resolve, reject) => {
      try {
        const onExportContact = (response) => {
          this.off(constants_default.ResponseCodes.ExportContact, onExportContact);
          this.off(constants_default.ResponseCodes.Err, onErr);
          resolve(response);
        };
        const onErr = () => {
          this.off(constants_default.ResponseCodes.ExportContact, onExportContact);
          this.off(constants_default.ResponseCodes.Err, onErr);
          reject();
        };
        this.once(constants_default.ResponseCodes.ExportContact, onExportContact);
        this.once(constants_default.ResponseCodes.Err, onErr);
        await this.sendCommandExportContact(pubKey);
      } catch (e) {
        reject(e);
      }
    });
  }
  shareContact(pubKey) {
    return new Promise(async (resolve, reject) => {
      try {
        const onOk = (response) => {
          this.off(constants_default.ResponseCodes.Ok, onOk);
          this.off(constants_default.ResponseCodes.Err, onErr);
          resolve(response);
        };
        const onErr = () => {
          this.off(constants_default.ResponseCodes.Ok, onOk);
          this.off(constants_default.ResponseCodes.Err, onErr);
          reject();
        };
        this.once(constants_default.ResponseCodes.Ok, onOk);
        this.once(constants_default.ResponseCodes.Err, onErr);
        await this.sendCommandShareContact(pubKey);
      } catch (e) {
        reject(e);
      }
    });
  }
  removeContact(pubKey) {
    return new Promise(async (resolve, reject) => {
      try {
        const onOk = () => {
          this.off(constants_default.ResponseCodes.Ok, onOk);
          this.off(constants_default.ResponseCodes.Err, onErr);
          resolve();
        };
        const onErr = () => {
          this.off(constants_default.ResponseCodes.Ok, onOk);
          this.off(constants_default.ResponseCodes.Err, onErr);
          reject();
        };
        this.once(constants_default.ResponseCodes.Ok, onOk);
        this.once(constants_default.ResponseCodes.Err, onErr);
        await this.sendCommandRemoveContact(pubKey);
      } catch (e) {
        reject(e);
      }
    });
  }
  addOrUpdateContact(publicKey, type, flags, outPathLen, outPath, advName, lastAdvert, advLat, advLon) {
    return new Promise(async (resolve, reject) => {
      try {
        const onOk = () => {
          this.off(constants_default.ResponseCodes.Ok, onOk);
          this.off(constants_default.ResponseCodes.Err, onErr);
          resolve();
        };
        const onErr = () => {
          this.off(constants_default.ResponseCodes.Ok, onOk);
          this.off(constants_default.ResponseCodes.Err, onErr);
          reject();
        };
        this.once(constants_default.ResponseCodes.Ok, onOk);
        this.once(constants_default.ResponseCodes.Err, onErr);
        await this.sendCommandAddUpdateContact(publicKey, type, flags, outPathLen, outPath, advName, lastAdvert, advLat, advLon);
      } catch (e) {
        reject(e);
      }
    });
  }
  setContactPath(contact, path) {
    return new Promise(async (resolve, reject) => {
      try {
        const maxPathLength = 64;
        const outPath = new Uint8Array(maxPathLength);
        for (var i = 0; i < path.length && i < maxPathLength; i++) {
          outPath[i] = path[i];
        }
        contact.outPathLen = path.length;
        contact.outPath = outPath;
        return await this.addOrUpdateContact(contact.publicKey, contact.type, contact.flags, contact.outPathLen, contact.outPath, contact.advName, contact.lastAdvert, contact.advLat, contact.advLon);
      } catch (e) {
        reject(e);
      }
    });
  }
  resetPath(pubKey) {
    return new Promise(async (resolve, reject) => {
      try {
        const onOk = () => {
          this.off(constants_default.ResponseCodes.Ok, onOk);
          this.off(constants_default.ResponseCodes.Err, onErr);
          resolve();
        };
        const onErr = () => {
          this.off(constants_default.ResponseCodes.Ok, onOk);
          this.off(constants_default.ResponseCodes.Err, onErr);
          reject();
        };
        this.once(constants_default.ResponseCodes.Ok, onOk);
        this.once(constants_default.ResponseCodes.Err, onErr);
        await this.sendCommandResetPath(pubKey);
      } catch (e) {
        reject(e);
      }
    });
  }
  reboot() {
    return new Promise(async (resolve, reject) => {
      try {
        const onErr = () => {
          this.off(constants_default.ResponseCodes.Err, onErr);
          reject();
        };
        setTimeout(() => {
          this.off(constants_default.ResponseCodes.Err, onErr);
          resolve();
        }, 1e3);
        this.once(constants_default.ResponseCodes.Err, onErr);
        await this.sendCommandReboot();
      } catch (e) {
        reject(e);
      }
    });
  }
  getBatteryVoltage() {
    return new Promise(async (resolve, reject) => {
      try {
        const onBatteryVoltage = (response) => {
          this.off(constants_default.ResponseCodes.BatteryVoltage, onBatteryVoltage);
          this.off(constants_default.ResponseCodes.Err, onErr);
          resolve(response);
        };
        const onErr = () => {
          this.off(constants_default.ResponseCodes.BatteryVoltage, onBatteryVoltage);
          this.off(constants_default.ResponseCodes.Err, onErr);
          reject();
        };
        this.once(constants_default.ResponseCodes.BatteryVoltage, onBatteryVoltage);
        this.once(constants_default.ResponseCodes.Err, onErr);
        await this.sendCommandGetBatteryVoltage();
      } catch (e) {
        reject(e);
      }
    });
  }
  deviceQuery(appTargetVer) {
    return new Promise(async (resolve, reject) => {
      try {
        const onDeviceInfo = (response) => {
          this.off(constants_default.ResponseCodes.DeviceInfo, onDeviceInfo);
          this.off(constants_default.ResponseCodes.Err, onErr);
          resolve(response);
        };
        const onErr = () => {
          this.off(constants_default.ResponseCodes.DeviceInfo, onDeviceInfo);
          this.off(constants_default.ResponseCodes.Err, onErr);
          reject();
        };
        this.once(constants_default.ResponseCodes.DeviceInfo, onDeviceInfo);
        this.once(constants_default.ResponseCodes.Err, onErr);
        await this.sendCommandDeviceQuery(appTargetVer);
      } catch (e) {
        reject(e);
      }
    });
  }
  exportPrivateKey() {
    return new Promise(async (resolve, reject) => {
      try {
        const onPrivateKey = (response) => {
          this.off(constants_default.ResponseCodes.PrivateKey, onPrivateKey);
          this.off(constants_default.ResponseCodes.Err, onErr);
          this.off(constants_default.ResponseCodes.Disabled, onDisabled);
          resolve(response);
        };
        const onErr = () => {
          this.off(constants_default.ResponseCodes.PrivateKey, onPrivateKey);
          this.off(constants_default.ResponseCodes.Err, onErr);
          this.off(constants_default.ResponseCodes.Disabled, onDisabled);
          reject();
        };
        const onDisabled = () => {
          this.off(constants_default.ResponseCodes.PrivateKey, onPrivateKey);
          this.off(constants_default.ResponseCodes.Err, onErr);
          this.off(constants_default.ResponseCodes.Disabled, onDisabled);
          reject("disabled");
        };
        this.once(constants_default.ResponseCodes.PrivateKey, onPrivateKey);
        this.once(constants_default.ResponseCodes.Err, onErr);
        this.once(constants_default.ResponseCodes.Disabled, onDisabled);
        await this.sendCommandExportPrivateKey();
      } catch (e) {
        reject(e);
      }
    });
  }
  importPrivateKey(privateKey) {
    return new Promise(async (resolve, reject) => {
      try {
        const onOk = (response) => {
          this.off(constants_default.ResponseCodes.Ok, onOk);
          this.off(constants_default.ResponseCodes.Err, onErr);
          this.off(constants_default.ResponseCodes.Disabled, onDisabled);
          resolve(response);
        };
        const onErr = () => {
          this.off(constants_default.ResponseCodes.Ok, onOk);
          this.off(constants_default.ResponseCodes.Err, onErr);
          this.off(constants_default.ResponseCodes.Disabled, onDisabled);
          reject();
        };
        const onDisabled = () => {
          this.off(constants_default.ResponseCodes.Ok, onOk);
          this.off(constants_default.ResponseCodes.Err, onErr);
          this.off(constants_default.ResponseCodes.Disabled, onDisabled);
          reject("disabled");
        };
        this.once(constants_default.ResponseCodes.Ok, onOk);
        this.once(constants_default.ResponseCodes.Err, onErr);
        this.once(constants_default.ResponseCodes.Disabled, onDisabled);
        await this.sendCommandImportPrivateKey(privateKey);
      } catch (e) {
        reject(e);
      }
    });
  }
  login(contactPublicKey, password, extraTimeoutMillis = 1e3) {
    return new Promise(async (resolve, reject) => {
      try {
        const publicKeyPrefix = contactPublicKey.subarray(0, 6);
        var timeoutHandler = null;
        const onSent = (response) => {
          this.off(constants_default.ResponseCodes.Err, onErr);
          const estTimeout = response.estTimeout + extraTimeoutMillis;
          timeoutHandler = setTimeout(() => {
            this.off(constants_default.ResponseCodes.Err, onErr);
            this.off(constants_default.ResponseCodes.Sent, onSent);
            this.off(constants_default.PushCodes.LoginSuccess, onLoginSuccess);
            reject("timeout");
          }, estTimeout);
        };
        const onLoginSuccess = (response) => {
          if (!buffer_utils_default.areBuffersEqual(publicKeyPrefix, response.pubKeyPrefix)) {
            console.log("onLoginSuccess is not for this login request, ignoring...");
            return;
          }
          clearTimeout(timeoutHandler);
          this.off(constants_default.ResponseCodes.Err, onErr);
          this.off(constants_default.ResponseCodes.Sent, onSent);
          this.off(constants_default.PushCodes.LoginSuccess, onLoginSuccess);
          resolve(response);
        };
        const onErr = () => {
          clearTimeout(timeoutHandler);
          this.off(constants_default.ResponseCodes.Err, onErr);
          this.off(constants_default.ResponseCodes.Sent, onSent);
          this.off(constants_default.PushCodes.LoginSuccess, onLoginSuccess);
          reject();
        };
        this.once(constants_default.ResponseCodes.Err, onErr);
        this.once(constants_default.ResponseCodes.Sent, onSent);
        this.once(constants_default.PushCodes.LoginSuccess, onLoginSuccess);
        await this.sendCommandSendLogin(contactPublicKey, password);
      } catch (e) {
        reject(e);
      }
    });
  }
  getStatus(contactPublicKey, extraTimeoutMillis = 1e3) {
    return new Promise(async (resolve, reject) => {
      try {
        const publicKeyPrefix = contactPublicKey.subarray(0, 6);
        var timeoutHandler = null;
        const onSent = (response) => {
          this.off(constants_default.ResponseCodes.Err, onErr);
          const estTimeout = response.estTimeout + extraTimeoutMillis;
          timeoutHandler = setTimeout(() => {
            this.off(constants_default.ResponseCodes.Err, onErr);
            this.off(constants_default.ResponseCodes.Sent, onSent);
            this.off(constants_default.PushCodes.StatusResponse, onStatusResponsePush);
            reject("timeout");
          }, estTimeout);
        };
        const onStatusResponsePush = (response) => {
          if (!buffer_utils_default.areBuffersEqual(publicKeyPrefix, response.pubKeyPrefix)) {
            console.log("onStatusResponsePush is not for this status request, ignoring...");
            return;
          }
          clearTimeout(timeoutHandler);
          this.off(constants_default.ResponseCodes.Err, onErr);
          this.off(constants_default.ResponseCodes.Sent, onSent);
          this.off(constants_default.PushCodes.StatusResponse, onStatusResponsePush);
          const bufferReader = new buffer_reader_default(response.statusData);
          const repeaterStats = {
            batt_milli_volts: bufferReader.readUInt16LE(),
            // uint16_t batt_milli_volts;
            curr_tx_queue_len: bufferReader.readUInt16LE(),
            // uint16_t curr_tx_queue_len;
            noise_floor: bufferReader.readInt16LE(),
            // int16_t noise_floor;
            last_rssi: bufferReader.readInt16LE(),
            // int16_t  last_rssi;
            n_packets_recv: bufferReader.readUInt32LE(),
            // uint32_t n_packets_recv;
            n_packets_sent: bufferReader.readUInt32LE(),
            // uint32_t n_packets_sent;
            total_air_time_secs: bufferReader.readUInt32LE(),
            // uint32_t total_air_time_secs;
            total_up_time_secs: bufferReader.readUInt32LE(),
            // uint32_t total_up_time_secs;
            n_sent_flood: bufferReader.readUInt32LE(),
            // uint32_t n_sent_flood
            n_sent_direct: bufferReader.readUInt32LE(),
            // uint32_t n_sent_direct
            n_recv_flood: bufferReader.readUInt32LE(),
            // uint32_t n_recv_flood
            n_recv_direct: bufferReader.readUInt32LE(),
            // uint32_t n_recv_direct
            err_events: bufferReader.readUInt16LE(),
            // uint16_t err_events
            last_snr: bufferReader.readInt16LE(),
            // int16_t last_snr
            n_direct_dups: bufferReader.readUInt16LE(),
            // uint16_t n_direct_dups
            n_flood_dups: bufferReader.readUInt16LE(),
            // uint16_t n_flood_dups
            total_rx_air_time_secs: bufferReader.getRemainingBytesCount() >= 4 ? bufferReader.readUInt32LE() : null,
            n_recv_errors: bufferReader.getRemainingBytesCount() >= 4 ? bufferReader.readUInt32LE() : null
          };
          resolve(repeaterStats);
        };
        const onErr = () => {
          clearTimeout(timeoutHandler);
          this.off(constants_default.ResponseCodes.Err, onErr);
          this.off(constants_default.ResponseCodes.Sent, onSent);
          this.off(constants_default.PushCodes.StatusResponse, onStatusResponsePush);
          reject();
        };
        this.once(constants_default.ResponseCodes.Err, onErr);
        this.once(constants_default.ResponseCodes.Sent, onSent);
        this.once(constants_default.PushCodes.StatusResponse, onStatusResponsePush);
        await this.sendCommandSendStatusReq(contactPublicKey);
      } catch (e) {
        reject(e);
      }
    });
  }
  getTelemetry(contactPublicKey, extraTimeoutMillis = 1e3) {
    return new Promise(async (resolve, reject) => {
      try {
        const publicKeyPrefix = contactPublicKey.subarray(0, 6);
        var timeoutHandler = null;
        const onSent = (response) => {
          this.off(constants_default.ResponseCodes.Err, onErr);
          const estTimeout = response.estTimeout + extraTimeoutMillis;
          timeoutHandler = setTimeout(() => {
            this.off(constants_default.ResponseCodes.Err, onErr);
            this.off(constants_default.ResponseCodes.Sent, onSent);
            this.off(constants_default.PushCodes.TelemetryResponse, onTelemetryResponsePush);
            reject("timeout");
          }, estTimeout);
        };
        const onTelemetryResponsePush = (response) => {
          if (!buffer_utils_default.areBuffersEqual(publicKeyPrefix, response.pubKeyPrefix)) {
            console.log("onTelemetryResponsePush is not for this telemetry request, ignoring...");
            return;
          }
          clearTimeout(timeoutHandler);
          this.off(constants_default.ResponseCodes.Err, onErr);
          this.off(constants_default.ResponseCodes.Sent, onSent);
          this.off(constants_default.PushCodes.TelemetryResponse, onTelemetryResponsePush);
          resolve(response);
        };
        const onErr = () => {
          clearTimeout(timeoutHandler);
          this.off(constants_default.ResponseCodes.Err, onErr);
          this.off(constants_default.ResponseCodes.Sent, onSent);
          this.off(constants_default.PushCodes.TelemetryResponse, onTelemetryResponsePush);
          reject();
        };
        this.once(constants_default.ResponseCodes.Err, onErr);
        this.once(constants_default.ResponseCodes.Sent, onSent);
        this.once(constants_default.PushCodes.TelemetryResponse, onTelemetryResponsePush);
        await this.sendCommandSendTelemetryReq(contactPublicKey);
      } catch (e) {
        reject(e);
      }
    });
  }
  sendBinaryRequest(contactPublicKey, requestCodeAndParams, extraTimeoutMillis = 1e3) {
    return new Promise(async (resolve, reject) => {
      try {
        var tag = null;
        var timeoutHandler = null;
        const onSent = (response) => {
          tag = response.expectedAckCrc;
          this.off(constants_default.ResponseCodes.Err, onErr);
          const estTimeout = response.estTimeout + extraTimeoutMillis;
          timeoutHandler = setTimeout(() => {
            this.off(constants_default.ResponseCodes.Err, onErr);
            this.off(constants_default.ResponseCodes.Sent, onSent);
            this.off(constants_default.PushCodes.BinaryResponse, onBinaryResponsePush);
            reject("timeout");
          }, estTimeout);
        };
        const onBinaryResponsePush = (response) => {
          if (tag !== response.tag) {
            console.log("onBinaryResponse is not for this request tag, ignoring...");
            return;
          }
          clearTimeout(timeoutHandler);
          this.off(constants_default.ResponseCodes.Err, onErr);
          this.off(constants_default.ResponseCodes.Sent, onSent);
          this.off(constants_default.PushCodes.BinaryResponse, onBinaryResponsePush);
          resolve(response.responseData);
        };
        const onErr = () => {
          clearTimeout(timeoutHandler);
          this.off(constants_default.ResponseCodes.Err, onErr);
          this.off(constants_default.ResponseCodes.Sent, onSent);
          this.off(constants_default.PushCodes.BinaryResponse, onBinaryResponsePush);
          reject();
        };
        this.once(constants_default.ResponseCodes.Err, onErr);
        this.once(constants_default.ResponseCodes.Sent, onSent);
        this.once(constants_default.PushCodes.BinaryResponse, onBinaryResponsePush);
        await this.sendCommandSendBinaryReq(contactPublicKey, requestCodeAndParams);
      } catch (e) {
        reject(e);
      }
    });
  }
  /**
   * Set the flood scope to use by provided a 16-byte transport key.
   * Passing an empty list will clear the scope.
   * You can use `const transportKey = await TransportKeyUtil.getHashtagRegionKey("#region");` to easily generate keys
   * @param transportKey Uint8Array 16-byte transport key, can be derived from first 16 bytes of sha256("#region")
   * @returns {Promise<unknown>}
   */
  setFloodScope(transportKey) {
    return new Promise(async (resolve, reject) => {
      try {
        const onOk = (response) => {
          this.off(constants_default.ResponseCodes.Ok, onOk);
          this.off(constants_default.ResponseCodes.Err, onErr);
          resolve(response);
        };
        const onErr = () => {
          this.off(constants_default.ResponseCodes.Ok, onOk);
          this.off(constants_default.ResponseCodes.Err, onErr);
          reject();
        };
        this.once(constants_default.ResponseCodes.Ok, onOk);
        this.once(constants_default.ResponseCodes.Err, onErr);
        await this.sendCommandSetFloodScope(transportKey);
      } catch (e) {
        reject(e);
      }
    });
  }
  getStats(statsType) {
    return new Promise(async (resolve, reject) => {
      try {
        const onStats = (response) => {
          if (response.type !== statsType) {
            return;
          }
          this.off(constants_default.ResponseCodes.Stats, onStats);
          this.off(constants_default.ResponseCodes.Err, onErr);
          resolve(response);
        };
        const onErr = () => {
          this.off(constants_default.ResponseCodes.Stats, onStats);
          this.off(constants_default.ResponseCodes.Err, onErr);
          reject();
        };
        this.once(constants_default.ResponseCodes.Stats, onStats);
        this.once(constants_default.ResponseCodes.Err, onErr);
        await this.sendCommandGetStats(statsType);
      } catch (e) {
        reject(e);
      }
    });
  }
  getStatsCore() {
    return this.getStats(constants_default.StatsTypes.Core);
  }
  getStatsRadio() {
    return this.getStats(constants_default.StatsTypes.Radio);
  }
  getStatsPackets() {
    return this.getStats(constants_default.StatsTypes.Packets);
  }
  sendChannelData(channelIdx, pathLen, path, dataType, payload) {
    return new Promise(async (resolve, reject) => {
      try {
        const onOk = (response) => {
          this.off(constants_default.ResponseCodes.Ok, onOk);
          this.off(constants_default.ResponseCodes.Err, onErr);
          resolve(response);
        };
        const onErr = () => {
          this.off(constants_default.ResponseCodes.Ok, onOk);
          this.off(constants_default.ResponseCodes.Err, onErr);
          reject();
        };
        this.once(constants_default.ResponseCodes.Ok, onOk);
        this.once(constants_default.ResponseCodes.Err, onErr);
        await this.sendCommandSendChannelData(channelIdx, pathLen, path, dataType, payload);
      } catch (e) {
        reject(e);
      }
    });
  }
  clearFloodScope() {
    return this.setFloodScope([]);
  }
  getChannel(channelIdx) {
    return new Promise(async (resolve, reject) => {
      try {
        const onChannelInfoResponse = (response) => {
          this.off(constants_default.ResponseCodes.ChannelInfo, onChannelInfoResponse);
          this.off(constants_default.ResponseCodes.Err, onErr);
          resolve(response);
        };
        const onErr = () => {
          this.off(constants_default.ResponseCodes.ChannelInfo, onChannelInfoResponse);
          this.off(constants_default.ResponseCodes.Err, onErr);
          reject();
        };
        this.once(constants_default.ResponseCodes.ChannelInfo, onChannelInfoResponse);
        this.once(constants_default.ResponseCodes.Err, onErr);
        await this.sendCommandGetChannel(channelIdx);
      } catch (e) {
        reject(e);
      }
    });
  }
  setChannel(channelIdx, name, secret) {
    return new Promise(async (resolve, reject) => {
      try {
        const onOk = () => {
          this.off(constants_default.ResponseCodes.Ok, onOk);
          this.off(constants_default.ResponseCodes.Err, onErr);
          resolve();
        };
        const onErr = () => {
          this.off(constants_default.ResponseCodes.Ok, onOk);
          this.off(constants_default.ResponseCodes.Err, onErr);
          reject();
        };
        this.once(constants_default.ResponseCodes.Ok, onOk);
        this.once(constants_default.ResponseCodes.Err, onErr);
        await this.sendCommandSetChannel(channelIdx, name, secret);
      } catch (e) {
        reject(e);
      }
    });
  }
  async deleteChannel(channelIdx) {
    return await this.setChannel(channelIdx, "", new Uint8Array(16));
  }
  getChannels() {
    return new Promise(async (resolve, reject) => {
      var channelIdx = 0;
      const channels = [];
      while (true) {
        try {
          const channel = await this.getChannel(channelIdx);
          channels.push(channel);
        } catch (e) {
          break;
        }
        channelIdx++;
      }
      return resolve(channels);
    });
  }
  async findChannelByName(name) {
    const channels = await this.getChannels();
    return channels.find((channel) => {
      return channel.name === name;
    });
  }
  async findChannelBySecret(secret) {
    const channels = await this.getChannels();
    return channels.find((channel) => {
      return buffer_utils_default.areBuffersEqual(secret, channel.secret);
    });
  }
  async sign(data) {
    return new Promise(async (resolve, reject) => {
      try {
        const chunkSize = 128;
        const bufferReader = new buffer_reader_default(data);
        const sendNextChunk = async () => {
          var chunk;
          if (bufferReader.getRemainingBytesCount() >= chunkSize) {
            chunk = bufferReader.readBytes(chunkSize);
          } else {
            chunk = bufferReader.readRemainingBytes();
          }
          await this.sendCommandSignData(chunk);
        };
        const onOk = async (response) => {
          if (bufferReader.getRemainingBytesCount() > 0) {
            await sendNextChunk();
            return;
          }
          await this.sendCommandSignFinish();
        };
        const onSignStart = async (response) => {
          this.off(constants_default.ResponseCodes.SignStart, onSignStart);
          if (bufferReader.getRemainingBytesCount() > response.maxSignDataLen) {
            this.off(constants_default.ResponseCodes.ok, onOk);
            this.off(constants_default.ResponseCodes.err, onErr);
            this.off(constants_default.ResponseCodes.SignStart, onSignStart);
            this.off(constants_default.ResponseCodes.Signature, onSignature);
            reject("data_too_long");
            return;
          }
          await sendNextChunk();
        };
        const onSignature = (response) => {
          this.off(constants_default.ResponseCodes.ok, onOk);
          this.off(constants_default.ResponseCodes.err, onErr);
          this.off(constants_default.ResponseCodes.SignStart, onSignStart);
          this.off(constants_default.ResponseCodes.Signature, onSignature);
          resolve(response.signature);
        };
        const onErr = (response) => {
          this.off(constants_default.ResponseCodes.ok, onOk);
          this.off(constants_default.ResponseCodes.err, onErr);
          this.off(constants_default.ResponseCodes.SignStart, onSignStart);
          this.off(constants_default.ResponseCodes.Signature, onSignature);
          reject(response);
        };
        this.on(constants_default.ResponseCodes.Ok, onOk);
        this.on(constants_default.ResponseCodes.SignStart, onSignStart);
        this.on(constants_default.ResponseCodes.Signature, onSignature);
        this.once(constants_default.ResponseCodes.Err, onErr);
        await this.sendCommandSignStart();
      } catch (e) {
        reject(e);
      }
    });
  }
  tracePath(path, extraTimeoutMillis = 0) {
    return new Promise(async (resolve, reject) => {
      try {
        const tag = random_utils_default.getRandomInt(0, 4294967295);
        var timeoutHandler = null;
        const onSent = (response) => {
          this.off(constants_default.ResponseCodes.Err, onErr);
          const estTimeout = response.estTimeout + extraTimeoutMillis;
          timeoutHandler = setTimeout(() => {
            this.off(constants_default.ResponseCodes.Sent, onSent);
            this.off(constants_default.PushCodes.TraceData, onTraceDataPush);
            this.off(constants_default.ResponseCodes.Err, onErr);
            reject("timeout");
          }, estTimeout);
        };
        const onTraceDataPush = (response) => {
          if (response.tag !== tag) {
            console.log("ignoring trace data for a different trace request");
            return;
          }
          clearTimeout(timeoutHandler);
          this.off(constants_default.ResponseCodes.Sent, onSent);
          this.off(constants_default.PushCodes.TraceData, onTraceDataPush);
          this.off(constants_default.ResponseCodes.Err, onErr);
          resolve(response);
        };
        const onErr = () => {
          clearTimeout(timeoutHandler);
          this.off(constants_default.ResponseCodes.Sent, onSent);
          this.off(constants_default.PushCodes.TraceData, onTraceDataPush);
          this.off(constants_default.ResponseCodes.Err, onErr);
          reject();
        };
        this.once(constants_default.ResponseCodes.Sent, onSent);
        this.on(constants_default.PushCodes.TraceData, onTraceDataPush);
        this.once(constants_default.ResponseCodes.Err, onErr);
        await this.sendCommandSendTracePath(tag, 0, path);
      } catch (e) {
        reject(e);
      }
    });
  }
  setOtherParams(manualAddContacts) {
    return new Promise(async (resolve, reject) => {
      try {
        const onOk = () => {
          this.off(constants_default.ResponseCodes.Ok, onOk);
          this.off(constants_default.ResponseCodes.Err, onErr);
          resolve();
        };
        const onErr = () => {
          this.off(constants_default.ResponseCodes.Ok, onOk);
          this.off(constants_default.ResponseCodes.Err, onErr);
          reject();
        };
        this.once(constants_default.ResponseCodes.Ok, onOk);
        this.once(constants_default.ResponseCodes.Err, onErr);
        await this.sendCommandSetOtherParams(manualAddContacts);
      } catch (e) {
        reject(e);
      }
    });
  }
  async setAutoAddContacts() {
    return await this.setOtherParams(false);
  }
  async setManualAddContacts() {
    return await this.setOtherParams(true);
  }
  // REQ_TYPE_GET_NEIGHBOURS from Repeater role
  // https://github.com/meshcore-dev/MeshCore/pull/833
  // Repeater must be running firmware v1.9.0+
  async getNeighbours(publicKey, count = 10, offset = 0, orderBy = 0, pubKeyPrefixLength = 8) {
    const bufferWriter = new buffer_writer_default();
    bufferWriter.writeByte(constants_default.BinaryRequestTypes.GetNeighbours);
    bufferWriter.writeByte(0);
    bufferWriter.writeByte(count);
    bufferWriter.writeUInt16LE(offset);
    bufferWriter.writeByte(orderBy);
    bufferWriter.writeByte(pubKeyPrefixLength);
    bufferWriter.writeUInt32LE(random_utils_default.getRandomInt(0, 4294967295));
    const responseData = await this.sendBinaryRequest(publicKey, bufferWriter.toBytes());
    const bufferReader = new buffer_reader_default(responseData);
    const totalNeighboursCount = bufferReader.readUInt16LE();
    const resultsCount = bufferReader.readUInt16LE();
    const neighbours = [];
    for (var i = 0; i < resultsCount; i++) {
      const publicKeyPrefix = bufferReader.readBytes(pubKeyPrefixLength);
      const heardSecondsAgo = bufferReader.readUInt32LE();
      const snr = bufferReader.readInt8() / 4;
      neighbours.push({
        publicKeyPrefix,
        heardSecondsAgo,
        snr
      });
    }
    return {
      totalNeighboursCount,
      neighbours
    };
  }
};
var connection_default = Connection;

// node_modules/@liamcottle/meshcore.js/src/connection/web_ble_connection.js
var WebBleConnection = class _WebBleConnection extends connection_default {
  constructor(bleDevice) {
    super();
    this.bleDevice = bleDevice;
    this.gattServer = null;
    this.rxCharacteristic = null;
    this.txCharacteristic = null;
    this.init();
  }
  static async open() {
    if (!navigator.bluetooth) {
      alert("Web Bluetooth is not supported in this browser");
      return;
    }
    const device = await navigator.bluetooth.requestDevice({
      filters: [
        {
          services: [
            constants_default.Ble.ServiceUuid.toLowerCase()
          ]
        }
      ]
    });
    if (!device) {
      return null;
    }
    return new _WebBleConnection(device);
  }
  async init() {
    this.bleDevice.addEventListener("gattserverdisconnected", () => {
      this.onDisconnected();
    });
    this.gattServer = await this.bleDevice.gatt.connect();
    const service = await this.gattServer.getPrimaryService(constants_default.Ble.ServiceUuid.toLowerCase());
    const characteristics = await service.getCharacteristics();
    this.rxCharacteristic = characteristics.find((characteristic) => {
      return characteristic.uuid.toLowerCase() === constants_default.Ble.CharacteristicUuidRx.toLowerCase();
    });
    this.txCharacteristic = characteristics.find((characteristic) => {
      return characteristic.uuid.toLowerCase() === constants_default.Ble.CharacteristicUuidTx.toLowerCase();
    });
    await this.txCharacteristic.startNotifications();
    this.txCharacteristic.addEventListener("characteristicvaluechanged", (event) => {
      const frame = new Uint8Array(event.target.value.buffer);
      this.onFrameReceived(frame);
    });
    await this.onConnected();
  }
  async close() {
    try {
      this.gattServer?.disconnect();
      this.gattServer = null;
    } catch (e) {
    }
  }
  async write(bytes) {
    try {
      await this.rxCharacteristic.writeValue(bytes);
    } catch (e) {
      console.log("failed to write to ble device", e);
    }
  }
  async sendToRadioFrame(frame) {
    this.emit("tx", frame);
    await this.write(frame);
  }
};
var web_ble_connection_default = WebBleConnection;

// node_modules/@liamcottle/meshcore.js/src/connection/serial_connection.js
var SerialConnection = class _SerialConnection extends connection_default {
  constructor() {
    super();
    this.readBuffer = [];
    if (this.constructor === _SerialConnection) {
      throw new Error("SerialConnection is an abstract class and can't be instantiated.");
    }
  }
  async write(bytes) {
    throw new Error("Not Implemented: write must be implemented by SerialConnection sub class.");
  }
  async writeFrame(frameType, frameData) {
    const frame = new buffer_writer_default();
    frame.writeByte(frameType);
    frame.writeUInt16LE(frameData.length);
    frame.writeBytes(frameData);
    await this.write(frame.toBytes());
  }
  async sendToRadioFrame(data) {
    this.emit("tx", data);
    await this.writeFrame(60, data);
  }
  async onDataReceived(value) {
    this.readBuffer = [
      ...this.readBuffer,
      ...value
    ];
    const frameHeaderLength = 3;
    while (this.readBuffer.length >= frameHeaderLength) {
      try {
        const frameHeader = new buffer_reader_default(this.readBuffer.slice(0, frameHeaderLength));
        const frameType = frameHeader.readByte();
        if (frameType !== constants_default.SerialFrameTypes.Incoming && frameType !== constants_default.SerialFrameTypes.Outgoing) {
          this.readBuffer = this.readBuffer.slice(1);
          continue;
        }
        const frameLength = frameHeader.readUInt16LE();
        if (!frameLength) {
          this.readBuffer = this.readBuffer.slice(1);
          continue;
        }
        const requiredLength = frameHeaderLength + frameLength;
        if (this.readBuffer.length < requiredLength) {
          break;
        }
        const frameData = this.readBuffer.slice(frameHeaderLength, requiredLength);
        this.readBuffer = this.readBuffer.slice(requiredLength);
        this.onFrameReceived(frameData);
      } catch (e) {
        console.error("Failed to process frame", e);
        break;
      }
    }
  }
};
var serial_connection_default = SerialConnection;

// node_modules/@liamcottle/meshcore.js/src/connection/web_serial_connection.js
var WebSerialConnection = class _WebSerialConnection extends serial_connection_default {
  constructor(serialPort) {
    super();
    this.serialPort = serialPort;
    this.reader = serialPort.readable.getReader();
    this.writable = serialPort.writable;
    this.readLoop();
    this.serialPort.addEventListener("disconnect", () => {
      this.onDisconnected();
    });
    setTimeout(async () => {
      await this.onConnected();
    }, 0);
  }
  static async open() {
    if (!navigator.serial) {
      alert("Web Serial is not supported in this browser");
      return null;
    }
    const serialPort = await navigator.serial.requestPort({
      filters: []
    });
    await serialPort.open({
      baudRate: 115200
    });
    return new _WebSerialConnection(serialPort);
  }
  async close() {
    try {
      this.reader.releaseLock();
    } catch (e) {
    }
    try {
      await this.serialPort.close();
    } catch (e) {
    }
  }
  /* override */
  async write(bytes) {
    const writer = this.writable.getWriter();
    try {
      await writer.write(new Uint8Array(bytes));
    } finally {
      writer.releaseLock();
    }
  }
  async readLoop() {
    try {
      while (true) {
        const { value, done } = await this.reader.read();
        if (done) {
          break;
        }
        await this.onDataReceived(value);
      }
    } catch (error) {
      if (error instanceof TypeError) {
        return;
      }
      console.error("Error reading from serial port: ", error);
    } finally {
      this.reader.releaseLock();
    }
  }
};
var web_serial_connection_default = WebSerialConnection;
export {
  constants_default as Constants,
  web_ble_connection_default as WebBleConnection,
  web_serial_connection_default as WebSerialConnection
};
