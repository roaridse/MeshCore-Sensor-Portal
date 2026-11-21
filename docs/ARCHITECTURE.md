# Arkitektur

## Ansvar

Portalen er en statisk klient og skal ikke bygge firmware eller motta hemmelige
konfigurasjonsverdier. Firmwareprosjektene eier bygg, tester og Releases.

```text
Firmware-repo -> GitHub Release + firmwaremanifest
                                      |
                                      v
Sensor Portal -> USB sensor-CLI eller Companion -> MeshCore -> sensornode
```

## Transportadaptere

Brukergrensesnittet skal sende kommandoer gjennom et lite felles grensesnitt:

```js
await transport.connect();
const reply = await transport.send("ruuvi scan");
await transport.disconnect();
```

`SerialCli` er første adapter og snakker direkte med sensornodens tekst-CLI ved
115200 baud. En senere `CompanionRemoteCli` skal bruke `meshcore.js`, velge en
kontakt, autentisere administratoren og sende samme kommando over MeshCore.

UI-koden skal ikke vite om kommandoen gikk direkte eller via mesh. Remote-
adapteren må ha lengre tidsavbrudd og håndtere korte eller oppdelte svar.

## Firmwarekatalog

`catalog/firmware.json` bruker `schemaVersion: 1`. Nye pakker legges til uten å
endre UI så lenge de følger samme skjema. En pakke identifiseres av:

- profil;
- kort;
- firmwareversjon;
- PlatformIO-miljø;
- flashmetode;
- nedlastbare filer og SHA-256-summer;
- valideringsstatus og funksjonsliste.

På sikt bør firmware-workflowen generere et manifest per Release. Portalens
katalog kan da samle flere manifests uten å hardkode filnavn i JavaScript.

## Sikkerhet

- Ingen backend er nødvendig for USB- eller BLE-kommunikasjon.
- Passord, Victron-nøkler og kanalnøkler skal ikke lagres i Local Storage,
  IndexedDB, URL-er eller telemetri.
- Sensitive kommandoer maskeres i portalkonsollen, også ved serie-ekko.
- Releasefiler skal få SHA-256-summer før portalen tilbyr direkte flashing.
- Remote-konfigurasjon skal bare bruke MeshCores autentiserte administratorflyt.
- Portalen må ikke legge til en generell HTTP-proxy for private GitHub-filer.

## Planlagte milepæler

1. Genererte checksums og Release-manifest fra firmware-repoet.
2. Stabil og versjonert maskinlesbar sensor-CLI.
3. Companion over Web Serial og Web Bluetooth med `meshcore.js`.
4. Remote CLI, kontaktsøk og administratorautentisering.
5. Flere kort og profiler for kablede sensorer.
