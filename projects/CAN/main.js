const appState = {
  file: null,
  dbcFile: null,
  dbc: null,
  frames: [],
  filteredFrames: [],
  warnings: [],
  dbcWarnings: [],
  summary: null,
  currentPage: 1,
  rowsPerPage: 100,
  chart: null,
  decodedChart: null,
  lastDecodedSignalRows: [],
  lastDecodedSignalMeta: null
};
const els = {
  ascFileInput: document.getElementById("ascFileInput"),
  clearButton: document.getElementById("clearButton"),
  exportCsvButton: document.getElementById("exportCsvButton"),
  fileStatus: document.getElementById("fileStatus"),

  summarySection: document.getElementById("summarySection"),

  idFilter: document.getElementById("idFilter"),
  channelFilter: document.getElementById("channelFilter"),
  directionFilter: document.getElementById("directionFilter"),
  startTimeFilter: document.getElementById("startTimeFilter"),
  endTimeFilter: document.getElementById("endTimeFilter"),
  applyFiltersButton: document.getElementById("applyFiltersButton"),

  messagesTableBody: document.getElementById("messagesTableBody"),
  idsTableBody: document.getElementById("idsTableBody"),
  warningsList: document.getElementById("warningsList"),
  debugJson: document.getElementById("debugJson"),

  messageCountLabel: document.getElementById("messageCountLabel"),
  idCountLabel: document.getElementById("idCountLabel"),
  pageLabel: document.getElementById("pageLabel"),
  prevPageButton: document.getElementById("prevPageButton"),
  nextPageButton: document.getElementById("nextPageButton"),

  plotIdSelect: document.getElementById("plotIdSelect"),
  plotByteSelect: document.getElementById("plotByteSelect"),
  plotButton: document.getElementById("plotButton"),
  byteChart: document.getElementById("byteChart"),

  dbcFileInput: document.getElementById("dbcFileInput"),
    dbcStatusLabel: document.getElementById("dbcStatusLabel"),
    dbcMessagesTableBody: document.getElementById("dbcMessagesTableBody"),
    dbcSignalsTableBody: document.getElementById("dbcSignalsTableBody"),

    decodedSignalSelect: document.getElementById("decodedSignalSelect"),
    decodeSignalButton: document.getElementById("decodeSignalButton"),
    exportDecodedCsvButton: document.getElementById("exportDecodedCsvButton"),
    decodedSignalChart: document.getElementById("decodedSignalChart"),
    decodedSignalTableBody: document.getElementById("decodedSignalTableBody"),
    decodedStatusLabel: document.getElementById("decodedStatusLabel"),
};

els.ascFileInput.addEventListener("change", handleFileUpload);
els.clearButton.addEventListener("click", clearApp);
els.applyFiltersButton.addEventListener("click", applyFiltersAndRender);
els.exportCsvButton.addEventListener("click", exportFilteredCsv);
els.prevPageButton.addEventListener("click", goToPreviousPage);
els.nextPageButton.addEventListener("click", goToNextPage);
els.plotButton.addEventListener("click", renderBytePlot);
els.dbcFileInput.addEventListener("change", handleDbcUpload);
els.decodeSignalButton.addEventListener("click", decodeAndPlotSelectedSignal);
els.exportDecodedCsvButton.addEventListener("click", exportDecodedSignalCsv);
document.querySelectorAll(".tab-button").forEach((button) => {
  button.addEventListener("click", () => {
    const tabId = button.dataset.tab;
    activateTab(tabId);
  });
});

function activateTab(tabId) {
  document.querySelectorAll(".tab-button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });

  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === tabId);
  });
}

async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  appState.file = file;
  els.fileStatus.textContent = `Loading ${file.name}...`;

  try {
    const text = await file.text();
    const { frames, warnings, headerInfo } = parseAscText(text);

    appState.frames = frames;
    appState.filteredFrames = frames;
    appState.warnings = warnings;
    appState.summary = buildCanLogSummary(file, frames, warnings, headerInfo);
    appState.currentPage = 1;
    enrichIdSummaryWithDbc();
    els.fileStatus.textContent = `${file.name} loaded. Parsed ${frames.length.toLocaleString()} messages.`;
    els.exportCsvButton.disabled = frames.length === 0;

    renderAll();
  } catch (err) {
    console.error(err);
    els.fileStatus.textContent = `Failed to load file: ${err.message}`;
  }
}

