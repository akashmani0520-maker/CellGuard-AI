// Decode the ESP32 fault bitmask into human / machine-readable labels.
// Order mirrors the firmware `FaultFlags` enum.

export const FAULT_BITS = [
  { bit: 0,  code: "CELL_OV",         label: "Cell Overvoltage",       tone: "danger" },
  { bit: 1,  code: "CELL_UV",         label: "Cell Undervoltage",      tone: "warning" },
  { bit: 2,  code: "PACK_OV",         label: "Pack Overvoltage",       tone: "danger" },
  { bit: 3,  code: "PACK_UV",         label: "Pack Undervoltage",      tone: "warning" },
  { bit: 4,  code: "CHARGE_OC",       label: "Charge Overcurrent",     tone: "danger" },
  { bit: 5,  code: "DISCHARGE_OC",    label: "Discharge Overcurrent",  tone: "danger" },
  { bit: 6,  code: "SHORT",           label: "Short Circuit",          tone: "danger" },
  { bit: 7,  code: "CHARGE_OT",       label: "Charge Overtemp",        tone: "danger" },
  { bit: 8,  code: "DISCHARGE_OT",    label: "Discharge Overtemp",     tone: "danger" },
  { bit: 9,  code: "CHARGE_UT",       label: "Charge Undertemp",       tone: "warning" },
  { bit: 10, code: "TEMP_SENSOR",     label: "Temperature Sensor Fault", tone: "danger" },
  { bit: 11, code: "CELL_SENSOR",     label: "Cell Sensor Fault",      tone: "danger" },
  { bit: 12, code: "CURRENT_SENSOR",  label: "Current Sensor Fault",   tone: "danger" },
  { bit: 13, code: "CONFIG",          label: "Configuration Error",    tone: "warning" },
];

export function decodeFaultFlags(flags) {
  const value = Number(flags) || 0;
  const all = FAULT_BITS.filter((f) => value & (1 << f.bit));
  const maxTone = all.reduce((acc, f) =>
    f.tone === "danger" || acc === "danger" ? "danger" : acc, "safe");
  return { value, count: all.length, list: all, maxTone };
}

// Rough colour class by severity tone.
export const tone = {
  safe: "text-emerald-400",
  ok: "text-sky-400",
  warning: "text-amber-400",
  danger: "text-rose-400",
};

export const badgeTone = {
  safe: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  ok: "bg-sky-500/10 text-sky-300 border-sky-500/30",
  warning: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  danger: "bg-rose-500/10 text-rose-300 border-rose-500/30",
};

// Classify a temperature reading into an operational tone.
export function tempTone(t) {
  const n = Number(t);
  if (Number.isNaN(n)) return "safe";
  if (n > 45) return "danger";
  if (n > 38) return "warning";
  if (n < -10) return "warning";
  return "safe";
}

// Classify a cell voltage reading.
export function cellTone(v) {
  const n = Number(v);
  if (Number.isNaN(n)) return "safe";
  if (n <= 0.5 || n > 4.8) return "danger";  // sensor/diagnostic fault
  if (n < 2.8 || n > 4.5) return "warning";
  return "safe";
}
