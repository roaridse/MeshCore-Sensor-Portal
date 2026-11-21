import { SerialCli } from "./serial.js";
import { Nrf52Flasher } from "./flasher.js";

const elements = Object.fromEntries([
  "connectionDot", "connectionText", "firmwareCount", "catalogStatus", "profileSelect",
  "boardSelect", "versionSelect", "firmwareDetails", "downloadUf2", "downloadDfu",
  "flashSupport", "enterDfuButton", "flashButton", "eraseButton", "localDfuFile",
  "flashProgressWrap", "flashStatus", "flashPercent", "flashProgress", "flashLog", "eraseDialog",
  "eraseConfirmation", "confirmEraseButton",
  "serialSupport", "deviceName", "deviceDetail", "connectButton", "disconnectButton",
  "commandResult", "consoleOutput", "consoleForm", "consoleCommand", "clearConsole", "toast"
].map((id) => [id, document.getElementById(id)]));

let catalog = null;
let toastTimer = null;
let suppressConsoleData = false;
let flashBusy = false;

const serial = new SerialCli({
  onData: (text) => { if (!suppressConsoleData) appendConsole(text); },
  onDisconnect: () => setConnected(false, "USB-enheten ble koblet fra"),
  onStatus: ({ timestamp, message }) => appendConsole(`\n[USB ${formatTime(timestamp)}] ${message}\n`)
});
const flasher = new Nrf52Flasher({ onLog: appendFlashLog });

initialize();

async function initialize() {
  setupTabs();
  setupCommands();
  setupConnection();
  setupFlasher();
  setupMacFormatting();
  await loadCatalog();
}

