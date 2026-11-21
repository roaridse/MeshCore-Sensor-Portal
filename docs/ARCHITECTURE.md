# Architecture

## Responsibilities

The portal is a static client and must not build firmware or receive secret
configuration values. The firmware projects own their builds, tests, and
Releases.

```text
Firmware repository -> GitHub Release + firmware manifest
                                           |
                                           v
Sensor Portal -> USB sensor CLI or Companion -> MeshCore -> sensor node
```

## Transport adapters

The user interface sends commands through a small shared interface:

```js
await transport.connect();
const reply = await transport.send("ruuvi scan");
await transport.disconnect();
```

`SerialCli` communicates directly with the sensor node's text CLI at 115200
baud. `CompanionRemoteCli` uses the official `meshcore.js` client over Web
Bluetooth or Web Serial, selects a sensor contact, authenticates the
administrator, and sends the same command as `TXT_TYPE_CLI_DATA` over MeshCore.

The UI code does not need to know whether a command was sent directly or over
the mesh. The remote adapter uses longer timeouts and drains asynchronous
replies from the Companion message queue.

## Firmware catalog

`catalog/firmware.json` uses `schemaVersion: 1`. New packages can be added
without changing the UI as long as they follow the same schema. A package is
identified by:

- profile;
- board;
- firmware version;
- PlatformIO environment;
- flashing method;
- downloadable files and SHA-256 sums;
- validation status and feature list.

In the future, the firmware workflow should generate one manifest per Release.
The portal catalog can then combine multiple manifests without hard-coding file
names in JavaScript.

## Security

- No backend is required for USB or BLE communication.
- Passwords, Victron keys, and channel keys must not be stored in Local Storage,
  IndexedDB, URLs, or telemetry.
- Sensitive commands are redacted in the portal console, including serial echoes.
- Release files must have SHA-256 sums before the portal offers direct flashing.
- Remote configuration must use MeshCore's authenticated administrator flow.
- The portal must not add a general HTTP proxy for private GitHub files.

## Planned milestones

1. Generated checksums and Release manifests from the firmware repository.
2. A stable, versioned, and machine-readable sensor CLI.
3. Delivery confirmation and retry controls for unreliable remote routes.
4. More boards and profiles for wired sensors.
