import { decodeFaultFlags } from "./faults.js";

/**
 * Computes heuristic fire and operational safety risk (0 - 100%) for a 3S pack:
 * - Active fault flags from ESP32
 * - Over-temperature and thermal runaway proximity (> 45°C warning, > 55°C cutoff)
 * - 3S series cell voltage extremes (< 2.85V cutoff, > 4.25V overcharge)
 * - Cell-to-cell delta imbalance (> 120mV advisory, > 300mV severe)
 * - Analysis flags and detected anomalies
 */
export function computeRisk(latest) {
  if (!latest) {
    return { risk: 0, systemStatus: "SAFE", toneKey: "safe", maxTemp: 0 };
  }

  const t = latest?.telemetry || {};
  const analysis = latest?.analysis || {};
  const temps = Array.isArray(t.temperature) ? t.temperature.map(Number) : [];
  const maxTemp = temps.length ? Math.max(...temps) : 0;
  const cells = Array.isArray(t.cell_voltage) ? t.cell_voltage.map(Number) : [];
  const { maxTone, count } = decodeFaultFlags(t.fault_flags);

  let risk = 0;

  // 1. Hardware protection faults from ESP32
  if (maxTone === "danger") risk += 35;
  else if (maxTone === "warning") risk += 15;
  if (count > 0) risk += Math.min(25, count * 5);

  // 2. Thermal profile
  if (maxTemp >= 55) {
    risk += 45; // Critical thermal cutoff / runaway zone
  } else if (maxTemp > 45) {
    risk += 25; // Overtemp warning
  } else if (maxTemp > 38) {
    risk += 10; // Warm operation
  }

  // 3. 3S Series Cell Health
  const minCell = cells.length ? Math.min(...cells) : 3.7;
  const maxCell = cells.length ? Math.max(...cells) : 3.7;
  const cellDelta = maxCell - minCell;

  // Severe overcharge or overdischarge
  if (cells.some((v) => v < 2.70 || v > 4.30)) {
    risk += 40;
  } else if (cells.some((v) => v < 2.90 || v > 4.24)) {
    risk += 20;
  }

  // Cell voltage imbalance across 3S stack
  if (cellDelta >= 0.30) {
    risk += 25; // Severe delta > 300 mV
  } else if (cellDelta >= 0.12) {
    risk += 12; // Delta advisory > 120 mV
  }

  // 4. Anomalies from analysis
  const anomalies = Array.isArray(analysis.anomalies) ? analysis.anomalies : [];
  if (anomalies.length > 0) {
    risk += Math.min(20, anomalies.length * 5);
  }

  // If explicitly flagged unsafe by BMS or AI analysis, guarantee at least warning
  if (analysis.is_safe === false && risk < 30) {
    risk = 35;
  }

  risk = Math.max(0, Math.min(100, Math.round(risk)));
  const systemStatus = risk >= 60 ? "DANGER" : risk >= 30 ? "WARNING" : "SAFE";
  const toneKey = risk >= 60 ? "danger" : risk >= 30 ? "warning" : "safe";

  return { risk, systemStatus, toneKey, maxTemp, cellDelta, minCell, maxCell };
}