async function loadCatalog() {
  try {
    const response = await fetch("catalog/firmware.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    catalog = await response.json();
    validateCatalog(catalog);
    elements.firmwareCount.textContent = String(catalog.packages.length);
    elements.catalogStatus.textContent = `Oppdatert ${catalog.updated}`;
    elements.catalogStatus.classList.add("good");
    populateProfiles();
  } catch (error) {
    elements.catalogStatus.textContent = "Katalogfeil";
    elements.catalogStatus.classList.add("warn");
    elements.firmwareDetails.innerHTML = `<strong>Firmwarekatalogen kunne ikke lastes.</strong><p>${escapeHtml(error.message)}. Åpne portalen via en lokal webserver, ikke direkte som fil.</p>`;
  }
}

function validateCatalog(value) {
  if (value?.schemaVersion !== 1 || !Array.isArray(value.packages) || value.packages.length === 0) {
    throw new Error("Ukjent eller tomt katalogformat");
  }
}

function populateProfiles() {
  const profiles = [...new Map(catalog.packages.map((item) => [item.profile.id, item.profile.name])).entries()];
  fillSelect(elements.profileSelect, profiles);
  elements.profileSelect.addEventListener("change", populateBoards);
  elements.boardSelect.addEventListener("change", populateVersions);
  elements.versionSelect.addEventListener("change", renderFirmware);
  populateBoards();
}

function populateBoards() {
  const packages = catalog.packages.filter((item) => item.profile.id === elements.profileSelect.value);
  const boards = [...new Map(packages.map((item) => [item.board.id, item.board.name])).entries()];
  fillSelect(elements.boardSelect, boards);
  populateVersions();
}

function populateVersions() {
  const packages = matchingPackages();
  fillSelect(elements.versionSelect, packages.map((item) => [item.version, item.version]));
  renderFirmware();
}

function matchingPackages() {
  if (!catalog) return [];
  return catalog.packages.filter((item) => item.profile.id === elements.profileSelect.value && item.board.id === elements.boardSelect.value);
}

function selectedPackage() {
  return matchingPackages().find((item) => item.version === elements.versionSelect.value);
}

function renderFirmware() {
  const item = selectedPackage();
  if (!item) return;
  const features = item.features.map((feature) => `<li>${escapeHtml(feature)}</li>`).join("");
  const validation = item.validation === "hardware-partial" ? "Delvis maskinvaretestet" : item.validation;
  elements.firmwareDetails.innerHTML = `<div><strong>${escapeHtml(item.profile.name)} · ${escapeHtml(item.board.name)}</strong><p>${escapeHtml(item.description)}</p><p>Bygg: ${escapeHtml(item.environment)} · ${escapeHtml(validation)}</p></div><ul>${features}</ul>`;
  setDownload(elements.downloadUf2, item.assets.uf2);
  setDownload(elements.downloadDfu, item.assets.dfu);
  updateFlashControls();
}

function setDownload(element, asset) {
  element.href = asset?.url || "#";
  element.hidden = !asset?.url;
  if (asset?.sha256) element.title = `SHA-256: ${asset.sha256}`;
}

function fillSelect(select, options) {
  select.replaceChildren(...options.map(([value, label]) => new Option(label, value)));
}

function setupConnection() {
  if (SerialCli.supported()) {
    elements.serialSupport.textContent = "Web Serial tilgjengelig";
    elements.serialSupport.classList.add("good");
  } else {
    elements.serialSupport.textContent = "Web Serial mangler";
    elements.serialSupport.classList.add("warn");
    elements.connectButton.disabled = true;
    elements.deviceDetail.textContent = "Bruk Chrome eller Edge på en datamaskin.";
  }

  elements.connectButton.addEventListener("click", async () => {
    try {
      elements.connectButton.disabled = true;
      const info = await serial.connect();
      const id = [info.usbVendorId, info.usbProductId].every(Number.isInteger)
        ? `${hex4(info.usbVendorId)}:${hex4(info.usbProductId)}` : "USB serial";
      setConnected(true, id);
      appendConsole("\n[USB tilkoblet]\n");
      elements.connectionText.textContent = "Port åpen – tester CLI";
      elements.deviceDetail.textContent = `${id} · sender ver`;
      appendConsole("\n› ver (automatisk tilkoblingstest)\n");
      try {
        const reply = await serial.send("ver", { idleMs: 650, timeoutMs: 4000 });
        elements.connectionText.textContent = "USB og CLI klar";
        elements.deviceDetail.textContent = `${id} · CLI svarte${reply ? `: ${firstLine(reply)}` : ""}`;
        elements.connectionDot.classList.remove("warning");
        elements.connectionDot.classList.add("connected");
        showToast("Sensornodens CLI svarer");
      } catch (probeError) {
        elements.connectionText.textContent = "Port åpen – ingen CLI-respons";
        elements.deviceDetail.textContent = `${id} · ${probeError.message}`;
        elements.connectionDot.classList.remove("connected");
        elements.connectionDot.classList.add("warning");
        appendConsole(`\n[CLI-test feilet] ${probeError.message}\n`);
        showToast("Porten åpnet, men CLI svarte ikke", true);
      }
    } catch (error) {
      elements.connectButton.disabled = false;
      showError(error);
    }
  });

  elements.disconnectButton.addEventListener("click", async () => {
    await serial.disconnect();
    setConnected(false);
    appendConsole("\n[USB frakoblet]\n");
  });
}

function setupFlasher() {
  if (flasher.supported) {
    elements.flashSupport.textContent = "Web Serial tilgjengelig";
    elements.flashSupport.classList.add("good");
  } else {
    elements.flashSupport.textContent = "Web Serial mangler";
    elements.flashSupport.classList.add("warn");
  }

  elements.enterDfuButton.addEventListener("click", () => runFlashOperation(
    "Aktiverer DFU-mode …",
    async () => {
      setFlashProgress(10, "Velg sensornodens vanlige USB-port");
      await flasher.enterDfuMode();
      setFlashProgress(100, "1200-baud reset sendt. Se etter bootloaderport/LED; dette kan ikke bekreftes av nettleseren.");
    }
  ));

  elements.flashButton.addEventListener("click", () => runFlashOperation(
    "Forbereder firmware …",
    async () => {
      const item = selectedPackage();
      const localFile = elements.localDfuFile.files[0];
      const onProgress = (percent) => setFlashProgress(percent, "Flasher firmware – ikke koble fra USB");
      setFlashProgress(2, localFile ? `Kontrollerer ${localFile.name}` : "Laster ned DFU ZIP");
      if (localFile) await flasher.flashBlob(localFile, onProgress);
      else await flasher.flashAsset(item.assets.dfu, onProgress);
      setFlashProgress(100, "Firmware ferdig. Noden starter på nytt.");
    }
  ));

  elements.eraseButton.addEventListener("click", () => {
    elements.eraseDialog.returnValue = "";
    elements.eraseConfirmation.value = "";
    elements.confirmEraseButton.disabled = true;
    elements.eraseDialog.showModal();
    elements.eraseConfirmation.focus();
  });
  elements.eraseConfirmation.addEventListener("input", () => {
    elements.confirmEraseButton.disabled = elements.eraseConfirmation.value.trim().toUpperCase() !== "SLETT";
  });
  elements.eraseDialog.addEventListener("close", () => {
    if (elements.eraseDialog.returnValue !== "confirm") return;
    void eraseSelectedDevice();
  });
  elements.localDfuFile.addEventListener("change", () => {
    const file = elements.localDfuFile.files[0];
    if (file) showToast(`Lokal firmware valgt: ${file.name}`);
  });
  updateFlashControls();
}

async function eraseSelectedDevice() {
  await runFlashOperation("Forbereder formatter …", async () => {
    const item = selectedPackage();
    setFlashProgress(2, "Laster formatter og kontrollerer SHA-256");
    await flasher.flashAsset(item.assets.erase, (percent) => setFlashProgress(percent, "Flasher formatter – ikke koble fra USB"));
    setFlashProgress(100, "Flash slettet. Sett noden i DFU-mode igjen og flash vanlig firmware.");
  });
}

async function runFlashOperation(initialStatus, operation) {
  if (flashBusy) return;
  try {
    if (serial.connected) {
      await serial.disconnect();
      setConnected(false, "CLI-porten ble lukket for flashing");
      appendConsole("\n[CLI-port lukket før flashing]\n");
    }
    setFlashBusy(true);
    elements.flashProgressWrap.hidden = false;
    setFlashProgress(0, initialStatus);
    await operation();
    showToast("USB-operasjonen er fullført");
  } catch (error) {
    const message = friendlyFlashError(error);
    setFlashProgress(0, `Feil: ${message}`);
    showError(new Error(message));
  } finally {
    setFlashBusy(false);
  }
}

function setFlashBusy(busy) {
  flashBusy = busy;
  updateFlashControls();
  elements.connectButton.disabled = busy || serial.connected || !SerialCli.supported();
}

function updateFlashControls() {
  const item = selectedPackage();
  const available = flasher.supported && !flashBusy;
  elements.enterDfuButton.disabled = !available;
  elements.flashButton.disabled = !available || !item?.assets?.dfu;
  elements.eraseButton.disabled = !available || !item?.assets?.erase;
  elements.localDfuFile.disabled = flashBusy;
}

function setFlashProgress(percent, status) {
  const normalized = Math.max(0, Math.min(100, Math.round(percent)));
  elements.flashProgress.value = normalized;
  elements.flashProgress.textContent = `${normalized} %`;
  elements.flashPercent.textContent = `${normalized} %`;
  elements.flashStatus.textContent = status;
}

function friendlyFlashError(error) {
  if (error?.name === "NotFoundError") return "Ingen USB-port ble valgt.";
  if (error?.name === "InvalidStateError") return "USB-porten er opptatt. Koble fra konfiguratoren eller andre terminaler og prøv igjen.";
  if (error?.name === "NetworkError") return "Kunne ikke åpne USB-porten. Kontroller DFU-mode og prøv igjen.";
  return error?.message || "Ukjent feil under flashing.";
}

function setConnected(connected, detail = "") {
  elements.connectionDot.classList.toggle("connected", connected);
  elements.connectionDot.classList.remove("warning");
  elements.connectionText.textContent = connected ? "USB tilkoblet" : "Ingen enhet tilkoblet";
  elements.deviceName.textContent = connected ? "Sensornode tilkoblet" : "Ingen port valgt";
  elements.deviceDetail.textContent = connected ? detail : (detail || "Koble sensornoden til med en USB-datakabel.");
  elements.connectButton.disabled = flashBusy || connected || !SerialCli.supported();
  elements.disconnectButton.disabled = !connected;
  document.querySelectorAll("[data-command], [data-command-form] button[type='submit'], #consoleForm button").forEach((node) => { node.disabled = !connected; });
  document.querySelectorAll(".requires-connection").forEach((node) => {
    node.textContent = connected ? "USB tilkoblet" : "Krever USB";
    node.classList.toggle("good", connected);
  });
}

function setupTabs() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((item) => {
        const active = item === tab;
        item.classList.toggle("active", active);
        item.setAttribute("aria-selected", String(active));
      });
      document.querySelectorAll(".tab-panel").forEach((panel) => {
        const active = panel.id === `tab-${tab.dataset.tab}`;
        panel.classList.toggle("active", active);
        panel.hidden = !active;
      });
    });
  });
}

