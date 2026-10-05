// Tool registry that lets DeepSeek read live BMS data and take control actions.
// executors receive a context with the normalised telemetry + command helper.
import { sendCommand } from "./api";
import { decodeFaultFlags } from "./faults";
import { computeRisk } from "./risk";

const num = (v, d = 2) => (v === undefined || v === null ? null : Number(v).toFixed(d));

export const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_latest_telemetry",
      description: "Get the latest live telemetry snapshot from the BMS node.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_telemetry_history",
      description: "Get recent historical samples for trend analysis (pack voltage/current/power, SOC, temperatures).",
      parameters: {
        type: "object",
        properties: { points: { type: "integer", description: "Number of most-recent points to return (max 50)" } },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_battery_status",
      description: "Get a friendly human-readable status summary including safety assessment and fire risk.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "decode_faults",
      description: "Decode a fault flags bitmask into human readable fault names. Uses latest flags if none provided.",
      parameters: {
        type: "object",
        properties: { flags: { type: "number", description: "fault_flags integer bitmask" } },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_energy_report",
      description: "Get lifecycle and coulomb/energy counters (SOC, SoH, capacity, Ah/Wh in & out, cycle count).",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "send_command",
      description: "Send a relay or maintenance command to the device over AWS IoT. command must be one of load_relay, charger_relay, clear_faults. state for load/charger is 0 (off) or 1 (on).",
      parameters: {
        type: "object",
        properties: {
          command: { type: "string", enum: ["load_relay", "charger_relay", "clear_faults"] },
          state: { type: "number", description: "0 or 1 (only used for load_relay/charger_relay)" },
        },
        required: ["command"],
      },
    },
  },
];

const FAULT_DESCRIPTIONS = {
  CELL_UV: "one or more cells are below the safe undervoltage threshold",
  CELL_OV: "one or more cells are above the overvoltage threshold",
  PACK_UV: "the whole pack voltage is below the pack undervoltage threshold",
  PACK_OV: "the whole pack voltage is above the pack overvoltage threshold",
  CHARGE_OC: "charging current exceeds the overcurrent limit",
  DISCHARGE_OC: "discharging current exceeds the overcurrent limit",
  SHORT: "a short-circuit condition was detected",
  CHARGE_OT: "temperature too high while charging",
  DISCHARGE_OT: "temperature too high while discharging",
  CHARGE_UT: "temperature too low while charging",
  TEMP_SENSOR: "temperature sensor fault (a sensor read is stuck/out of range)",
  CELL_SENSOR: "cell voltage sensor fault (a cell read is invalid)",
  CURRENT_SENSOR: "current sensor fault (current reading slammed to a rail)",
  CONFIG: "configuration error",
};

function latestSummary(latest) {
  if (!latest) return { error: "No telemetry available yet." };
  const t = latest.telemetry || {};
  return {
    timestamp: latest.timestamp,
    device_id: latest.deviceId,
    pack_voltage: Number(t.pack_voltage),
    pack_current: Number(t.pack_current),
    pack_power: Number(t.pack_power),
    soc: Number(t.soc),
    cell_voltage: Array.isArray(t.cell_voltage) ? t.cell_voltage.map(Number) : [],
    max_cell_voltage: Number(t.max_cell_voltage),
    min_cell_voltage: Number(t.min_cell_voltage),
    cell_delta: Number(t.cell_delta),
    drift: Number(t.drift),
    temperature: Array.isArray(t.temperature) ? t.temperature.map(Number) : [],
    charging: Boolean(t.charging),
    charger_relay: Boolean(t.charger_relay),
    load_relay: Boolean(t.load_relay),
    charger_detected: Boolean(t.charger_detected),
    load_detected: Boolean(t.load_detected),
    fault_flags: Number(t.fault_flags),
    analysis_safe: latest.analysis ? !!latest.analysis.is_safe : null,
    anomalies: latest.analysis ? latest.analysis.anomalies : [],
  };
}

export function executeTool(name, args, ctx = {}) {
  const {
    latest,
    history = [],
    deviceId = "NANO_ESP_BMS_NODE_01",
    send = sendCommand,
  } = ctx;

  switch (name) {
    case "get_latest_telemetry":
      return latestSummary(latest);

    case "get_telemetry_history": {
      const points = Math.min(50, Math.max(1, Number(args.points) || 10));
      const list = (Array.isArray(history) ? history : [])
        .slice(-points)
        .map((h) => {
          const t = h.telemetry || {};
          return {
            ts: h.timestamp,
            v: Number(t.pack_voltage),
            i: Number(t.pack_current),
            p: Number(t.pack_power),
            soc: Number(t.soc),
            temps: Array.isArray(t.temperature) ? t.temperature.map(Number) : [],
            safe: h.analysis ? !!h.analysis.is_safe : null,
          };
        });
      return { count: list.length, samples: list };
    }

    case "get_battery_status": {
      const s = latestSummary(latest);
      if (s.error) return s;
      const risk = computeRisk(latest);
      const faults = decodeFaultFlags(s.fault_flags);
      return {
        ...s,
        fire_risk: risk.risk,
        system_status: risk.systemStatus,
        is_safe: s.analysis_safe,
        active_fault_count: faults.count,
        active_faults: faults.list.map((f) => f.label),
      };
    }

    case "decode_faults": {
      const flags = args.flags !== undefined ? Number(args.flags) : (latestSummary(latest).fault_flags || 0);
      const faults = decodeFaultFlags(flags);
      return faults.list.map((f) => ({
        code: f.code,
        label: f.label,
        meaning: FAULT_DESCRIPTIONS[f.code] || "",
        tone: f.tone,
      }));
    }

    case "get_energy_report": {
      const t = latest ? latest.telemetry || {} : {};
      return {
        soc: Number(t.soc),
        soh_percent: Number(t.soh_percent),
        full_capacity_ah: Number(t.full_capacity_ah),
        remaining_capacity: Number(t.remaining_capacity),
        cycle_count: Number(t.cycle_count),
        amp_hours_in: Number(t.amp_hours_in),
        amp_hours_out: Number(t.amp_hours_out),
        energy_in_wh: Number(t.energy_in_wh),
        energy_out_wh: Number(t.energy_out_wh),
      };
    }

    case "send_command": {
      const command = String(args.command || "");
      const allowed = ["load_relay", "charger_relay", "clear_faults"];
      if (!allowed.includes(command)) {
        return { error: `command must be one of ${allowed.join(", ")}` };
      }
      const state = command === "clear_faults" ? 0 : Number(args.state) ? 1 : 0;
      return send(deviceId, command, state).then((r) => ({ ok: true, command, state, response: r }));
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}