function parseAscText(text) {
  const lines = text.split(/\r?\n/);
  const frames = [];
  const warnings = [];

  const headerInfo = {
    dateLine: null,
    baseLine: null
  };

  for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
    const rawLine = lines[lineNumber];
    const line = rawLine.trim();

    if (!line) continue;

    if (line.startsWith("date ")) {
      headerInfo.dateLine = line;
      continue;
    }

    if (line.startsWith("base ")) {
      headerInfo.baseLine = line;
      continue;
    }

    if (shouldSkipAscLine(line)) {
      continue;
    }

    const parsed = parseAscFrameLine(line, rawLine);

    if (parsed) {
      parsed.lineNumber = lineNumber + 1;
      frames.push(parsed);
    } else {
      warnings.push({
        lineNumber: lineNumber + 1,
        line: rawLine,
        reason: "Unsupported or unrecognized ASC line"
      });
    }
  }

  return { frames, warnings, headerInfo };
}

function shouldSkipAscLine(line) {
  const lower = line.toLowerCase();

  return (
    line.startsWith("//") ||
    lower.startsWith("begin ") ||
    lower.startsWith("end ") ||
    lower.startsWith("internal ") ||
    lower.startsWith("start ") ||
    lower.startsWith("statistic") ||
    lower.startsWith("trigger") ||
    lower.includes("errorframe") ||
    lower.includes("errframe")
  );
}

function parseAscFrameLine(line, rawLine) {
  const parts = line.split(/\s+/);

  // Common Vector ASC data frame:
  // timestamp channel id Rx d dlc b0 b1 ...
  //
  // Examples:
  // 0.000000 1 123 Rx d 8 11 22 33 44 55 66 77 88
  // 0.001000 1 18FEF100x Rx d 8 11 22 33 44 55 66 77 88

  if (parts.length < 6) return null;

  const timestamp = Number(parts[0]);
  if (!Number.isFinite(timestamp)) return null;

  // Some ASC variants include "CANFD" or event-like records.
  // This MVP only handles classic CAN data frames.
  const channel = Number(parts[1]);
  if (!Number.isFinite(channel)) return null;

  const idToken = parts[2];
  const direction = parts[3];
  const dataMarker = parts[4];

  if (!["Rx", "Tx"].includes(direction)) return null;
  if (dataMarker.toLowerCase() !== "d") return null;

  const dlc = Number(parts[5]);
  if (!Number.isInteger(dlc) || dlc < 0 || dlc > 64) return null;

  const byteTokens = parts.slice(6, 6 + dlc);
  if (byteTokens.length < dlc) return null;

  const isExtended = idToken.endsWith("x") || idToken.endsWith("X");
  const cleanId = isExtended ? idToken.slice(0, -1) : idToken;
  const id = parseInt(cleanId, 16);

  if (!Number.isFinite(id)) return null;

  const byteValues = [];

  for (const token of byteTokens) {
    const value = parseInt(token, 16);
    if (!Number.isInteger(value) || value < 0 || value > 255) {
      return null;
    }
    byteValues.push(value);
  }

  return {
    timestamp,
    channel,
    id,
    idHex: normalizeHexId(cleanId, isExtended),
    isExtended,
    direction,
    dlc,
    data: byteValues,
    rawLine
  };
}

function normalizeHexId(idText, isExtended) {
  const clean = idText.replace(/^0x/i, "").toUpperCase();
  return clean.padStart(isExtended ? 8 : 3, "0");
}

