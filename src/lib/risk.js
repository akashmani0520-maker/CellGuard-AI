import { decodeFaultFlags } from "./faults";

export function computeRisk(latest) {
  const t = latest?.telemetry || {};
  const analysis = latest?.analysis || {};
  const temps = Array.isArray(t.temperature) ? t.temperature.map(Number) : [];
  const maxTemp = Math.max(0, ...temps);
  const cells = Array.isArray(t.cell_voltage) ? t.cell_voltage.map(Number) : [];
  const { maxTone, count } = decodeFaultFlags(t.fault_flags);

  let risk = 0;
  if (analysis.is_safe === false) risk += 50;
  if (analysis.anomalies && analysis.anomalies.length) risk += Math.min(20, analysis.anomalies.length * 5);
  if (maxTemp > 45) risk += 20;
  else if (maxTemp > 38) risk += 10;
  if (maxTone === "danger") risk += 15;
  if (count > 0) risk += Math.min(10, count * 2);
  if (cells.some((v) => v <= 2.5 || v > 4.6)) risk += 10;

  risk = Math.max(0, Math.min(100, risk));
  const systemStatus = risk >= 60 ? "DANGER" : risk >= 30 ? "WARNING" : "SAFE";
  const toneKey = risk >= 60 ? "danger" : risk >= 30 ? "warning" : "safe";
  return { risk, systemStatus, toneKey, maxTemp };
}
