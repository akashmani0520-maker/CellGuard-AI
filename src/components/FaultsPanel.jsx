import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { useTelemetryCtx } from "../context/TelemetryContext";
import { Card, Pill } from "./ui";
import { decodeFaultFlags, tone, badgeTone } from "../lib/faults";
import { fmtTime, fmt } from "../lib/format";

export default function FaultsPanel() {
  const { latest } = useTelemetryCtx();
  const t = latest?.telemetry || {};
  const analysis = latest?.analysis || {};
  const faults = decodeFaultFlags(t.fault_flags);
  const lastFaults = decodeFaultFlags(t.last_fault_flags);
  const safe = analysis.is_safe !== false;

  return (
    <Card
      icon={safe ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <AlertTriangle className="h-4 w-4 text-rose-300" />}
      title="Faults & Anomalies"
      subtitle="Decoded fault mask and AI analysis flags"
    >
      <div className="flex flex-wrap gap-2 mb-4">
        <Pill toneKey={safe ? "safe" : "danger"} pulse={!safe}>
          Analysis: {safe ? "Safe" : "Anomalous"}
        </Pill>
        <Pill toneKey={faults.count ? "danger" : "safe"}>
          {faults.count} active fault{faults.count === 1 ? "" : "s"}
        </Pill>
        {t.fault_count > 0 && (
          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
            <Clock className="h-3.5 w-3.5" /> last fault {fmtTime(t.last_fault_epoch)}
          </span>
        )}
      </div>

      {faults.count === 0 && analysis.anomalies.length === 0 ? (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-300">
          No active faults. All monitored channels nominal.
        </div>
      ) : (
        <div className="space-y-3">
          {faults.list.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Active fault bits</div>
              <div className="space-y-1.5">
                {faults.list.map((f) => (
                  <div key={f.code} className="flex items-center justify-between rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-sm">
                    <span className="text-rose-200">{f.label}</span>
                    <span className={`tabular text-xs font-mono ${tone[f.tone]}`}>{f.code} · bit {f.bit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {lastFaults.count > 0 && (
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Last latched fault</div>
              <div className="flex flex-wrap gap-2">
                {lastFaults.list.map((f) => (
                  <span key={f.code} className={`rounded-full border px-2.5 py-1 text-xs font-medium ${badgeTone[f.tone]}`}>{f.code}</span>
                ))}
              </div>
            </div>
          )}

          {analysis.anomalies.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">AI anomalies</div>
              <ul className="space-y-1.5">
                {analysis.anomalies.map((a, i) => (
                  <li key={i} className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm text-amber-200 font-mono">
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 text-xs text-slate-500">Raw mask: <span className="font-mono">0x{Number(t.fault_flags || 0).toString(16).padStart(4, "0")}</span></div>
    </Card>
  );
}