function buildCanLogSummary(file, frames, warnings, headerInfo) {
  const ids = new Map();
  const channels = new Set();

  let start = Infinity;
  let end = -Infinity;
  let extendedCount = 0;
  let standardCount = 0;
  let rxCount = 0;
  let txCount = 0;

  for (const frame of frames) {
    start = Math.min(start, frame.timestamp);
    end = Math.max(end, frame.timestamp);

    channels.add(frame.channel);

    if (frame.isExtended) extendedCount++;
    else standardCount++;

    if (frame.direction === "Rx") rxCount++;
    if (frame.direction === "Tx") txCount++;

    const key = `${frame.id}:${frame.isExtended}`;

    if (!ids.has(key)) {
      ids.set(key, {
        id: frame.id,
        idHex: frame.idHex,
        isExtended: frame.isExtended,
        count: 0,
        firstTimestamp: frame.timestamp,
        lastTimestamp: frame.timestamp,
        dlcs: new Set(),
        channels: new Set()
      });
    }

    const entry = ids.get(key);
    entry.count++;
    entry.firstTimestamp = Math.min(entry.firstTimestamp, frame.timestamp);
    entry.lastTimestamp = Math.max(entry.lastTimestamp, frame.timestamp);
    entry.dlcs.add(frame.dlc);
    entry.channels.add(frame.channel);
  }

  const duration =
    Number.isFinite(start) && Number.isFinite(end)
      ? Math.max(0, end - start)
      : 0;

  const idRows = Array.from(ids.values())
    .map((entry) => ({
      id: entry.id,
      idHex: entry.idHex,
      isExtended: entry.isExtended,
      count: entry.count,
      firstTimestamp: entry.firstTimestamp,
      lastTimestamp: entry.lastTimestamp,
      averageHz: duration > 0 ? entry.count / duration : null,
      dlcs: Array.from(entry.dlcs).sort((a, b) => a - b),
      channels: Array.from(entry.channels).sort((a, b) => a - b)
    }))
    .sort((a, b) => b.count - a.count);

  return {
    fileName: file.name,
    fileSizeBytes: file.size,
    messageCount: frames.length,
    warningCount: warnings.length,
    uniqueIdCount: ids.size,
    channelCount: channels.size,
    startTimestamp: Number.isFinite(start) ? start : null,
    endTimestamp: Number.isFinite(end) ? end : null,
    duration,
    standardCount,
    extendedCount,
    rxCount,
    txCount,
    headerInfo,
    ids: idRows
  };
}

function renderAll() {
  renderSummary();
  renderMessagesTable();
  renderIdSummaryTable();
  renderWarnings();
  renderDbcBrowser();
  renderPlotSelectors();
  renderDecodedSignalSelector();
  renderDebugJson();
}

function renderSummary() {
  const summary = appState.summary;

  if (!summary) {
    els.summarySection.innerHTML = "";
    return;
  }

  const cards = [
    ["File", summary.fileName],
    ["Size", formatBytes(summary.fileSizeBytes)],
    ["Messages", summary.messageCount.toLocaleString()],
    ["Unique IDs", summary.uniqueIdCount.toLocaleString()],
    ["Channels", summary.channelCount.toLocaleString()],
    ["Duration", `${formatNumber(summary.duration)} s`],
    ["Rx / Tx", `${summary.rxCount.toLocaleString()} / ${summary.txCount.toLocaleString()}`],
    ["Warnings", summary.warningCount.toLocaleString()]
  ];

  els.summarySection.innerHTML = cards
    .map(
      ([label, value]) => `
        <article class="summary-card">
          <div class="label">${escapeHtml(label)}</div>
          <div class="value">${escapeHtml(String(value))}</div>
        </article>
      `
    )
    .join("");
}

function applyFiltersAndRender() {
  const idNeedle = els.idFilter.value.trim().toUpperCase().replace(/^0X/, "");
  const channelText = els.channelFilter.value.trim();
  const direction = els.directionFilter.value;
  const startText = els.startTimeFilter.value.trim();
  const endText = els.endTimeFilter.value.trim();

  const channel = channelText === "" ? null : Number(channelText);
  const start = startText === "" ? null : Number(startText);
  const end = endText === "" ? null : Number(endText);

  appState.filteredFrames = appState.frames.filter((frame) => {
    if (idNeedle && !frame.idHex.includes(idNeedle)) return false;
    if (channel !== null && frame.channel !== channel) return false;
    if (direction && frame.direction !== direction) return false;
    if (start !== null && frame.timestamp < start) return false;
    if (end !== null && frame.timestamp > end) return false;
    return true;
  });

  appState.currentPage = 1;
  renderMessagesTable();
}

function renderMessagesTable() {
  const frames = appState.filteredFrames;
  const totalPages = Math.max(1, Math.ceil(frames.length / appState.rowsPerPage));

  appState.currentPage = Math.min(appState.currentPage, totalPages);

  const startIndex = (appState.currentPage - 1) * appState.rowsPerPage;
  const pageRows = frames.slice(startIndex, startIndex + appState.rowsPerPage);

  els.messagesTableBody.innerHTML = pageRows
    .map(
      (frame) => `
        <tr>
          <td>${formatNumber(frame.timestamp, 6)}</td>
          <td>${frame.channel}</td>
          <td class="data-cell">0x${frame.idHex}</td>
          <td>${frame.isExtended ? "yes" : "no"}</td>
          <td>${frame.direction}</td>
          <td>${frame.dlc}</td>
          <td class="data-cell">${formatDataBytes(frame.data)}</td>
        </tr>
      `
    )
    .join("");

  els.messageCountLabel.textContent =
    `${frames.length.toLocaleString()} filtered / ${appState.frames.length.toLocaleString()} total`;

  els.pageLabel.textContent = `Page ${appState.currentPage} of ${totalPages}`;

  els.prevPageButton.disabled = appState.currentPage <= 1;
  els.nextPageButton.disabled = appState.currentPage >= totalPages;
}

