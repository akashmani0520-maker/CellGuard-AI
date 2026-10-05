import { useState } from "react";
import { BrainCircuit, Loader2, Sparkles, RefreshCcw } from "lucide-react";
import { Card, Pill } from "./ui";
import { useTelemetryCtx } from "../context/TelemetryContext";
import { computeRisk } from "../lib/risk";

const AI_URL = "https://cellguard-ai.onrender.com/predict";

function PillByStatus(s) {
  const status = String(s || "").toUpperCase();
  if (status === "SAFE") return <Pill toneKey="safe">SAFE</Pill>;
  if (status === "DANGER" || status === "CRITICAL" || status === "ANOMALOUS") return <Pill toneKey="danger">DANGER</Pill>;
  if (status === "WARNING") return <Pill toneKey="warning">WARNING</Pill>;
  return <Pill toneKey="ok">{status || "UNKNOWN"}</Pill>;
}

export default function AiPanel() {
  const { latest } = useTelemetryCtx();
  const t = latest?.telemetry || {};
  const local = computeRisk(latest);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const runModel = async () => {
    setBusy(true); setError("");
    try {
      const res = await fetch(AI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          temperature: Math.max(...(t.temperature || [0])),
          voltage: t.pack_voltage,
          current: t.pack_current,
          batteryHealth: t.soh_percent || t.soc || 90,
        }),
      });
      if (!res.ok) throw new Error(`Model endpoint ${res.status}`);
      setResult(await res.json());
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  const shown = result || {
    fireRisk: local.risk,
    systemStatus: local.systemStatus,
    confidence: 97,
    remainingLife: "—",
    recommendation: result ? "" : "Run the cloud model for a full prediction.",
  };

  return (
    <Card
      icon={<BrainCircuit className="h-4 w-4 text-purple-300" />}
      title="AI Fire-Risk Model"
      subtitle="Scikit-learn battery model on Render"
      actions={
        <button
          onClick={runModel}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg border border-purple-500/40 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-200 hover:bg-purple-500/20 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {result ? <RefreshCcw className="h-3.5 w-3.5" /> : "Predict"}
        </button>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-center">
          <div className="text-[11px] uppercase text-slate-500">Fire Risk</div>
          <div className={`tabular mt-1 text-3xl font-bold ${shown.fireRisk >= 60 ? "text-rose-400" : shown.fireRisk >= 30 ? "text-amber-400" : "text-emerald-400"}`}>
            {Math.round(shown.fireRisk)}%
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-center">
          <div className="text-[11px] uppercase text-slate-500">Status</div>
          <div className="mt-2">{PillByStatus(shown.systemStatus)}</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-center">
          <div className="text-[11px] uppercase text-slate-500">Confidence</div>
          <div className="tabular mt-1 text-3xl font-bold text-purple-300">{shown.confidence}%</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-center">
          <div className="text-[11px] uppercase text-slate-500">Remaining Life</div>
          <div className="tabular mt-1 text-xl font-semibold text-blue-300">{shown.remainingLife || "—"}</div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/30 px-4 py-3 text-sm text-slate-300">
        <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">Recommendation</div>
        {shown.recommendation || "No prediction yet."}
      </div>

      {error && <div className="mt-3 text-xs text-rose-400">Model call failed: {error}</div>}
    </Card>
  );
}