function setupCommands() {
  setConnected(false);
  document.querySelectorAll("[data-command]").forEach((button) => {
    button.addEventListener("click", () => runCommand(button.dataset.command, { slow: button.dataset.command.endsWith(" scan") }));
  });

  document.querySelectorAll("[data-command-form]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const submitter = event.submitter;
      const values = Object.fromEntries(new FormData(form));
      const command = substitute(submitter.dataset.commandTemplate, values);
      await runCommand(command, { sensitive: form.hasAttribute("data-sensitive") });
      if (form.hasAttribute("data-sensitive")) form.querySelectorAll("input[type='password']").forEach((input) => { input.value = ""; });
    });
  });

  elements.consoleForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const command = elements.consoleCommand.value.trim();
    if (!command) return;
    elements.consoleCommand.value = "";
    await runCommand(command);
  });
  elements.clearConsole.addEventListener("click", () => { elements.consoleOutput.textContent = ""; });
}

async function runCommand(command, { sensitive = false, slow = false } = {}) {
  const shownCommand = sensitive ? redactCommand(command) : command;
  appendConsole(`\n› ${shownCommand}\n`);
  elements.commandResult.classList.remove("error");
  elements.commandResult.textContent = "Venter på svar …";
  try {
    suppressConsoleData = sensitive;
    const reply = await serial.send(command, slow ? { idleMs: 900, timeoutMs: 12000 } : undefined);
    const safeReply = sensitive ? reply.replaceAll(command, shownCommand) : reply;
    elements.commandResult.textContent = safeReply || "Kommando sendt. Enheten ga ikke tekstsvar.";
    elements.connectionText.textContent = "USB og CLI klar";
    elements.connectionDot.classList.remove("warning");
    elements.connectionDot.classList.add("connected");
    showToast("Kommando fullført");
  } catch (error) {
    elements.commandResult.textContent = error.message;
    elements.commandResult.classList.add("error");
    showError(error);
  } finally {
    suppressConsoleData = false;
  }
}