function renderIdSummaryTable() {
  const rows = appState.summary?.ids ?? [];

  els.idsTableBody.innerHTML = rows
    .map(
      (row) => `
        <tr>
          <td class="data-cell">0x${row.idHex}</td>
          <td>${row.isExtended ? "yes" : "no"}</td>
          <td>${row.count.toLocaleString()}</td>
          <td>${formatNumber(row.firstTimestamp, 6)}</td>
          <td>${formatNumber(row.lastTimestamp, 6)}</td>
          <td>${row.averageHz === null ? "" : formatNumber(row.averageHz, 3)}</td>
          <td>${row.dlcs.join(", ")}</td>
          <td>${row.channels.join(", ")}</td>
          <td>${escapeHtml(row.dbcName ?? "")}</td>
          <td>${row.dbcSignalCount ?? ""}</td>
        </tr>
      `
    )
    .join("");

  els.idCountLabel.textContent = `${rows.length.toLocaleString()} unique IDs`;
}

function renderWarnings() {
  const warnings = appState.warnings;

  if (!warnings.length) {
    els.warningsList.innerHTML = `<p class="muted">No parsing warnings.</p>`;
    return;
  }

  const maxShown = 200;
  const shown = warnings.slice(0, maxShown);

  els.warningsList.innerHTML =
    shown
      .map(
        (warning) => `
          <div class="warning-item">
            <strong>Line ${warning.lineNumber}:</strong> ${escapeHtml(warning.reason)}
            <code>${escapeHtml(warning.line)}</code>
          </div>
        `
      )
      .join("") +
    (warnings.length > maxShown
      ? `<p class="muted">Showing first ${maxShown} of ${warnings.length.toLocaleString()} warnings.</p>`
      : "");
}

function renderPlotSelectors() {
  const rows = appState.summary?.ids ?? [];

  els.plotIdSelect.innerHTML = rows
    .map(
      (row) => `
        <option value="${row.id}:${row.isExtended}">
          0x${row.idHex} — ${row.count.toLocaleString()} frames
        </option>
      `
    )
    .join("");
}

