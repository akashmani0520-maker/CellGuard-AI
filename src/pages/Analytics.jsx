import { useTelemetryCtx } from "../context/TelemetryContext";
import CellsPanel from "../components/CellsPanel";
import ThermalPanel from "../components/ThermalPanel";
import EnergyPanel from "../components/EnergyPanel";
import { VoltageChart, CurrentChart, TemperatureChart } from "../components/Charts";

export default function Analytics() {
  const { latest } = useTelemetryCtx();
  if (!latest) return <div className="panel p-8 text-sm text-slate-400">Waiting for telemetry…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Battery Analytics</h2>
        <p className="text-sm text-slate-400">Energy throughput, lifecycle, and performance history.</p>
      </div>

      <EnergyPanel />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <CellsPanel />
        <ThermalPanel />
      </div>

      <div className="panel p-5">
        <div className="text-sm font-semibold text-slate-100 mb-4">Voltage</div>
        <VoltageChart height={250} />
      </div>
      <div className="panel p-5">
        <div className="text-sm font-semibold text-slate-100 mb-4">Current / Power</div>
        <CurrentChart height={250} />
      </div>
      <div className="panel p-5">
        <div className="text-sm font-semibold text-slate-100 mb-4">Temperature</div>
        <TemperatureChart height={250} />
      </div>
    </div>
  );
}
