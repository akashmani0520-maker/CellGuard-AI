import { Bell, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { useTelemetryCtx } from "../context/TelemetryContext";
import { Card, Pill } from "../components/ui";
import { decodeFaultFlags } from "../lib/faults";
import { fmtTime, ago } from "../lib/format";

function buildFeed(latest, history) {
  const feed = [];
  if (latest && latest.analysis && latest.analysis.anomalies.length) {
    latest.analysis.anomalies.forEach((a) =>
      feed.push({ id: `latest-${a}`, time: latest.timestamp, type: "ANOMALY", message: a, severity: "danger" })
    );
  }
  if (latest) {
    const f = decodeFaultFlags(latest.telemetry?.fault_flags);
    f.list.forEach((x) =>
      feed.push({ id: `fault-${x.code}`, time: latest.timestamp, type: "FAULT", message: x.label, severity: x.tone })
    );
    if (f.count === 0 && latest.analysis?.is_safe !== false) {
      feed.push({ id: "ok-latest", time: latest.timestamp, type: "OK", message: "No active faults on latest sample", severity: "ok" });
    }
  }
  (history || []).slice().reverse().forEach((h) => {
    if (!h || h.analysis?.is_safe) return;
    const f = decodeFaultFlags(h.telemetry?.fault_flags);
    f.list.forEach((x) =>
      feed.push({ id: `${h.timestamp}-${x.code}`, time: h.timestamp, type: "FAULT", message: x.label, severity: x.tone })
    );
  });
  // dedupe by id, keep latest, cap 50
  const map = new Map();
  feed.forEach((x) => map.set(x.id, x));
  return Array.from(map.values()).sort((a, b) => Number(b.time) - Number(a.time)).slice(0, 50);
}

const sevStyles = {
  danger: "border-rose-500/30 bg-rose-500/10",
  warning: "border-amber-500/30 bg-amber-500/10",
  ok: "border-emerald-500/30 bg-emerald-500/10",
};

export default function Alerts() {
  const { latest, history, status } = useTelemetryCtx();
  const feed = buildFeed(latest, history);

  return (
    <Card icon={<Bell className="h-4 w-4 text-cyan-300" />} title="Alerts & Anomalies" subtitle="Derived from fault mask and cloud analysis"
      actions={<Pill toneKey={feed.some((a) => a.severity === "danger") ? "danger" : "safe"} pulse>{feed.filter((a) => a.severity === "danger").length} critical</Pill>}>
      {!latest && status.loading ? (
        <div className="h-40 flex items-center justify-center text-sm text-slate-500">Loading alerts…</div>
      ) : feed.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-slate-500"><CheckCircle2 className="h-8 w-8 mb-2 text-emerald-400" /><span className="text-sm">No alerts recorded.</span></div>
      ) : (
        <ul className="space-y-2">
          {feed.map((a) => {
            const Icon = a.severity === "ok" ? CheckCircle2 : a.severity === "warning" ? Info : AlertTriangle;
            return (
              <li key={a.id} className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${sevStyles[a.severity] || sevStyles.ok}`}>
                <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${a.severity === "danger" ? "text-rose-300" : a.severity === "warning" ? "text-amber-300" : "text-emerald-300"}`} />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-100">{a.message}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    <span className="font-mono">{a.type}</span> · {fmtTime(a.time)}{a.time ? ` · ${ago(a.time)}` : ""}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
