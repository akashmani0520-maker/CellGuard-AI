import AiPanel from "../components/AiPanel";
import SafetyPanel from "../components/SafetyPanel";
import FaultsPanel from "../components/FaultsPanel";
import { useTelemetryCtx } from "../context/TelemetryContext";

export default function AiPrediction() {
  const { latest } = useTelemetryCtx();
  if (!latest) return <div className="panel p-8 text-sm text-slate-400">Waiting for telemetry…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">AI Battery Prediction</h2>
        <p className="text-sm text-slate-400">Cloud-model fire-risk alongside local heuristic analysis.</p>
      </div>
      <AiPanel />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SafetyPanel />
        <FaultsPanel />
      </div>
    </div>
  );
}
