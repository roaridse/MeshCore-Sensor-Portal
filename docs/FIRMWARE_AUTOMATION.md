# Firmware release automation

The portal builds its firmware catalog from `portal-manifest.json` files
published by `roaridse/MeshCore-VictronBLE` GitHub Releases.

## Release and deployment flow

1. A version tag in the firmware repository builds UF2, Nordic DFU ZIP and HEX
   files.
2. The firmware workflow generates `portal-manifest.json`, including SHA-256
   and file size for every asset.
3. The firmware workflow optionally sends a `firmware_released` repository
   dispatch event to the portal.
4. The portal downloads stable release manifests and assets, verifies every
   file, keeps the three newest versions per profile/board/environment, and
   adds the portal-owned formatter for the board.
5. The generated catalog and local firmware files are published as a clean
   GitHub Pages artifact.

The portal also synchronizes every night at 03:17 UTC and whenever its `main`
branch is deployed. A missing dispatch token therefore delays an update but
does not permanently block synchronization.

## One-time GitHub configuration

### 1. Enable GitHub Pages

In `MeshCore-Sensor-Portal`:

1. Open **Settings → Pages**.
2. Under **Build and deployment**, select **GitHub Actions** as the source.

### 2. Permit the portal to read a private firmware repository

This is optional if `MeshCore-VictronBLE` is public. For a private repository:

1. Open GitHub **Settings → Developer settings → Personal access tokens →
   Fine-grained tokens**.
2. Create a token with `MeshCore-VictronBLE` as the only selected repository.
3. Grant repository permission **Contents: Read-only**.
4. In `MeshCore-Sensor-Portal`, open **Settings → Secrets and variables →
   Actions**.
5. Create the repository secret `FIRMWARE_REPO_TOKEN` containing that token.

The downloaded firmware is placed on the Pages site. A public Pages site makes
those release binaries public even if the source repository is private.

### 3. Trigger the portal immediately after a firmware release

Without this token, the nightly synchronization still works.

1. Create another fine-grained token with `MeshCore-Sensor-Portal` as its only
   selected repository.
2. Grant repository permission **Contents: Read and write**. GitHub requires
   write access to create a repository dispatch event.
3. In `MeshCore-VictronBLE`, open **Settings → Secrets and variables →
   Actions**.
4. Create the repository secret `PORTAL_DISPATCH_TOKEN` containing that token.

### 4. Verify firmware release permissions

In `MeshCore-VictronBLE`, open **Settings → Actions → General** and ensure
workflows may use read/write repository permissions. The release job declares
`contents: write` because it creates and updates GitHub Releases.

## Publishing the next version

The manifest generator was added after the existing v0.3.1 tag, so it starts
with the next release:

1. Update `FIRMWARE_VERSION` in `config/platformio.local.ini`, for example to
   `v0.4.0`.
2. Commit and push both the firmware changes and the automation changes.
3. Create the matching tag only after the commit is on `main`:

   ```sh
   git tag -a v0.4.0 -m "v0.4.0"
   git push origin v0.4.0
   ```

4. Open **Actions → Build firmware** and confirm that both jobs pass.
5. Open the new GitHub Release and confirm that it contains:

   - `RAK4631-BLE-Sensor-v0.4.0.uf2`
   - `RAK4631-BLE-Sensor-v0.4.0.zip`
   - `RAK4631-BLE-Sensor-v0.4.0.hex`
   - `portal-manifest.json`

6. Open **Actions → Validate and publish portal** in the portal repository.
   A run triggered by `repository_dispatch` should start. It can also be run
   manually with **Run workflow**.

The bundled v0.3.1 package remains available as a fallback. Later releases are
discovered automatically; no manual edit to `catalog/firmware.json` is needed.

## Adding boards or firmware profiles

Add the package metadata and artifact templates to
`MeshCore-VictronBLE/portal/targets.json`, and make the firmware build produce
the declared filenames. The portal does not need hard-coded profile or version
changes. A board that needs destructive erase support must also have a verified
formatter mapped in the portal's bundled catalog before the erase button is
offered.