function renderBytePlot() {
  if (!appState.frames.length) return;

  const selected = els.plotIdSelect.value;
  if (!selected) return;

  const [idText, isExtendedText] = selected.split(":");
  const id = Number(idText);
  const isExtended = isExtendedText === "true";
  const byteIndex = Number(els.plotByteSelect.value);

  const series = getByteSeries(appState.frames, id, isExtended, byteIndex);
  const sampled = downsamplePairs(series.x, series.y, 8000);

  const points = sampled.x.map((xValue, i) => ({
    x: xValue,
    y: sampled.y[i]
  }));

  const ctx = els.byteChart.getContext("2d");

  if (appState.chart) {
    appState.chart.destroy();
  }

  appState.chart = new Chart(ctx, {
    type: "line",
    data: {
      datasets: [
        {
          label: `Byte ${byteIndex}`,
          data: points,
          pointRadius: points.length <= 500 ? 3 : 0,
          pointHoverRadius: 5,
          borderWidth: 2,
          tension: 0,
          showLine: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      parsing: false,
      scales: {
        x: {
          type: "linear",
          title: {
            display: true,
            text: "Timestamp"
          },
          ticks: {
            maxTicksLimit: 10
          }
        },
        y: {
          type: "linear",
          min: 0,
          max: 255,
          title: {
            display: true,
            text: `Byte ${byteIndex} value`
          }
        }
      },
      plugins: {
        legend: {
          display: true
        },
        tooltip: {
          mode: "nearest",
          intersect: false
        }
      }
    }
  });
}

async function handleDbcUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  appState.dbcFile = file;
  els.dbcStatusLabel.textContent = `Loading ${file.name}...`;

  try {
    const text = await file.text();
    const result = parseDbcText(text);

    appState.dbc = result.dbc;
    appState.dbcWarnings = result.warnings;

    enrichIdSummaryWithDbc();
    renderIdSummaryTable();
    renderDbcBrowser();
    renderPlotSelectors();
    renderDecodedSignalSelector();
    renderDebugJson();

    els.dbcStatusLabel.textContent =
      `${file.name} loaded. Parsed ${result.dbc.messages.length.toLocaleString()} messages.`;
  } catch (err) {
    console.error(err);
    els.dbcStatusLabel.textContent = `Failed to load DBC: ${err.message}`;
  }
}

function parseDbcText(text) {
  const lines = text.split(/\r?\n/);
  const messages = [];
  const messagesById = new Map();
  const warnings = [];

  let currentMessage = null;

  const messageRegex = /^BO_\s+(\d+)\s+([A-Za-z0-9_]+)\s*:\s*(\d+)\s+(.+)$/;

  const signalRegex =
    /^SG_\s+([A-Za-z0-9_]+)(?:\s+[mM][A-Za-z0-9_]*)?\s*:\s*(\d+)\|(\d+)@([01])([+-])\s+\(([-+0-9.eE]+),\s*([-+0-9.eE]+)\)\s+\[([-+0-9.eE]+)\|([-+0-9.eE]+)\]\s+"([^"]*)"\s*(.*)$/;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) continue;

    const messageMatch = line.match(messageRegex);
    if (messageMatch) {
      const id = Number(messageMatch[1]);
      const name = messageMatch[2];
      const dlc = Number(messageMatch[3]);
      const transmitter = messageMatch[4].trim();

      currentMessage = {
        id,
        idHex: dbcIdToHex(id),
        name,
        dlc,
        transmitter,
        signals: []
      };

      messages.push(currentMessage);
      messagesById.set(id, currentMessage);
      continue;
    }

    const signalMatch = line.match(signalRegex);
    if (signalMatch && currentMessage) {
      const signal = {
        name: signalMatch[1],
        startBit: Number(signalMatch[2]),
        length: Number(signalMatch[3]),
        byteOrder: signalMatch[4] === "1" ? "little" : "big",
        isSigned: signalMatch[5] === "-",
        scale: Number(signalMatch[6]),
        offset: Number(signalMatch[7]),
        minimum: Number(signalMatch[8]),
        maximum: Number(signalMatch[9]),
        unit: signalMatch[10],
        receivers: signalMatch[11].trim()
      };

      currentMessage.signals.push(signal);
      continue;
    }

    if (line.startsWith("SG_") && !currentMessage) {
      warnings.push({
        lineNumber: i + 1,
        line: rawLine,
        reason: "Signal appeared before any BO_ message definition"
      });
    } else if (line.startsWith("SG_")) {
      warnings.push({
        lineNumber: i + 1,
        line: rawLine,
        reason: "Unsupported or unrecognized SG_ signal line"
      });
    }
  }

  return {
    dbc: {
      messages,
      messagesById
    },
    warnings
  };
}

function dbcIdToHex(id) {
  return id.toString(16).toUpperCase();
}

function enrichIdSummaryWithDbc() {
  if (!appState.summary || !appState.dbc) return;

  for (const row of appState.summary.ids) {
    const dbcMessage = appState.dbc.messagesById.get(row.id);

    row.dbcName = dbcMessage?.name ?? "";
    row.dbcSignalCount = dbcMessage?.signals?.length ?? 0;
  }
}

function getByteSeries(frames, id, isExtended, byteIndex) {
  const x = [];
  const y = [];

  for (const frame of frames) {
    if (frame.id !== id) continue;
    if (frame.isExtended !== isExtended) continue;
    if (byteIndex >= frame.data.length) continue;

    x.push(frame.timestamp);
    y.push(frame.data[byteIndex]);
  }

  return { x, y };
}

function downsamplePairs(x, y, maxPoints = 8000) {
  if (x.length <= maxPoints) {
    return { x, y };
  }

  const step = Math.ceil(x.length / maxPoints);
  const xs = [];
  const ys = [];

  for (let i = 0; i < x.length; i += step) {
    xs.push(x[i]);
    ys.push(y[i]);
  }

  return { x: xs, y: ys };
}

