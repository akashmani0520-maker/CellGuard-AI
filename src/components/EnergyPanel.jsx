import { Zap, Battery, Gauge } from "lucide-react";
import { useTelemetryCtx } from "../context/TelemetryContext";
import { Card, Stat, Bar, Readout } from "./ui";
import { fmtAh, fmtWh, fmtPct, fmt } from "../lib/format";

export default function EnergyPanel() {
  const { latest } = useTelemetryCtx();
  const t = latest?.telemetry || {};
  const soh = Number(t.soh_percent) || 0;
  const cap = Number(t.full_capacity_ah) || 0;
  const soc = Number(t.soc) || 0;

  const sohTone = soh >= 80 ? "safe" : soh >= 60 ? "warning" : "danger";
  const socTone = soc >= 20 && soc <= 100 ? "ok" : "danger";

  return (
    <Card icon={<Zap className="h-4 w-4 text-amber-300" />} title="Energy & Lifecycle" subtitle="Coulomb counters, capacity and cycle health">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="SOC" value={`${fmt(t.soc, 1)}%`} toneKey={socTone} icon={<Battery className="h-4 w-4 text-cyan-300" />} />
        <Stat label="State of Health" value={fmtPct(soh, 1)} toneKey={sohTone} icon={<Gauge className="h-4 w-4 text-emerald-300" />} />
        <Stat label="Full Capacity" value={fmtAh(cap)} toneKey="ok" />
        <Stat label="Cycle Count" value={fmt(t.cycle_count, 0)} toneKey="ok" />
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
          <span>State of Health</span><span className="tabular">{soh.toFixed(1)}%</span>
        </div>
        <Bar value={soh} max={100} toneKey={sohTone} height={8} />
      </div>

      <div className="mt-5 space-y-2">
        <Readout label="Charge (cumulative)" value={`${fmtAh(t.amp_hours_in)} · ${fmtWh(t.energy_in_wh)}`} toneKey="ok" />
        <Readout label="Discharge (cumulative)" value={`${fmtAh(t.amp_hours_out)} · ${fmtWh(t.energy_out_wh)}`} toneKey="warning" />
        <Readout label="Remaining Capacity" value={fmtAh(t.remaining_capacity)} toneKey={t.remaining_capacity <= 0 ? "danger" : "ok"} />
      </div>
    </Card>
  );
}