function setupMacFormatting() {
  document.querySelectorAll("[data-mac]").forEach((input) => {
    input.addEventListener("input", () => {
      const hex = input.value.replace(/[^0-9a-f]/gi, "").slice(0, 12).toUpperCase();
      input.value = hex.match(/.{1,2}/g)?.join(":") || "";
      input.setCustomValidity(hex.length === 0 || hex.length === 12 ? "" : "MAC-adressen må ha 12 heksadesimale tegn.");
    });
  });
}

function substitute(template, values) {
  return template.replace(/\{([^}]+)\}/g, (_, key) => String(values[key] ?? "").trim());
}

function redactCommand(command) {
  if (command.startsWith("victron add ")) {
    const parts = command.split(" ");
    if (parts.length >= 5) parts[3] = "<redacted>";
    return parts.join(" ");
  }
  if (command.startsWith("channel set ")) {
    const parts = command.split(" ");
    if (parts.length >= 4) parts[3] = "<redacted>";
    return parts.join(" ");
  }
  return command.startsWith("password ") ? "password <redacted>" : command;
}

function appendConsole(text) {
  elements.consoleOutput.textContent += text;
  elements.consoleOutput.scrollTop = elements.consoleOutput.scrollHeight;
}

function appendFlashLog({ timestamp, message }) {
  if (elements.flashLog.textContent === "Ingen DFU-operasjon startet.") elements.flashLog.textContent = "";
  elements.flashLog.textContent += `[${formatTime(timestamp)}] ${message}\n`;
  elements.flashLog.scrollTop = elements.flashLog.scrollHeight;
}

function showError(error) {
  appendConsole(`\n[Feil: ${error.message}]\n`);
  showToast(error.message, true);
}

function showToast(message, error = false) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.style.background = error ? "var(--danger)" : "var(--accent)";
  elements.toast.classList.add("visible");
  toastTimer = setTimeout(() => elements.toast.classList.remove("visible"), 3500);
}

function hex4(value) { return value.toString(16).toUpperCase().padStart(4, "0"); }
function formatTime(value) { return value.toLocaleTimeString("nb-NO", { hour12: false }); }
function firstLine(value) { return value.split(/\r?\n/, 1)[0].slice(0, 90); }
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]); }
