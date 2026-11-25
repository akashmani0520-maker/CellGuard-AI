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

  // Enforce 3S battery constraints across all ingested data
  if (Array.isArray(telemetry.cell_voltage)) {
    telemetry.cell_voltage = telemetry.cell_voltage.slice(0, 3).map(Number);
    // If pack_voltage was 4S (e.g. ~14.4V), recompute true 3S sum
    if (telemetry.cell_voltage.length === 3 && telemetry.pack_voltage > 13.0) {
      const sum3 = telemetry.cell_voltage.reduce((a, b) => a + b, 0);
      if (sum3 >= 8.5 && sum3 <= 12.9) {
        telemetry.pack_voltage = Number(sum3.toFixed(3));
      }
    }
  }

  // Ensure power is always a positive magnitude in Watts
  if (telemetry.pack_power !== undefined) {
    telemetry.pack_power = Math.abs(Number(telemetry.pack_power) || 0);
  }

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

/**
 * POST a mock telemetry snapshot directly to DynamoDB via the Lambda POST handler.
 * Bypasses the ESP32 -> IoT Core path so the demo console can verify the full pipeline.
 * @param {object} snapshot  Normalised snapshot from generateSnapshot()
 * @param {string} deviceId  Optional device_id override (defaults to MOCK_DEMO_DEVICE)
 */
export async function publishMockTelemetry(snapshot, deviceId = "MOCK_DEMO_DEVICE") {
  const payload = {
    device_id: deviceId,
    timestamp: String(Date.now()),
    ...snapshot.telemetry,
    // Wrap analysis fields at the top level so Lambda stores them
    is_safe: snapshot.analysis?.is_safe ?? true,
    anomalies: snapshot.analysis?.anomalies ?? [],
  };

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Publish failed (${res.status}): ${json?.error || res.statusText}`);
  }
  return json;
}
