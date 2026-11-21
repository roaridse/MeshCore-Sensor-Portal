import { SerialCli } from "./serial.js";
import { Nrf52Flasher } from "./flasher.js";
import { CompanionRemoteCli, bytesToHex } from "./companion.js";

const elements = Object.fromEntries([
  "connectionDot", "connectionText", "firmwareCount", "catalogStatus", "profileSelect",
  "boardSelect", "versionSelect", "firmwareDetails", "downloadUf2", "downloadDfu",
  "flashSupport", "enterDfuButton", "flashButton", "eraseButton", "localDfuFile",
  "flashProgressWrap", "flashStatus", "flashPercent", "flashProgress", "flashLog", "eraseDialog",
  "eraseConfirmation", "confirmEraseButton",
  "serialSupport", "deviceName", "deviceDetail", "connectButton", "disconnectButton",
  "companionConnection", "companionMethod", "remoteLogin", "sensorContact", "remotePassword",
  "remoteLoginButton", "refreshContactsButton",
  "commandResult", "consoleOutput", "consoleForm", "consoleCommand", "clearConsole", "toast"
].map((id) => [id, document.getElementById(id)]));

let catalog = null;
let toastTimer = null;
let suppressConsoleData = false;
let flashBusy = false;
let transportMode = "serial";

const serial = new SerialCli({
  onData: (text) => { if (!suppressConsoleData) appendConsole(text); },
  onDisconnect: () => setConnected(false, "The USB device was disconnected"),
  onStatus: ({ timestamp, message }) => appendConsole(`\n[USB ${formatTime(timestamp)}] ${message}\n`)
});
const companion = new CompanionRemoteCli({
  onData: (text) => { if (!suppressConsoleData) appendConsole(text); },
  onDisconnect: () => {
    if (transportMode === "companion") setConnected(false, "The Companion was disconnected");
  },
  onStatus: ({ timestamp, message }) => appendConsole(`\n[Companion ${formatTime(timestamp)}] ${message}\n`)
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
    elements.catalogStatus.textContent = `Updated ${catalog.updated}`;
    elements.catalogStatus.classList.add("good");
    populateProfiles();
  } catch (error) {
    elements.catalogStatus.textContent = "Catalog error";
    elements.catalogStatus.classList.add("warn");
    elements.firmwareDetails.innerHTML = `<strong>The firmware catalog could not be loaded.</strong><p>${escapeHtml(error.message)}. Open the portal through a local web server, not directly as a file.</p>`;
  }
}

