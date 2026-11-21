# MeshCore Sensor Portal

Statisk webportal for å finne firmware og konfigurere MeshCore-sensornoder.
All USB-kommunikasjon skjer lokalt i nettleseren. Portalen har ingen backend og
sender ikke sensor-, kanal- eller Victron-nøkler til en server.

## Status

Første utviklingsversjon inneholder:

- maskinlesbar firmwarekatalog;
- valg av profil, kort og firmwareversjon;
- nedlasting av innebygd UF2 og Nordic DFU ZIP, med støtte for senere Releases;
- direkte Nordic serial DFU for nRF52;
- 1200-baud touch-reset for å aktivere DFU-mode;
- kontrollert «Erase flash» med offisiell RAK4631 formatter og SHA-256-sjekk;
- lokal DFU ZIP som alternativ til en offentlig GitHub Release;
- innebygd, checksum-verifisert v0.3.1 DFU ZIP og UF2 for privat testing;
- direkte tilkobling til sensorfirmware med Web Serial ved 115200 baud;
- konfigurasjon av nodenavn, Ruuvi, Shelly, Victron og privat statuskanal;
- generell CLI-konsoll;
- redigering av sensitive felter uten lokal lagring eller logging av nøklene.

Remote-konfigurasjon gjennom en MeshCore Companion er planlagt, men ikke
aktivert i denne versjonen.

## Flash RAK4631

1. Velg firmwareprofil, RAK4631 og versjon.
2. Trykk **Aktiver DFU-mode**, velg nodens vanlige serieport og vent på omstart.
3. Trykk **Flash valgt firmware** og velg bootloaderens nye serieport.
4. Vent til fremdriften viser 100 prosent.

På RAK4631 er `239A:8029` den normale applikasjonsporten. Bootloaderen vises
normalt som `239A:0029` eller `239A:002A`.

Portalen inneholder den verifiserte v0.3.1 DFU ZIP-filen, så flashing er ikke
avhengig av tilgang til det private firmware-repoet. En annen lokalt bygget
`firmware.zip` kan velges i filfeltet. UF2 kan alltid brukes manuelt ved å
dobbelttrykke RESET og kopiere filen til den monterte bootloaderdisken.

**Erase flash** er bare nødvendig ved fabrikkreset eller problemer med lagrede
data. Den sletter nodeidentitet, passord, kanaler, kontakter, nøkler og
sensorkonfigurasjon. Portalen krever eksplisitt bekreftelse og verifiserer
formatterfilen mot katalogens SHA-256 før flashing.

## Lokal kjøring

Web Serial krever en sikker nettleserkontekst. `localhost` er godkjent:

```bash
npm run serve
```

Åpne `http://127.0.0.1:4173` i Chrome eller Edge. Porten kan endres med
miljøvariabelen `SENSOR_PORTAL_PORT`.

Kontroller katalogen og kjernefilene med:

```bash
npm run check
```

## Firmwarekatalog

`catalog/firmware.json` er det stabile grensesnittet mellom firmwareprosjekter
og portalen. En firmwarepakke beskriver profil, kort, PlatformIO-miljø,
funksjoner, valideringsstatus og Release-filer.

Release-filene må være offentlig tilgjengelige for en offentlig portal. Under
privat utvikling kan katalogen peke på lokale eller midlertidig publiserte
artefakter.

## Nettleserstøtte

Direkte USB krever Web Serial, normalt Chrome eller Edge på desktop. Firefox og
Safari tilbyr ikke Web Serial. Bare ett program eller én nettleserfane kan eie
USB-porten om gangen.

Etter tilkobling sender portalen automatisk `ver`. Overskriften viser enten
**USB og CLI klar** eller **Port åpen – ingen CLI-respons**. CLI-konsollen viser
USB VID:PID, DTR-status, antall sendte bytes og en konkret timeoutforklaring.

DFU-panelet har en egen diagnostikklogg. «Aktiver DFU-mode» kan bare bekrefte at
1200-baud reset ble sendt; nettleseren kan ikke bevise at bootloaderen startet.
Se derfor etter en ny serieport eller bootloaderens LED før flashing.

## Veien videre

1. Legg SHA-256-summer og manifestgenerering inn i firmware-workflowen.
2. Legg til versjonert, maskinlesbar CLI i sensorfirmwaren.
3. Integrer `meshcore.js` for Companion over Web Serial/Web Bluetooth.
4. Implementer autentisert remote CLI mot valgte sensornoder.
5. Legg til flere kort og sensorprofiler gjennom katalogen.

Se [arkitekturen](docs/ARCHITECTURE.md) for grensesnittet mellom firmware,
portal og transportadaptere.

## GitHub Pages

Workflowen `.github/workflows/pages.yml` validerer portalen på pull requests og
publiserer `main` til GitHub Pages. Aktiver **GitHub Actions** som Pages-kilde i
repoets innstillinger før første deployment. En Pages-side er normalt offentlig;
ikke legg hemmeligheter eller private firmwarefiler i den publiserte katalogen.

## Tredjepartskode

nRF52 DFU-motoren er gjenbrukt fra den offisielle MeshCore-flasheren. Lisens,
oppstrøms commit og formatterens opphav er dokumentert i
[`vendor/meshcore-flasher/NOTICE.md`](vendor/meshcore-flasher/NOTICE.md).
