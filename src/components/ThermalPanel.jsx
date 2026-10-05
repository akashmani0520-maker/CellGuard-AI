import { Thermometer } from "lucide-react";
import { useTelemetryCtx } from "../context/TelemetryContext";
import { Card, Bar } from "./ui";
import { fmtTemp } from "../lib/format";
import { tempTone, tone } from "../lib/faults";

export default function ThermalPanel() {
  const { latest } = useTelemetryCtx();
  const t = latest?.telemetry || {};
  const temps = Array.isArray(t.temperature) ? t.temperature : [];
  const max = 60;

  return (
    <Card icon={<Thermometer className="h-4 w-4 text-amber-300" />} title="Thermal Profile" subtitle="Sensor temperatures with 45°C threshold">
      {temps.length === 0 ? (
        <div className="text-sm text-slate-500 py-6 text-center">No temperature data yet</div>
      ) : (
        <div className="space-y-4">
          {temps.map((tmp, i) => {
            const tk = tempTone(tmp);
            return (
              <div key={i}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-slate-400">Sensor {i + 1}</span>
                  <span className={`tabular font-semibold ${tone[tk]}`}>{fmtTemp(tmp)}</span>
                </div>
                <Bar value={tmp} max={max} toneKey={tk} height={7} />
              </div>
            );
          })}
          <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-800">
            <span className="text-slate-400">Peak</span>
            <span className={`tabular font-semibold ${tone[tempTone(Math.max(0, ...temps))]}`}>
              {temps.length ? fmtTemp(Math.max(...temps)) : "—"}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