function renderDebugJson() {
  const debug = {
    summary: appState.summary,
    dbc: appState.dbc
      ? {
          messageCount: appState.dbc.messages.length,
          firstMessages: appState.dbc.messages.slice(0, 5)
        }
      : null,
    lastDecodedSignal: appState.lastDecodedSignalMeta
      ? {
          message: appState.lastDecodedSignalMeta.message.name,
          signal: appState.lastDecodedSignalMeta.signal.name,
          decodedRows: appState.lastDecodedSignalRows.length,
          firstRows: appState.lastDecodedSignalRows.slice(0, 5)
        }
      : null,
    firstFrames: appState.frames.slice(0, 5),
    firstWarnings: appState.warnings.slice(0, 10),
    firstDbcWarnings: appState.dbcWarnings.slice(0, 10)
  };

  els.debugJson.textContent = JSON.stringify(debug, null, 2);
}

function goToPreviousPage() {
  if (appState.currentPage > 1) {
    appState.currentPage--;
    renderMessagesTable();
  }
}

function goToNextPage() {
  const totalPages = Math.max(
    1,
    Math.ceil(appState.filteredFrames.length / appState.rowsPerPage)
  );

  if (appState.currentPage < totalPages) {
    appState.currentPage++;
    renderMessagesTable();
  }
}

