// Mock telemetry data generator for showcase/demo mode.
// Produces realistic BMS snapshots without requiring live hardware.

export const SCENARIOS = {
  nominal: {
    id: "nominal",
    label: "Normal Operation",
    desc: "Battery discharging under moderate load, all cells balanced, temps stable.",
    color: "#10b981",
  },
  charging: {
    id: "charging",
    label: "Charging",
    desc: "CC/CV charging in progress, current flowing in, SOC climbing.",
    color: "#3b82f6",
  },
  high_load: {
    id: "high_load",
    label: "High Load",
    desc: "Heavy discharge load, elevated temperatures, pack current high.",
    color: "#f59e0b",
  },
  cell_imbalance: {
    id: "cell_imbalance",
    label: "Cell Imbalance",
    desc: "One cell drifting low, delta exceeds warning threshold.",
    color: "#f97316",
  },
  thermal_warning: {
    id: "thermal_warning",
    label: "Thermal Warning",
    desc: "Temperature rising on sensor 2, approaching protection threshold.",
    color: "#ef4444",
  },
  low_soc: {
    id: "low_soc",
    label: "Low SoC",
    desc: "Battery near depletion, BMS signalling low energy reserve.",
    color: "#8b5cf6",
  },
  fault: {
    id: "fault",
    label: "Fault Active",
    desc: "BMS has tripped a protection fault, relay open, charge/load blocked.",
    color: "#dc2626",
  },
};

// Clamp helper
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
// Gaussian noise
const jitter = (base, sigma = 0.01) => base + (Math.random() - 0.5) * 2 * sigma;

/**
 * Generate a full normalised telemetry snapshot for a given scenario.
 * @param {string} scenarioId
 * @param {number} tick  - monotonically increasing counter (drives animations)
 * @param {object} overrides - user-supplied field overrides from sliders
 * @returns {{ deviceId, timestamp, telemetry, analysis }}
 */