function validateCatalog(value) {
  if (value?.schemaVersion !== 1 || !Array.isArray(value.packages) || value.packages.length === 0) {
    throw new Error("Unknown or empty catalog format");
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
  const validation = item.validation === "hardware-partial" ? "Partially hardware tested" : item.validation;
  elements.firmwareDetails.innerHTML = `<div><strong>${escapeHtml(item.profile.name)} · ${escapeHtml(item.board.name)}</strong><p>${escapeHtml(item.description)}</p><p>Build: ${escapeHtml(item.environment)} · ${escapeHtml(validation)}</p></div><ul>${features}</ul>`;
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
  renderConnectionMode();

  document.querySelectorAll("input[name='mode']").forEach((input) => {
    input.addEventListener("change", async () => {
      if (!input.checked || input.value === transportMode) return;
      try {
        await currentTransport().disconnect();
      } catch (error) {
        appendConsole(`\n[Disconnect warning: ${error.message}]\n`);
      }
      transportMode = input.value;
      document.querySelectorAll(".mode-option").forEach((label) => label.classList.toggle("active", label.contains(input)));
      setConnected(false);
      renderConnectionMode();
    });
  });

  elements.companionMethod.addEventListener("change", renderConnectionMode);

  elements.connectButton.addEventListener("click", async () => {
    try {
      elements.connectButton.disabled = true;
      if (transportMode === "serial") await connectDirectUsb();
      else await connectCompanion();
    } catch (error) {
      elements.connectButton.disabled = false;
      showError(error);
    }
  });

  elements.disconnectButton.addEventListener("click", async () => {
    await currentTransport().disconnect();
    setConnected(false);
    appendConsole(`\n[${transportMode === "serial" ? "USB" : "Companion"} disconnected]\n`);
  });

  elements.refreshContactsButton.addEventListener("click", async () => {
    try {
      populateSensorContacts(await companion.refreshContacts());
      showToast("Companion contacts refreshed");
    } catch (error) {
      showError(error);
    }
  });

  elements.sensorContact.addEventListener("change", () => {
    if (!elements.sensorContact.value) return;
    companion.selectContact(elements.sensorContact.value);
    setConnected(true, "Enter the sensor administrator password", { ready: false, name: "Companion connected" });
  });

  elements.remoteLoginButton.addEventListener("click", async () => {
    try {
      elements.remoteLoginButton.disabled = true;
      companion.selectContact(elements.sensorContact.value);
      const contact = await companion.login(elements.remotePassword.value);
      elements.remotePassword.value = "";
      setConnected(true, `${contact.advName || "Sensor"} · authenticated remote CLI`, { ready: true, name: contact.advName || "Remote sensor" });
      appendConsole(`\n[Remote CLI authenticated: ${contact.advName || bytesToHex(contact.publicKey.subarray(0, 6))}]\n`);
      showToast("Remote sensor CLI is ready");
    } catch (error) {
      elements.remotePassword.value = "";
      showError(error);
    } finally {
      elements.remoteLoginButton.disabled = false;
    }
  });
}

async function connectDirectUsb() {
  const info = await serial.connect();
  const id = [info.usbVendorId, info.usbProductId].every(Number.isInteger)
    ? `${hex4(info.usbVendorId)}:${hex4(info.usbProductId)}` : "USB serial";
  setConnected(true, id, { ready: true, name: "Sensor node connected" });
  appendConsole("\n[USB connected]\n");
  elements.connectionText.textContent = "Port open – testing CLI";
  elements.deviceDetail.textContent = `${id} · sending ver`;
  appendConsole("\n› ver (automatic connection test)\n");
  try {
    const reply = await serial.send("ver", { idleMs: 650, timeoutMs: 4000 });
    elements.connectionText.textContent = "USB and CLI ready";
    elements.deviceDetail.textContent = `${id} · CLI responded${reply ? `: ${firstLine(reply)}` : ""}`;
    showToast("The sensor node CLI is responding");
  } catch (probeError) {
    elements.connectionText.textContent = "Port open – no CLI response";
    elements.deviceDetail.textContent = `${id} · ${probeError.message}`;
    elements.connectionDot.classList.remove("connected");
    elements.connectionDot.classList.add("warning");
    appendConsole(`\n[CLI test failed] ${probeError.message}\n`);
    showToast("The port opened, but the CLI did not respond", true);
  }
}

async function connectCompanion() {
  const contacts = await companion.connect(elements.companionMethod.value);
  populateSensorContacts(contacts);
  elements.remoteLogin.hidden = false;
  setConnected(true, contacts.length ? "Select a sensor contact and log in" : "No contacts found on this Companion", { ready: false, name: "Companion connected" });
  appendConsole(`\n[Companion connected · ${contacts.length} contact${contacts.length === 1 ? "" : "s"}]\n`);
  showToast("Companion connected");
}

function populateSensorContacts(contacts) {
  const options = contacts.map((contact) => {
    const prefix = bytesToHex(contact.publicKey.subarray(0, 6)).toUpperCase();
    return [bytesToHex(contact.publicKey), `${contact.advName || "Unnamed contact"} · ${prefix}`];
  });
  fillSelect(elements.sensorContact, options.length ? options : [["", "No sensor contacts found"]]);
  elements.remoteLoginButton.disabled = options.length === 0;
}

function renderConnectionMode() {
  const companionMode = transportMode === "companion";
  elements.companionConnection.hidden = !companionMode;
  if (!companionMode) elements.remoteLogin.hidden = true;
  const method = companionMode ? elements.companionMethod.value : "serial";
  const supported = companionMode ? CompanionRemoteCli.supported(method) : SerialCli.supported();
  const methodName = method === "bluetooth" ? "Web Bluetooth" : "Web Serial";
  elements.serialSupport.textContent = `${methodName} ${supported ? "available" : "unavailable"}`;
  elements.serialSupport.classList.toggle("good", supported);
  elements.serialSupport.classList.toggle("warn", !supported);
  elements.connectButton.textContent = companionMode ? "Connect to Companion" : "Select USB port";
  elements.connectButton.disabled = flashBusy || currentTransport().connected || !supported;
  if (!currentTransport().connected) {
    elements.deviceName.textContent = companionMode ? "No Companion connected" : "No port selected";
    elements.deviceDetail.textContent = supported
      ? (companionMode ? "Choose Bluetooth or the Companion's USB serial port." : "Connect the sensor node with a USB data cable.")
      : `Use a desktop version of Chrome or Edge with ${methodName}.`;
  }
}

function currentTransport() {
  return transportMode === "companion" ? companion : serial;
}

function setupFlasher() {
  if (flasher.supported) {
    elements.flashSupport.textContent = "Web Serial available";
    elements.flashSupport.classList.add("good");
  } else {
    elements.flashSupport.textContent = "Web Serial unavailable";
    elements.flashSupport.classList.add("warn");
  }

  elements.enterDfuButton.addEventListener("click", () => runFlashOperation(
    "Entering DFU mode …",
    async () => {
      setFlashProgress(10, "Select the sensor node's normal USB port");
      await flasher.enterDfuMode();
      setFlashProgress(100, "1200-baud reset sent. Look for the bootloader port or LED; the browser cannot verify this.");
    }
  ));

  elements.flashButton.addEventListener("click", () => runFlashOperation(
    "Preparing firmware …",
    async () => {
      const item = selectedPackage();
      const localFile = elements.localDfuFile.files[0];
      const onProgress = (percent) => setFlashProgress(percent, "Flashing firmware – do not disconnect USB");
      setFlashProgress(2, localFile ? `Checking ${localFile.name}` : "Downloading DFU ZIP");
      if (localFile) await flasher.flashBlob(localFile, onProgress);
      else await flasher.flashAsset(item.assets.dfu, onProgress);
      setFlashProgress(100, "Firmware complete. The node is restarting.");
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
    elements.confirmEraseButton.disabled = elements.eraseConfirmation.value.trim().toUpperCase() !== "ERASE";
  });
  elements.eraseDialog.addEventListener("close", () => {
    if (elements.eraseDialog.returnValue !== "confirm") return;
    void eraseSelectedDevice();
  });
  elements.localDfuFile.addEventListener("change", () => {
    const file = elements.localDfuFile.files[0];
    if (file) showToast(`Local firmware selected: ${file.name}`);
  });
  updateFlashControls();
}

async function eraseSelectedDevice() {
  await runFlashOperation("Preparing formatter …", async () => {
    const item = selectedPackage();
    setFlashProgress(2, "Downloading formatter and verifying SHA-256");
    await flasher.flashAsset(item.assets.erase, (percent) => setFlashProgress(percent, "Flashing formatter – do not disconnect USB"));
    setFlashProgress(100, "Flash erased. Enter DFU mode again and flash the normal firmware.");
  });
}

async function runFlashOperation(initialStatus, operation) {
  if (flashBusy) return;
  try {
    if (serial.connected) {
      await serial.disconnect();
      setConnected(false, "The CLI port was closed for flashing");
      appendConsole("\n[CLI port closed before flashing]\n");
    }
    setFlashBusy(true);
    elements.flashProgressWrap.hidden = false;
    setFlashProgress(0, initialStatus);
    await operation();
    showToast("USB operation completed");
  } catch (error) {
    const message = friendlyFlashError(error);
    setFlashProgress(0, `Error: ${message}`);
    showError(new Error(message));
  } finally {
    setFlashBusy(false);
  }
}

function setFlashBusy(busy) {
  flashBusy = busy;
  updateFlashControls();
  const supported = transportMode === "companion"
    ? CompanionRemoteCli.supported(elements.companionMethod.value)
    : SerialCli.supported();
  elements.connectButton.disabled = busy || currentTransport().connected || !supported;
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
  if (error?.name === "NotFoundError") return "No USB port was selected.";
  if (error?.name === "InvalidStateError") return "The USB port is busy. Disconnect the configurator or other terminals and try again.";
  if (error?.name === "NetworkError") return "Could not open the USB port. Check DFU mode and try again.";
  return error?.message || "Unknown flashing error.";
}

function setConnected(connected, detail = "", { ready = connected, name = "Sensor node connected" } = {}) {
  const remote = transportMode === "companion";
  elements.connectionDot.classList.toggle("connected", ready);
  elements.connectionDot.classList.toggle("warning", connected && !ready);
  elements.connectionText.textContent = ready ? (remote ? "Remote sensor ready" : "USB connected") : (connected ? "Companion connected – login required" : "No device connected");
  elements.deviceName.textContent = connected ? name : (remote ? "No Companion connected" : "No port selected");
  elements.deviceDetail.textContent = connected ? detail : (detail || (remote ? "Connect to a MeshCore Companion to find sensors." : "Connect the sensor node with a USB data cable."));
  const supported = remote ? CompanionRemoteCli.supported(elements.companionMethod.value) : SerialCli.supported();
  elements.connectButton.disabled = flashBusy || connected || !supported;
  elements.companionMethod.disabled = remote && connected;
  elements.disconnectButton.disabled = !connected;
  document.querySelectorAll("[data-command], [data-command-form] button[type='submit'], #consoleForm button").forEach((node) => { node.disabled = !ready; });
  document.querySelectorAll(".requires-connection").forEach((node) => {
    node.textContent = ready ? (remote ? "Remote sensor ready" : "USB connected") : (remote ? "Companion login required" : "USB required");
    node.classList.toggle("good", ready);
  });
  if (!connected && remote) elements.remoteLogin.hidden = true;
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
  elements.commandResult.textContent = "Waiting for a response …";
  try {
    suppressConsoleData = sensitive;
    const options = transportMode === "companion"
      ? { timeoutMs: slow ? 60000 : 45000 }
      : (slow ? { idleMs: 900, timeoutMs: 12000 } : undefined);
    const reply = await currentTransport().send(command, options);
    const safeReply = sensitive ? reply.replaceAll(command, shownCommand) : reply;
    elements.commandResult.textContent = safeReply || "Command sent. The device returned no text response.";
    elements.connectionText.textContent = transportMode === "companion" ? "Remote sensor ready" : "USB and CLI ready";
    elements.connectionDot.classList.remove("warning");
    elements.connectionDot.classList.add("connected");
    showToast("Command completed");
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
      input.setCustomValidity(hex.length === 0 || hex.length === 12 ? "" : "The MAC address must contain 12 hexadecimal characters.");
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
  if (elements.flashLog.textContent === "No DFU operation started.") elements.flashLog.textContent = "";
  elements.flashLog.textContent += `[${formatTime(timestamp)}] ${message}\n`;
  elements.flashLog.scrollTop = elements.flashLog.scrollHeight;
}

function showError(error) {
  appendConsole(`\n[Error: ${error.message}]\n`);
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
function formatTime(value) { return value.toLocaleTimeString("en-GB", { hour12: false }); }
function firstLine(value) { return value.split(/\r?\n/, 1)[0].slice(0, 90); }
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]); }
