import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine,
} from "recharts";
import { useTelemetryCtx } from "../context/TelemetryContext";
import { Card } from "./ui";

const AXIS = { stroke: "#475569", fontSize: 11 };
const GRID = { stroke: "rgba(148,163,184,0.08)" };
const TOOLTIP_STYLE = {
  background: "#0e1728", border: "1px solid #1c2b45", borderRadius: 10,
  fontSize: 12, color: "#e2e8f0",
};

function Empty() {
  return <div className="h-56 flex items-center justify-center text-sm text-slate-500">Waiting for telemetry…</div>;
}

export function VoltageChart({ height = 230, data }) {
  const { series } = useTelemetryCtx();
  const points = data || series;
  return (
    <div style={{ height }}>
      {points.length ? (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -14 }}>
            <defs>
              <linearGradient id="gVolt" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid {...GRID} vertical={false} />
            <XAxis dataKey="label" {...AXIS} minTickGap={40} />
            <YAxis {...AXIS} domain={["auto", "auto"]} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <ReferenceLine y={0} stroke="#334155" strokeDasharray="4 4" />
            <Area type="monotone" dataKey="pack_voltage" name="Pack V" stroke="#22d3ee" fill="url(#gVolt)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <Empty />
      )}
    </div>
  );
}

export function CurrentChart({ height = 230, data }) {
  const { series } = useTelemetryCtx();
  const points = data || series;
  return (
    <div style={{ height }}>
      {points.length ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -14 }}>
            <CartesianGrid {...GRID} vertical={false} />
            <XAxis dataKey="label" {...AXIS} minTickGap={40} />
            <YAxis {...AXIS} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <ReferenceLine y={0} stroke="#334155" strokeDasharray="4 4" />
            <Line type="monotone" dataKey="pack_current" name="Current (A)" stroke="#38bdf8" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="pack_power" name="Power (W)" stroke="#a78bfa" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <Empty />
      )}
    </div>
  );
}

export function TemperatureChart({ height = 250, data }) {
  const { series } = useTelemetryCtx();
  const points = data || series;
  return (
    <div style={{ height }}>
      {points.length ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -14 }}>
            <CartesianGrid {...GRID} vertical={false} />
            <XAxis dataKey="label" {...AXIS} minTickGap={40} />
            <YAxis {...AXIS} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <ReferenceLine y={45} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: "45°C", fill: "#f43f5e", fontSize: 11 }} />
            <Line type="monotone" dataKey="temp0" name="Cell 1" stroke="#22d3ee" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="temp1" name="Cell 2" stroke="#fbbf24" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="temp2" name="Cell 3" stroke="#34d399" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <Empty />
      )}
    </div>
  );
}
