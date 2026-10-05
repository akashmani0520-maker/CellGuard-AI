import { BatteryCharging, BatteryFull, Activity } from "lucide-react";
import { useTelemetryCtx } from "../context/TelemetryContext";
import { Card, Bar, Readout } from "./ui";
import { fmtVolt, fmt } from "../lib/format";
import { cellTone, tone } from "../lib/faults";

export default function CellsPanel() {
  const { latest } = useTelemetryCtx();
  const t = latest?.telemetry || {};
  const cells = Array.isArray(t.cell_voltage) ? t.cell_voltage : [];
  const nominal = 3.7;

  return (
    <Card
      icon={<Activity className="h-4 w-4 text-cyan-300" />}
      title="Cell Voltages"
      subtitle="Individual series cells with drift metrics"
    >
      {cells.length === 0 ? (
        <div className="text-sm text-slate-500 py-6 text-center">No cell data yet</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {cells.map((v, i) => {
            const tk = cellTone(v);
            const delta = Math.abs(nominal - v) / nominal;
            return (
              <div key={i} className={`rounded-xl border p-4 ${tk === "danger" ? "border-rose-500/30" : tk === "warning" ? "border-amber-500/30" : "border-slate-800"}`}>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Cell {i + 1}</span>
                  {tk === "danger" ? <BatteryFull className="h-4 w-4 text-rose-400" /> : <BatteryCharging className="h-4 w-4 text-cyan-300" />}
                </div>
                <div className={`tabular mt-2 text-2xl font-semibold ${tone[tk]}`}>
                  {fmtVolt(v, 3)}
                </div>
                <div className="mt-3">
                  <Bar value={v} max={nominal * 1.15} toneKey={tk} height={6} />
                </div>
                <div className="text-[11px] text-slate-500 mt-2">{(delta * 100).toFixed(1)}% from nominal</div>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        <Readout label="Max Cell" value={fmtVolt(t.max_cell_voltage, 3)} toneKey={cellTone(t.max_cell_voltage)} />
        <Readout label="Min Cell" value={fmtVolt(t.min_cell_voltage, 3)} toneKey={cellTone(t.min_cell_voltage)} />
        <Readout label="Delta" value={`${fmt(t.cell_delta, 3)} V`} toneKey={t.cell_delta > 0.05 ? "warning" : "ok"} />
        <Readout label="Drift" value={`${fmt(t.drift, 3)} V`} toneKey={t.drift > 0.05 ? "warning" : "ok"} />
      </div>
    </Card>
  );
}
