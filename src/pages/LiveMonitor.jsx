import { useTelemetryCtx } from "../context/TelemetryContext";
import { Readout, Pill } from "../components/ui";
import CellsPanel from "../components/CellsPanel";
import ThermalPanel from "../components/ThermalPanel";
import SafetyPanel from "../components/SafetyPanel";
import { VoltageChart, CurrentChart, TemperatureChart } from "../components/Charts";
import { fmtVolt, fmtAmp, fmtWatt, fmt, fmtUptime, ago } from "../lib/format";

export default function LiveMonitor() {
  const { latest, status } = useTelemetryCtx();
  const t = latest?.telemetry || {};

  if (!latest) {
    return <div className="panel p-8 text-sm text-slate-400">{status.online ? "Waiting for first sample…" : "Telemetry offline."}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Live Monitor</h2>
          <p className="text-sm text-slate-400">Streaming every poll · last {ago(latest.timestamp)} · uptime {fmtUptime(t.uptime_ms)}</p>
        </div>
        <Pill toneKey={status.online ? "safe" : "danger"} pulse={status.online}>{status.online ? "LIVE" : "OFFLINE"}</Pill>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Readout label="Pack Voltage" value={fmtVolt(t.pack_voltage)} />
        <Readout label="Pack Current" value={fmtAmp(t.pack_current)} />
        <Readout label="Pack Power" value={fmtWatt(t.pack_power)} />
        <Readout label="SOC" value={`${fmt(t.soc, 1)}%`} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <CellsPanel />
        <ThermalPanel />
      </div>

      <div className="panel p-5">
        <div className="text-sm font-semibold text-slate-100 mb-4">Voltage Trend</div>
        <VoltageChart height={260} />
      </div>

      <div className="panel p-5">
        <div className="text-sm font-semibold text-slate-100 mb-4">Current / Power</div>
        <CurrentChart height={260} />
      </div>

      <div className="panel p-5">
        <div className="text-sm font-semibold text-slate-100 mb-4">Temperature Trend</div>
        <TemperatureChart height={260} />
      </div>

      <SafetyPanel />
    </div>
  );
}
