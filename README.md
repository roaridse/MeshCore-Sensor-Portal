# MeshCore Sensor Portal

A static web portal for finding firmware and configuring MeshCore sensor nodes.
All device communication takes place locally in the browser. The portal has no
backend and does not send sensor data, passwords, channel keys, or Victron keys
to a server.

## Status

Version 0.2 includes:

- a machine-readable firmware catalog;
- selection of profile, board, and firmware version;
- downloads of bundled UF2 and Nordic DFU ZIP files, with support for future Releases;
- direct Nordic serial DFU for nRF52;
- 1200-baud touch reset for entering DFU mode;
- controlled **Erase flash** using the official RAK4631 formatter with SHA-256 verification;
- a local DFU ZIP option as an alternative to a public GitHub Release;
- bundled, checksum-verified v0.3.1 DFU ZIP and UF2 files for private testing;
- direct connection to the sensor firmware through Web Serial at 115200 baud;
- connection to a MeshCore Companion through Web Bluetooth or Web Serial;
- sensor contact discovery and authenticated remote administrator login;
- remote configuration through MeshCore CLI data messages;
- configuration of the node name, Ruuvi, Shelly, Victron, and private status channel;
- a general-purpose CLI console;
- editing of sensitive fields without storing or logging the keys locally.

## Configuring through a Companion

1. Select **Via Companion** under Connection.
2. Choose Bluetooth or USB serial and connect to the Companion node.
3. Select a sensor from the Companion's sensor contacts.
4. Enter the sensor administrator password and log in.
5. Use the same configuration forms and console as for direct USB.

The sensor must already be present in the Companion contact list and advertise
as a MeshCore sensor. Remote commands use `TXT_TYPE_CLI_DATA`; replies can take
longer than direct USB because they travel over the mesh. Do not use another app
with the same Companion at the same time, since Companion messages are consumed
from a shared queue.

## Flashing a RAK4631

1. Select the firmware profile, RAK4631, and version.
2. Click **Enter DFU mode**, select the node's normal serial port, and wait for it to restart.
3. Click **Flash selected firmware** and select the bootloader's new serial port.
4. Wait until progress reaches 100 percent.

On the RAK4631, `239A:8029` is the normal application port. The bootloader
usually appears as `239A:0029` or `239A:002A`.

The portal contains the verified v0.3.1 DFU ZIP, so flashing does not depend on
access to the private firmware repository. You can select a different locally
built `firmware.zip` in the file field. UF2 can always be installed manually by
double-pressing RESET and copying the file to the mounted bootloader drive.

**Erase flash** is only needed for a factory reset or when stored data causes
problems. It deletes the node identity, password, channels, contacts, keys, and
sensor configuration. The portal requires explicit confirmation and verifies
the formatter file against the SHA-256 value in the catalog before flashing.

## Running locally

Web Serial requires a secure browser context. `localhost` is permitted:

```bash
npm run serve
```

Open `http://127.0.0.1:4173` in Chrome or Edge. You can change the port with the
`SENSOR_PORTAL_PORT` environment variable.

Validate the catalog and core files with:

```bash
npm run check
```

## Firmware catalog

`catalog/firmware.json` is the stable interface between firmware projects and
the portal. A firmware package describes its profile, board, PlatformIO
environment, features, validation status, and Release files.

Release files must be publicly accessible when the portal is public. During
private development, the catalog can point to local or temporarily published
artifacts.

## Browser support

Direct USB and USB Companion access require Web Serial. Bluetooth Companion
access requires Web Bluetooth. These APIs are normally available in desktop
versions of Chrome and Edge; Firefox and Safari do not support them. Only one
program or browser tab can own the device connection at a time.

After connecting, the portal automatically sends `ver`. The heading displays
either **USB and CLI ready** or **Port open — no CLI response**. The CLI console
shows the USB VID:PID, DTR state, number of bytes sent, and a specific timeout
explanation.

The DFU panel has its own diagnostics log. **Enter DFU mode** can only confirm
that the 1200-baud reset was sent; the browser cannot prove that the bootloader
started. Look for a new serial port or the bootloader LED before flashing.

## Roadmap

1. Add SHA-256 sums and manifest generation to the firmware workflow.
2. Add a versioned, machine-readable CLI to the sensor firmware.
3. Add delivery confirmation and retry controls for unreliable remote routes.
4. Add more boards and sensor profiles through the catalog.

See the [architecture](docs/ARCHITECTURE.md) for the interface between the
firmware, portal, and transport adapters.

## GitHub Pages

The `.github/workflows/pages.yml` workflow validates the portal on pull requests
and publishes `main` to GitHub Pages. Select **GitHub Actions** as the Pages
source in the repository settings before the first deployment. A Pages site is
normally public; do not place secrets or private firmware files in the published
directory.

## Third-party code

The nRF52 DFU engine is reused from the official MeshCore flasher. Its license,
upstream commit, and the formatter's origin are documented in
[`vendor/meshcore-flasher/NOTICE.md`](vendor/meshcore-flasher/NOTICE.md).

Companion communication uses a browser bundle of the official `meshcore.js`
client. Its version, origin, and license are documented in
[`vendor/meshcore/NOTICE.md`](vendor/meshcore/NOTICE.md).
