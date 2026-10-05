// CellGuard AWS data layer.
// Backs onto the API Gateway /bms resource backed by AWS Lambda.
// Live records are shaped like:
//   { analysis:{is_safe,anomalies[]}, device_id, timestamp, telemetry:{...} }
// We normalise both that shape and a flat-record fallback into one model.

export const DEFAULT_DEVICE_ID = "NANO_ESP_BMS_NODE_01";
export const API_URL = "https://tj9rsj7k76.execute-api.us-east-1.amazonaws.com/bms";

const NUMERIC_FIELDS = [
  "fault_count", "last_fault_flags", "full_capacity_ah", "energy_out_wh",
  "pack_current", "cell_delta", "min_cell_voltage", "pack_voltage",
  "pack_power", "amp_hours_out", "max_cell_voltage", "drift",
  "fault_flags", "energy_in_wh", "soc", "last_fault_epoch", "rssi",
  "remaining_capacity", "amp_hours_in", "cycle_count", "soh_percent",
  "uptime_ms",
];

const BOOL_FIELDS = [
  "load_detected", "charger_relay", "charging", "bms_online",
  "wifi_online", "charger_detected", "load_relay", "aws_online",
];

function coerceNumbers(telemetry, key, path) {
  if (key === "temperature" || key === "cell_voltage") {
    telemetry[key] = Array.isArray(path) ? path.map((x) => Number(x) || 0) : [];
    return;
  }
  if (NUMERIC_FIELDS.includes(key)) {
    telemetry[key] = Number(path) || 0;
    return;
  }
  if (BOOL_FIELDS.includes(key)) {
    telemetry[key] = path === true || path === 1 || path === "1" || path === "true";
    return;
  }
  telemetry[key] = path;
}

// Accept either { telemetry:{...}, analysis:{...} } wrapper (Lambda/ingestion
// rule) or a flat telemetry record. Returns a normalised snapshot.
export function normalizeTelemetry(item) {
  if (!item || typeof item !== "object") return null;

  const hasWrapper = item.telemetry && typeof item.telemetry === "object";
  const rawTelemetry = hasWrapper ? item.telemetry : item;
  const analysis = item.analysis && typeof item.analysis === "object" ? item.analysis : {};

  const telemetry = {};
  Object.keys(rawTelemetry).forEach((key) =>
    coerceNumbers(telemetry, key, rawTelemetry[key])
  );

  const isSafe = analysis.is_safe === true;
  return {
    deviceId: String(item.device_id || telemetry.device_id || DEFAULT_DEVICE_ID),
    timestamp: item.timestamp || telemetry.timestamp,
    telemetry,
    analysis: {
      is_safe: isSafe,
      anomalies: Array.isArray(analysis.anomalies) ? analysis.anomalies : [],
      ...analysis,
      is_safe: isSafe,
    },
  };
}

export async function fetchLatestTelemetry(deviceId = DEFAULT_DEVICE_ID) {
  const url = `${API_URL}?enquiry=latest&device_id=${encodeURIComponent(deviceId)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Latest telemetry request failed (${res.status})`);
  return normalizeTelemetry(await res.json());
}

export async function fetchBatteryHistory(
  deviceId = DEFAULT_DEVICE_ID,
  start = 0,
  end = 2147483647000
) {
  const url = `${API_URL}?enquiry=history&device_id=${encodeURIComponent(deviceId)}&start=${start}&end=${end}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`History request failed (${res.status})`);
  const list = await res.json();
  if (!Array.isArray(list)) return [];
  return list
    .map(normalizeTelemetry)
    .filter(Boolean)
    .sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
}

export async function sendCommand(deviceId = DEFAULT_DEVICE_ID, command, state = 0) {
  const res = await fetch(API_URL, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ device_id: deviceId, command, state }),
  });
  if (!res.ok) {
    let detail = "";
    try {
      const e = await res.json();
      detail = e?.detail || e?.error || "";
    } catch {}
    throw new Error(`Command '${command}' failed (${res.status})${detail ? `: ${detail}` : ""}`);
  }
  return res.json();
}
