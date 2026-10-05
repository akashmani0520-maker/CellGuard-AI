// Display helpers -----------------------------------------------------------------

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function fmt(v, dec = 2) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return "—";
  return Number(v).toFixed(dec);
}

export function fmtVolt(v, dec = 2) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return "—";
  return `${Number(v).toFixed(dec)} V`;
}

export function fmtTemp(v, dec = 1) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return "—";
  return `${Number(v).toFixed(dec)} °C`;
}

export function fmtPct(v, dec = 1) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return "—";
  return `${Number(v).toFixed(dec)}%`;
}

export function fmtAmp(v, dec = 2) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return "—";
  return `${Number(v).toFixed(dec)} A`;
}

export function fmtWatt(v, dec = 0) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return "—";
  return `${Number(v).toFixed(dec)} W`;
}

export function fmtWh(v, dec = 0) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return "—";
  return `${Number(v).toFixed(dec)} Wh`;
}

export function fmtAh(v, dec = 2) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return "—";
  return `${Number(v).toFixed(dec)} Ah`;
}

export function fmtUptime(ms) {
  if (!ms) return "0s";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s % 60}s`;
}

export function fmtTime(ts) {
  if (!ts) return "—";
  const n = Number(ts);
  if (Number.isNaN(n) || n <= 0) return "—";
  const d = new Date(n);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export function fmtClock(ts) {
  if (!ts) return "—";
  const n = Number(ts);
  if (Number.isNaN(n) || n <= 0) return "—";
  return new Date(n).toLocaleTimeString();
}

export function ago(ts) {
  if (!ts) return "—";
  const n = Number(ts);
  if (Number.isNaN(n) || n <= 0) return "—";
  const diff = Math.max(0, Date.now() - n);
  const s = Math.floor(diff / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function nf(num, dec = 2) {
  const n = Number(num);
  if (Number.isNaN(n)) return "0";
  return n.toLocaleString(undefined, { maximumFractionDigits: dec });
}

export function sign(v) {
  const n = Number(v) || 0;
  return n > 0 ? "+" : n < 0 ? "−" : "";
}
