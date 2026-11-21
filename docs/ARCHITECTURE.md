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

`SerialCli` is the first adapter and communicates directly with the sensor
node's text CLI at 115200 baud. A future `CompanionRemoteCli` will use
`meshcore.js`, select a contact, authenticate the administrator, and send the
same command over MeshCore.

The UI code must not need to know whether a command was sent directly or over
the mesh. The remote adapter must use longer timeouts and handle short or
fragmented responses.

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
3. Companion access over Web Serial and Web Bluetooth using `meshcore.js`.
4. Remote CLI, contact discovery, and administrator authentication.
5. More boards and profiles for wired sensors.
