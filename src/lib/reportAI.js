// Generative-AI report summariser on top of the DeepSeek client.
import { callChatCompletion, getApiKey, getSystemPrompt } from "./deepseek";
import { decodeFaultFlags } from "./faults";
import { computeRisk } from "./risk";

// Trim a live snapshot into a compact, prompt-friendly payload.
export function snapshotReportPayload(latest) {
  const t = (latest && latest.telemetry) || {};
  const risk = computeRisk(latest);
  const faults = decodeFaultFlags(t.fault_flags);
  return {
    device_id: latest?.deviceId,
    timestamp: latest?.timestamp,
    pack_voltage: t.pack_voltage,
    pack_current: t.pack_current,
    pack_power: t.pack_power,
    soc: t.soc,
    soh_percent: t.soh_percent,
    cell_voltage: t.cell_voltage,
    max_cell_voltage: t.max_cell_voltage,
    min_cell_voltage: t.min_cell_voltage,
    cell_delta: t.cell_delta,
    drift: t.drift,
    temperature: t.temperature,
    amp_hours_in: t.amp_hours_in,
    amp_hours_out: t.amp_hours_out,
    energy_in_wh: t.energy_in_wh,
    energy_out_wh: t.energy_out_wh,
    cycle_count: t.cycle_count,
    rssi: t.rssi,
    uptime_ms: t.uptime_ms,
    relays: {
      charging: !!t.charging,
      charger_relay: !!t.charger_relay,
      load_relay: !!t.load_relay,
      charger_detected: !!t.charger_detected,
      load_detected: !!t.load_detected,
    },
    fire_risk_percent: risk.risk,
    system_status: risk.systemStatus,
    analysis_is_safe: latest?.analysis?.is_safe,
    anomalies: latest?.analysis?.anomalies || [],
    active_faults: faults.list.map((f) => f.label),
    fault_flags: t.fault_flags,
  };
}

// Compact a period-analysis result into a prompt-friendly payload.
export function periodReportPayload({ range, stats, deltas }) {
  return {
    range: { start: range?.start ?? null, end: range?.end ?? null },
    samples: stats?.count ?? 0,
    pack_voltage: stats?.packVoltage ?? null,
    pack_current: stats?.packCurrent ?? null,
    pack_power: stats?.packPower ?? null,
    soc: stats?.soc ?? null,
    peak_temperature: stats?.overallMaxTemp ?? null,
    avg_cell: stats?.cellAvg ?? null,
    fault_samples: stats?.faultSamples ?? 0,
    safe_samples: stats?.safeSamples ?? 0,
    anomalies: stats?.anomalies ?? {},
    energy: deltas ?? null,
  };
}

const REPORT_SYSTEM = `You are CellGuard Copilot's reporting module. You write clear, practical
battery-management reports from structured BMS data. Follow these rules:
- Interpret the numbers honestly (note when voltages/currents are negative or
  sensors are faulted, which usually indicates a sensor/connection issue).
- Structure the report as:
  1) Executive summary (2-4 sentences)
  2) Key metrics table (as bullets)
  3) Notable events / anomalies
  4) Risk assessment (based on the provided fire-risk/system status)
  5) Recommended actions (concrete, prioritized)
- Keep it concise and safety-first. Use markdown.`;

export async function generateReport(title, payload) {
  if (!getApiKey()) {
    throw new Error("DeepSeek API key is required. Add one in Settings > AI Assistant.");
  }
  const user =
    `Report title: ${title}\n\n` +
    `Structured data:\n${JSON.stringify(payload, null, 2)}\n\n` +
    `Write the report now.`;
  const data = await callChatCompletion({
    messages: [
      { role: "system", content: `${getSystemPrompt()}\n\n${REPORT_SYSTEM}` },
      { role: "user", content: user },
    ],
  });
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("DeepSeek returned an empty report.");
  return content;
}