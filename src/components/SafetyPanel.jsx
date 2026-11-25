import { ShieldAlert, ShieldCheck } from "lucide-react";
import { useTelemetryCtx } from "../context/TelemetryContext";
import { Card } from "./ui";
import { computeRisk } from "../lib/risk";

function Ring({ value, toneKey }) {
  const r = 62;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const colors = { safe: "#34d399", warning: "#fbbf24", danger: "#fb7185" };
  const color = colors[toneKey] || colors.safe;
  return (
    <div className="relative h-44 w-44">
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
        <circle cx="80" cy="80" r={r} fill="none" stroke="#1e293b" strokeWidth="12" />
        <circle
          cx="80" cy="80" r={r} fill="none" stroke={color} strokeWidth="12"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tabular text-4xl font-bold" style={{ color }}>{Math.round(value)}%</span>
        <span className="text-[11px] uppercase tracking-wider text-slate-400 mt-1">Fire Risk</span>
      </div>
    </div>
  );
}

export default function SafetyPanel() {
  const { latest } = useTelemetryCtx();
  const { risk, systemStatus, toneKey } = computeRisk(latest);
  const isHealthy = toneKey === "safe";
  const Icon = isHealthy ? ShieldCheck : ShieldAlert;

  const statusText = isHealthy
    ? "Analysis: all 3S cells balanced, temperatures nominal, zero faults active."
    : toneKey === "warning"
    ? "Analysis: advisory active — check cell drift and thermal channels."
    : "Analysis: critical protection threshold exceeded — review active faults.";

  return (
    <Card
      icon={<Icon className={`h-4 w-4 ${toneKey === "danger" ? "text-rose-400" : toneKey === "warning" ? "text-amber-400" : "text-emerald-400"}`} />}
      title="Safety Assessment"
      subtitle="Heuristic fire-risk from faults, temperatures & cell delta"
      actions={
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${
          toneKey === "danger"
            ? "border-rose-500/40 text-rose-300 bg-rose-500/10"
            : toneKey === "warning"
            ? "border-amber-500/40 text-amber-300 bg-amber-500/10"
            : "border-emerald-500/40 text-emerald-300 bg-emerald-500/10"
        }`}>
          {systemStatus}
        </span>
      }
    >
      <div className="flex flex-col items-center justify-center py-2">
        <Ring value={risk} toneKey={toneKey} />
        <p className="mt-4 text-sm text-slate-400 text-center max-w-xs">
          {statusText}
        </p>
      </div>
    </Card>
  );
}
