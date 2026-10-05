import { BatteryCharging, TrendingUp, Activity, Gauge } from "lucide-react";
import { useTelemetryCtx } from "../context/TelemetryContext";
import { Stat, Pill } from "../components/ui";
import CellsPanel from "../components/CellsPanel";
import ThermalPanel from "../components/ThermalPanel";
import SafetyPanel from "../components/SafetyPanel";
import FaultsPanel from "../components/FaultsPanel";
import EnergyPanel from "../components/EnergyPanel";
import ControlPanel from "../components/ControlPanel";
import { VoltageChart, CurrentChart, TemperatureChart } from "../components/Charts";
import AISummary from "../components/AISummary";
import { snapshotReportPayload } from "../lib/reportAI";
import { fmtVolt, fmtAmp, fmtWatt, fmt, ago } from "../lib/format";

export default function Dashboard() {
  const { latest, status } = useTelemetryCtx();
  const t = latest?.telemetry || {};

  if (status.loading && !latest) {
    return <Loading />;
  }
  if (!status.online && !latest) {
    return <Offline status={status} />;
  }

  const currentTone = t.pack_current > 0 ? "ok" : t.pack_current < 0 ? "warning" : "safe";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Live Overview</h2>
          <p className="text-sm text-slate-400">Last sample {ago(latest?.timestamp)}{latest?.timestamp ? ` · ${new Date(Number(latest.timestamp)).toLocaleTimeString()}` : ""}</p>
        </div>
        <Pill toneKey={latest?.analysis?.is_safe ? "safe" : "danger"} pulse>
          {latest?.analysis?.is_safe ? "All systems nominal" : "Attention required"}
        </Pill>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat label="Pack Voltage" value={fmtVolt(t.pack_voltage)} icon={<BatteryCharging className="h-4 w-4 text-cyan-300" />} toneKey={t.pack_voltage > 4 ? "ok" : "danger"} />
        <Stat label="Pack Current" value={fmtAmp(t.pack_current)} icon={<Activity className="h-4 w-4 text-blue-300" />} toneKey={currentTone} sub="+ charge / − discharge" />
        <Stat label="Pack Power" value={fmtWatt(t.pack_power)} icon={<TrendingUp className="h-4 w-4 text-amber-300" />} />
        <Stat label="State of Charge" value={`${fmt(t.soc, 1)}%`} icon={<Gauge className="h-4 w-4 text-emerald-300" />} toneKey={t.soc > 0 ? "ok" : "danger"} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <CellsPanel />
        <ThermalPanel />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SafetyPanel />
        <FaultsPanel />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="panel p-5">
          <div className="text-sm font-semibold text-slate-100 mb-4">Voltage Trend</div>
          <VoltageChart />
        </div>
        <div className="panel p-5">
          <div className="text-sm font-semibold text-slate-100 mb-4">Current / Power</div>
          <CurrentChart />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <EnergyPanel />
        <ControlPanel />
      </div>

      <div className="panel p-5">
        <div className="text-sm font-semibold text-slate-100 mb-4">Temperature Trend</div>
        <TemperatureChart height={250} />
      </div>

      <AISummary title="Live System Report" payload={snapshotReportPayload(latest)} disabled={!latest} />
    </div>
  );
}

function Loading() {
  return (
    <div className="panel p-8">
      <div className="shimmer h-10 w-56 rounded-lg mb-4" />
      <div className="shimmer h-3 w-full rounded mb-3" />
      <div className="shimmer h-3 w-4/5 rounded" />
      <p className="text-sm text-slate-400 mt-6">Contacting the BMS uplink…</p>
    </div>
  );
}

function Offline({ status }) {
  return (
    <div className="panel p-8 text-center">
      <div className="text-rose-400 text-4xl">⚠️</div>
      <h3 className="mt-3 text-lg font-semibold text-white">Telemetry unavailable</h3>
      <p className="text-sm text-slate-400 mt-2">{status.error || "Could not reach the AWS telemetry API."}</p>
    </div>
  );
}