export function generateSnapshot(scenarioId = "nominal", tick = 0, overrides = {}) {
  const now = Date.now();
  const phase = (tick % 100) / 100; // 0-1 oscillation

  // --- base values per scenario ---
  let packVoltage = 14.4;
  let packCurrent = -4.2;      // negative = discharge
  let soc = 72;
  let temps = [28.5, 29.1, 27.8];
  let cellVoltages = [3.61, 3.60, 3.60, 3.61];
  let bmsOnline = true;
  let loadDetected = true;
  let chargerDetected = false;
  let chargerRelay = false;
  let loadRelay = true;
  let charging = false;
  let faultFlags = 0;
  let faultCount = 0;
  let isSafe = true;
  let anomalies = [];
  let cycleCount = 42;
  let sohPercent = 94;

  switch (scenarioId) {
    case "charging":
      packCurrent = jitter(5.8, 0.15);
      packVoltage = jitter(14.8 + phase * 0.4, 0.02);
      soc = clamp(60 + phase * 35, 0, 100);
      temps = [29 + phase * 2, 30 + phase * 2.5, 28.5 + phase * 1.8].map((t) =>
        jitter(t, 0.3)
      );
      cellVoltages = [3.68, 3.68, 3.68, 3.68].map((v) => jitter(v + phase * 0.08, 0.004));
      chargerDetected = true;
      chargerRelay = true;
      loadRelay = false;
      charging = true;
      loadDetected = false;
      break;

    case "high_load":
      packCurrent = jitter(-18.5 - phase * 4, 0.5);
      packVoltage = jitter(13.6 - phase * 0.3, 0.05);
      soc = clamp(55 - phase * 8, 0, 100);
      temps = [38 + phase * 5, 42 + phase * 6, 36 + phase * 4].map((t) =>
        jitter(t, 0.4)
      );
      cellVoltages = [3.42, 3.41, 3.40, 3.43].map((v) => jitter(v - phase * 0.05, 0.008));
      isSafe = true;
      anomalies = ["High discharge rate"];
      break;

    case "cell_imbalance":
      packVoltage = jitter(14.1, 0.03);
      packCurrent = jitter(-3.1, 0.1);
      soc = jitter(58, 1);
      cellVoltages = [3.55, 3.54, 3.21 + Math.sin(phase * Math.PI) * 0.05, 3.56].map(
        (v) => jitter(v, 0.005)
      );
      temps = [30, 31, 29.5].map((t) => jitter(t, 0.2));
      isSafe = false;
      anomalies = ["Cell 3 voltage deviation", "Cell delta exceeds 300 mV"];
      break;

    case "thermal_warning":
      packVoltage = jitter(14.2, 0.02);
      packCurrent = jitter(-6.5, 0.2);
      soc = jitter(65, 0.5);
      temps = [32, 48 + phase * 10, 31].map((t) => jitter(t, 0.5));
      cellVoltages = [3.55, 3.54, 3.55, 3.55].map((v) => jitter(v, 0.004));
      isSafe = false;
      anomalies = ["Sensor 2 over-temperature", "Thermal runaway risk elevated"];
      break;

    case "low_soc":
      packVoltage = jitter(11.8 - phase * 0.4, 0.03);
      packCurrent = jitter(-2.2, 0.08);
      soc = clamp(8 - phase * 6, 1, 15);
      temps = [27, 27.5, 26.8].map((t) => jitter(t, 0.15));
      cellVoltages = [2.98, 2.97, 2.96, 2.98].map((v) => jitter(v - phase * 0.05, 0.003));
      isSafe = false;
      anomalies = ["Pack SoC critically low", "Min cell voltage approaching cutoff"];
      break;

    case "fault":
      packVoltage = jitter(12.5, 0.1);
      packCurrent = 0;
      soc = jitter(30, 0.2);
      temps = [29, 29.5, 28].map((t) => jitter(t, 0.1));
      cellVoltages = [3.14, 3.13, 3.12, 3.14].map((v) => jitter(v, 0.003));
      faultFlags = 0b00000110; // overcurrent + undervoltage bits
      faultCount = 3;
      chargerRelay = false;
      loadRelay = false;
      bmsOnline = true;
      isSafe = false;
      anomalies = ["FAULT: Overcurrent protection tripped", "FAULT: Undervoltage cell 3", "Relays opened by BMS"];
      break;

    case "nominal":
    default:
      packCurrent = jitter(-4.2 - phase * 1.2, 0.12);
      packVoltage = jitter(14.4 - phase * 0.2, 0.02);
      soc = jitter(72, 0.4);
      temps = [28.5, 29.1, 27.8].map((t) => jitter(t, 0.2));
      cellVoltages = [3.61, 3.60, 3.60, 3.61].map((v) => jitter(v, 0.004));
      break;
  }

  // Apply user overrides (from sliders)
  if (overrides.soc !== undefined) soc = Number(overrides.soc);
  if (overrides.pack_voltage !== undefined) packVoltage = Number(overrides.pack_voltage);
  if (overrides.pack_current !== undefined) packCurrent = Number(overrides.pack_current);
  if (overrides.temperature !== undefined) temps = overrides.temperature;

  const packPower = packVoltage * packCurrent;
  const cellDelta = Math.max(...cellVoltages) - Math.min(...cellVoltages);
  const minCell = Math.min(...cellVoltages);
  const maxCell = Math.max(...cellVoltages);

  const telemetry = {
    pack_voltage: Number(packVoltage.toFixed(3)),
    pack_current: Number(packCurrent.toFixed(3)),
    pack_power: Number(packPower.toFixed(2)),
    soc: Number(soc.toFixed(1)),
    cell_voltage: cellVoltages.map((v) => Number(v.toFixed(4))),
    temperature: temps.map((t) => Number(t.toFixed(2))),
    cell_delta: Number(cellDelta.toFixed(4)),
    min_cell_voltage: Number(minCell.toFixed(4)),
    max_cell_voltage: Number(maxCell.toFixed(4)),
    bms_online: bmsOnline,
    wifi_online: true,
    aws_online: true,
    load_detected: loadDetected,
    charger_detected: chargerDetected,
    charger_relay: chargerRelay,
    load_relay: loadRelay,
    charging,
    fault_flags: faultFlags,
    fault_count: faultCount,
    last_fault_flags: faultFlags,
    last_fault_epoch: faultFlags ? now - 60000 : 0,
    rssi: -58,
    uptime_ms: 3600000 + tick * 1000,
    cycle_count: cycleCount,
    soh_percent: sohPercent,
    full_capacity_ah: 20,
    remaining_capacity: Number(((soc / 100) * 20).toFixed(2)),
    amp_hours_in: 8.3,
    amp_hours_out: 12.1,
    energy_in_wh: 125,
    energy_out_wh: 184,
    drift: Number(cellDelta.toFixed(4)),
    node_id: "MOCK_NODE",
  };

  return {
    deviceId: "MOCK_DEMO_DEVICE",
    timestamp: String(now),
    telemetry,
    analysis: {
      is_safe: isSafe,
      anomalies,
    },
  };
}

/**
 * Generate a backfill of history points for charts.
 * @param {string} scenarioId
 * @param {number} points  number of history entries
 * @returns {Array<{ deviceId, timestamp, telemetry, analysis }>}
 */
export function generateHistory(scenarioId = "nominal", points = 60) {
  const now = Date.now();
  const intervalMs = 5000;
  return Array.from({ length: points }, (_, i) => {
    const tick = i;
    const snap = generateSnapshot(scenarioId, (i * 3) % 100);
    // override timestamp to build a proper time-series
    snap.timestamp = String(now - (points - i) * intervalMs);
    return snap;
  });
}
