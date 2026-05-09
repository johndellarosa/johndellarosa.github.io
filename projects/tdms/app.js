import {
  parseTdms,
  readChannelPreview,
  readChannelSeries,
  getChannelStats,
} from "./tdms.js";

const fileInput = document.getElementById("fileInput");
const objectTree = document.getElementById("objectTree");
const summary = document.getElementById("summary");
const selectedObject = document.getElementById("selectedObject");
const warnings = document.getElementById("warnings");
const channelPreview = document.getElementById("channelPreview");
const channelPlot = document.getElementById("channelPlot");
const channelTableBody = document.querySelector("#channelTable tbody");
let currentBuffer = null;

fileInput.addEventListener("change", async event => {
  const file = event.target.files?.[0];
  if (!file) return;

  summary.textContent = "Reading file...";
  selectedObject.textContent = "";
  warnings.textContent = "";
  channelPreview.textContent = "";
  channelTableBody.innerHTML = "";
  currentBuffer = null;
    if (channelPlot) {
    channelPlot.innerHTML = "";
    }
  try {
    const buffer = await file.arrayBuffer();
    currentBuffer = buffer;
    const parsed = parseTdms(buffer);
    const inferredGroups = new Set(
    parsed.objects
        .map(o => getGroupNameFromPath(o.path))
        .filter(Boolean)
    );

    summary.textContent = JSON.stringify({
    fileName: file.name,
    fileSizeBytes: file.size,
    segmentCount: parsed.segments.length,
    objectCount: parsed.objects.length,
    groupCount: inferredGroups.size,
    channelCount: parsed.objects.filter(o => o.kind === "channel").length,
    }, null, 2);

    warnings.textContent = parsed.warnings.length
      ? parsed.warnings.join("\n")
      : "No parser warnings.";

    renderObjectTree(parsed.objects);
    renderChannelTable(parsed.objects);    
  } catch (error) {
    summary.textContent = `Failed to parse TDMS file: ${error.message}`;
  }
});

function renderObjectTree(objects) {
  objectTree.innerHTML = "";

  for (const obj of objects) {
    const button = document.createElement("button");
    button.className = "object-button";
    button.textContent = `${obj.kind}: ${obj.path}`;
    button.addEventListener("click", () => {
      if (obj.kind === "channel") {
        selectAndPlotChannel(obj);
      } else {
        selectedObject.textContent = stringifyForDisplay(obj);
        channelPreview.textContent = "Select a channel to preview values.";
        if (channelPlot) {
          channelPlot.innerHTML = "";
        }
      }
    });
    objectTree.appendChild(button);
  }
}

function getGroupNameFromPath(path) {
  const matches = [...path.matchAll(/'((?:''|[^'])*)'/g)];
  if (matches.length >= 1) {
    return matches[0][1].replaceAll("''", "'");
  }
  return null;
}

function stringifyForDisplay(value) {
  return JSON.stringify(
    value,
    (key, val) => {
      if (typeof val === "bigint") {
        return val.toString();
      }
      return val;
    },
    2
  );
}

function plotChannel(series) {
  if (!window.Plotly) {
    channelPlot.textContent = "Plotly did not load.";
    return;
  }

  const trace = {
    x: series.x,
    y: series.y,
    mode: "lines",
    type: "scatter",
    name: series.name,
  };

  const layout = {
    title: {
      text: series.name,
    },
    xaxis: {
      title: {
        text: series.xLabel,
      },
    },
    yaxis: {
      title: {
        text: series.yLabel,
      },
    },
    margin: {
      l: 70,
      r: 30,
      t: 50,
      b: 60,
    },
    annotations: [
      {
        text: `Showing ${series.plottedValues.toLocaleString()} of ${series.totalValues.toLocaleString()} values`,
        xref: "paper",
        yref: "paper",
        x: 1,
        y: 1.08,
        showarrow: false,
        xanchor: "right",
        font: {
          size: 12,
        },
      },
    ],
  };

  const config = {
    responsive: true,
    displaylogo: false,
  };

  Plotly.newPlot(channelPlot, [trace], layout, config);
}

function renderChannelTable(objects) {
  channelTableBody.innerHTML = "";

  const channels = objects.filter(obj => obj.kind === "channel");

  for (const channel of channels) {
    const row = document.createElement("tr");

    const stats = currentBuffer
      ? getChannelStats(currentBuffer, channel)
      : { min: null, max: null, mean: null, count: 0 };

    const channelName =
      channel.properties?.NI_ChannelName ??
      getChannelNameFromPath(channel.path);

    const unit =
      channel.properties?.unit_string ??
      channel.properties?.NI_UnitDescription ??
      "";

    const typeName =
      channel.rawDataIndex?.typeName ??
      "";

    const sampleCount =
      stats.count ||
      totalValuesFromSegments(channel.rawDataSegments) ||
      channel.rawDataIndex?.valueCount ||
      "";

    const segmentCount = channel.rawDataSegments?.length ?? 0;

    row.innerHTML = `
      <td>${escapeHtml(channelName)}</td>
      <td>${escapeHtml(unit)}</td>
      <td>${escapeHtml(typeName)}</td>
      <td>${formatInteger(sampleCount)}</td>
      <td>${formatInteger(segmentCount)}</td>
      <td>${formatNumber(stats.min)}</td>
      <td>${formatNumber(stats.max)}</td>
      <td>${formatNumber(stats.mean)}</td>
      <td></td>
    `;

    const actionCell = row.querySelector("td:last-child");

    const plotButton = document.createElement("button");
    plotButton.className = "table-button";
    plotButton.textContent = "Plot";
    plotButton.addEventListener("click", () => {
      selectAndPlotChannel(channel);
    });

    actionCell.appendChild(plotButton);
    channelTableBody.appendChild(row);
  }
}

function selectAndPlotChannel(channel) {
  selectedObject.textContent = stringifyForDisplay(channel);

  if (!currentBuffer) {
    channelPreview.textContent = "No file buffer available.";
    return;
  }

  try {
    const preview = readChannelPreview(currentBuffer, channel, 20);
    channelPreview.textContent = stringifyForDisplay(preview);

    const series = readChannelSeries(currentBuffer, channel, {
      maxPoints: 10000,
    });

    plotChannel(series);
  } catch (error) {
    channelPreview.textContent = `Could not preview/plot channel: ${error.message}`;
    if (channelPlot) {
      channelPlot.innerHTML = "";
    }
  }
}

function getChannelNameFromPath(path) {
  const matches = [...path.matchAll(/'((?:''|[^'])*)'/g)];
  if (matches.length >= 2) {
    return matches[1][1].replaceAll("''", "'");
  }
  return path;
}

function totalValuesFromSegments(segments) {
  if (!segments?.length) return null;

  let total = 0;
  for (const segment of segments) {
    const n = Number(segment.valueCount);
    if (Number.isFinite(n)) {
      total += n;
    }
  }

  return total;
}

function formatNumber(value) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "";
  }

  if (Math.abs(value) >= 1000 || Math.abs(value) < 0.001 && value !== 0) {
    return value.toExponential(4);
  }

  return value.toFixed(6).replace(/\.?0+$/, "");
}

function formatInteger(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}