function exportFilteredCsv() {
  const rows = appState.filteredFrames;

  const header = [
    "timestamp",
    "channel",
    "id_hex",
    "is_extended",
    "direction",
    "dlc",
    "data_hex",
    "line_number"
  ];

  const csvRows = [
    header.join(","),
    ...rows.map((frame) =>
      [
        frame.timestamp,
        frame.channel,
        `0x${frame.idHex}`,
        frame.isExtended,
        frame.direction,
        frame.dlc,
        `"${formatDataBytes(frame.data)}"`,
        frame.lineNumber ?? ""
      ].join(",")
    )
  ];

  const blob = new Blob([csvRows.join("\n")], {
    type: "text/csv;charset=utf-8"
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  const baseName = appState.file?.name?.replace(/\.[^.]+$/, "") || "can_log";
  a.href = url;
  a.download = `${baseName}_filtered_messages.csv`;
  a.click();

  URL.revokeObjectURL(url);
}

function clearApp() {
  appState.file = null;
  appState.frames = [];
  appState.filteredFrames = [];
  appState.warnings = [];
  appState.summary = null;
  appState.currentPage = 1;

  if (appState.chart) {
    appState.chart.destroy();
    appState.chart = null;
  }

  els.ascFileInput.value = "";
  els.fileStatus.textContent = "No file loaded.";
  els.exportCsvButton.disabled = true;

  els.summarySection.innerHTML = "";
  els.messagesTableBody.innerHTML = "";
  els.idsTableBody.innerHTML = "";
  els.warningsList.innerHTML = "";
  els.debugJson.textContent = "{}";
  els.messageCountLabel.textContent = "";
  els.idCountLabel.textContent = "";
  els.pageLabel.textContent = "";
  els.plotIdSelect.innerHTML = "";
  appState.dbcFile = null;
    appState.dbc = null;
    appState.dbcWarnings = [];
    els.dbcFileInput.value = "";
    els.dbcStatusLabel.textContent = "No DBC loaded.";
    els.dbcMessagesTableBody.innerHTML = "";
    els.dbcSignalsTableBody.innerHTML = "";
    appState.decodedChart = null;
    appState.lastDecodedSignalRows = [];
    appState.lastDecodedSignalMeta = null;

    els.decodedSignalSelect.innerHTML = "";
    els.decodedSignalTableBody.innerHTML = "";
    els.decodedStatusLabel.textContent = "Load an ASC and DBC file to decode signals.";
    els.exportDecodedCsvButton.disabled = true;
    if (appState.decodedChart) {
        appState.decodedChart.destroy();
        appState.decodedChart = null;
    }
}

function formatDataBytes(data) {
  return Array.from(data)
    .map((value) => value.toString(16).toUpperCase().padStart(2, "0"))
    .join(" ");
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "";

  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatNumber(value, digits = 3) {
  if (!Number.isFinite(value)) return "";
  return Number(value).toLocaleString(undefined, {
    maximumFractionDigits: digits
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderDbcBrowser() {
  const dbc = appState.dbc;

  if (!dbc) {
    els.dbcMessagesTableBody.innerHTML = "";
    els.dbcSignalsTableBody.innerHTML = "";
    els.dbcStatusLabel.textContent = "No DBC loaded.";
    return;
  }

  els.dbcMessagesTableBody.innerHTML = dbc.messages
    .map(
      (msg) => `
        <tr>
          <td class="data-cell">0x${escapeHtml(msg.idHex)}</td>
          <td>${escapeHtml(msg.name)}</td>
          <td>${msg.dlc}</td>
          <td>${escapeHtml(msg.transmitter)}</td>
          <td>${msg.signals.length}</td>
        </tr>
      `
    )
    .join("");

  const signalRows = [];

  for (const msg of dbc.messages) {
    for (const sig of msg.signals) {
      signalRows.push({ msg, sig });
    }
  }

  els.dbcSignalsTableBody.innerHTML = signalRows
    .map(
      ({ msg, sig }) => `
        <tr>
          <td>${escapeHtml(msg.name)}</td>
          <td>${escapeHtml(sig.name)}</td>
          <td>${sig.startBit}</td>
          <td>${sig.length}</td>
          <td>${sig.byteOrder}</td>
          <td>${sig.isSigned ? "yes" : "no"}</td>
          <td>${sig.scale}</td>
          <td>${sig.offset}</td>
          <td>${escapeHtml(sig.unit)}</td>
        </tr>
      `
    )
    .join("");
}

function renderDecodedSignalSelector() {
  if (!appState.dbc || !appState.dbc.messages.length) {
    els.decodedSignalSelect.innerHTML = "";
    els.decodedStatusLabel.textContent = "Load an ASC and DBC file to decode signals.";
    els.exportDecodedCsvButton.disabled = true;
    return;
  }

  const options = [];

  for (const message of appState.dbc.messages) {
    for (const signal of message.signals) {
      const unsupported = signal.byteOrder !== "little";
      const label =
        `0x${message.idHex} / ${message.name} / ${signal.name}` +
        (signal.unit ? ` (${signal.unit})` : "") +
        (unsupported ? " — big-endian not supported yet" : "");

      options.push({
        value: `${message.id}::${signal.name}`,
        label,
        disabled: unsupported
      });
    }
  }

  els.decodedSignalSelect.innerHTML = options
    .map(
      (opt) => `
        <option value="${escapeHtml(opt.value)}" ${opt.disabled ? "disabled" : ""}>
          ${escapeHtml(opt.label)}
        </option>
      `
    )
    .join("");

  els.decodedStatusLabel.textContent =
    `${options.length.toLocaleString()} DBC signals available. Little-endian signals can be decoded.`;
}

function decodeAndPlotSelectedSignal() {
  const selected = els.decodedSignalSelect.value;

  if (!selected || !appState.dbc || !appState.frames.length) {
    els.decodedStatusLabel.textContent = "Load an ASC log and DBC file first.";
    return;
  }

  const [messageIdText, signalName] = selected.split("::");
  const messageId = Number(messageIdText);

  const message = appState.dbc.messagesById.get(messageId);
  if (!message) {
    els.decodedStatusLabel.textContent = "Selected DBC message was not found.";
    return;
  }

  const signal = message.signals.find((s) => s.name === signalName);
  if (!signal) {
    els.decodedStatusLabel.textContent = "Selected DBC signal was not found.";
    return;
  }

  if (signal.byteOrder !== "little") {
    els.decodedStatusLabel.textContent =
      "This signal is big-endian / Motorola. The MVP decoder currently supports little-endian / Intel signals only.";
    return;
  }

  const rows = decodeSignalRows(appState.frames, message, signal);

  appState.lastDecodedSignalRows = rows;
  appState.lastDecodedSignalMeta = { message, signal };

  renderDecodedSignalTable(rows);
  renderDecodedSignalPlot(rows, message, signal);

  els.exportDecodedCsvButton.disabled = rows.length === 0;

  els.decodedStatusLabel.textContent =
    `Decoded ${rows.length.toLocaleString()} values for ${message.name}.${signal.name}.`;
}

function decodeSignalRows(frames, message, signal) {
  const rows = [];

  for (const frame of frames) {
    if (frame.id !== message.id) continue;
    if (frame.data.length < message.dlc) continue;

    const raw = extractLittleEndianSignalRaw(
      frame.data,
      signal.startBit,
      signal.length,
      signal.isSigned
    );

    if (raw === null) continue;

    const value = raw * signal.scale + signal.offset;

    rows.push({
      timestamp: frame.timestamp,
      id: frame.id,
      idHex: frame.idHex,
      messageName: message.name,
      signalName: signal.name,
      raw,
      value,
      unit: signal.unit
    });
  }

  return rows;
}

function extractLittleEndianSignalRaw(data, startBit, length, isSigned) {
  if (!Number.isInteger(startBit) || !Number.isInteger(length)) return null;
  if (length <= 0 || length > 52) return null;

  const totalBits = data.length * 8;
  if (startBit < 0 || startBit + length > totalBits) return null;

  let raw = 0n;

  for (let i = 0; i < data.length; i++) {
    raw |= BigInt(data[i]) << BigInt(i * 8);
  }

  const mask = (1n << BigInt(length)) - 1n;
  let value = (raw >> BigInt(startBit)) & mask;

  if (isSigned) {
    const signBit = 1n << BigInt(length - 1);
    if ((value & signBit) !== 0n) {
      value -= 1n << BigInt(length);
    }
  }

  return Number(value);
}

function renderDecodedSignalTable(rows) {
  const maxRows = 500;
  const shown = rows.slice(0, maxRows);

  els.decodedSignalTableBody.innerHTML = shown
    .map(
      (row) => `
        <tr>
          <td>${formatNumber(row.timestamp, 6)}</td>
          <td class="data-cell">0x${escapeHtml(row.idHex)}</td>
          <td>${escapeHtml(row.messageName)}</td>
          <td>${escapeHtml(row.signalName)}</td>
          <td>${formatNumber(row.value, 6)}</td>
          <td>${escapeHtml(row.unit ?? "")}</td>
        </tr>
      `
    )
    .join("");

  if (rows.length > maxRows) {
    els.decodedSignalTableBody.innerHTML += `
      <tr>
        <td colspan="6" class="muted">
          Showing first ${maxRows.toLocaleString()} of ${rows.length.toLocaleString()} decoded rows.
        </td>
      </tr>
    `;
  }
}

function renderDecodedSignalPlot(rows, message, signal) {
  const sampledRows = downsampleRows(rows, 8000);

  const points = sampledRows.map((row) => ({
    x: row.timestamp,
    y: row.value
  }));

  const ctx = els.decodedSignalChart.getContext("2d");

  if (appState.decodedChart) {
    appState.decodedChart.destroy();
  }

  appState.decodedChart = new Chart(ctx, {
    type: "line",
    data: {
      datasets: [
        {
          label: `${message.name}.${signal.name}${signal.unit ? ` (${signal.unit})` : ""}`,
          data: points,
          pointRadius: points.length <= 500 ? 3 : 0,
          pointHoverRadius: 5,
          borderWidth: 2,
          tension: 0,
          showLine: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      parsing: false,
      scales: {
        x: {
          type: "linear",
          title: {
            display: true,
            text: "Timestamp"
          },
          ticks: {
            maxTicksLimit: 10
          }
        },
        y: {
          type: "linear",
          title: {
            display: true,
            text: signal.unit ? `Value (${signal.unit})` : "Value"
          }
        }
      },
      plugins: {
        legend: {
          display: true
        },
        tooltip: {
          mode: "nearest",
          intersect: false
        }
      }
    }
  });
}

function downsampleRows(rows, maxPoints = 8000) {
  if (rows.length <= maxPoints) return rows;

  const step = Math.ceil(rows.length / maxPoints);
  const sampled = [];

  for (let i = 0; i < rows.length; i += step) {
    sampled.push(rows[i]);
  }

  return sampled;
}

function exportDecodedSignalCsv() {
  const rows = appState.lastDecodedSignalRows;
  const meta = appState.lastDecodedSignalMeta;

  if (!rows.length || !meta) return;

  const header = [
    "timestamp",
    "id_hex",
    "message_name",
    "signal_name",
    "raw_value",
    "physical_value",
    "unit"
  ];

  const csvRows = [
    header.join(","),
    ...rows.map((row) =>
      [
        row.timestamp,
        `0x${row.idHex}`,
        csvEscape(row.messageName),
        csvEscape(row.signalName),
        row.raw,
        row.value,
        csvEscape(row.unit ?? "")
      ].join(",")
    )
  ];

  const blob = new Blob([csvRows.join("\n")], {
    type: "text/csv;charset=utf-8"
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  const baseName = appState.file?.name?.replace(/\.[^.]+$/, "") || "can_log";
  const safeSignalName = meta.signal.name.replace(/[^A-Za-z0-9_-]+/g, "_");

  a.href = url;
  a.download = `${baseName}_${safeSignalName}_decoded.csv`;
  a.click();

  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}