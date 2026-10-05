import { RefreshCw, Wifi, WifiOff, Cloud, CloudOff, Cpu } from "lucide-react";
import { useTelemetryCtx } from "../context/TelemetryContext";
import { useDevice } from "../context/DeviceContext";
import { Pill } from "./ui";
import { fmtUptime } from "../lib/format";

export default function Header() {
  const { latest, status, refetch } = useTelemetryCtx();
  const { deviceId } = useDevice();
  const t = latest?.telemetry;

  const bms = Boolean(t?.bms_online);
  const wifi = Boolean(t?.wifi_online ?? status.online);
  const aws = Boolean(t?.aws_online ?? status.online);
  const isSafe = latest?.analysis?.is_safe;
  const rssi = Number(t?.rssi) || 0;

  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Battery Management System</h1>
        <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
          <Cpu className="h-4 w-4 text-slate-500" />
          <span className="tabular">{deviceId}</span>
          {t?.node_id && <span className="text-slate-600">· node {t.node_id}</span>}
          {t && (
            <span className="tabular text-slate-500">up {fmtUptime(t.uptime_ms)}</span>
          )}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Pill toneKey={bms ? "safe" : "danger"} pulse={bms}>
          {bms ? "BMS Online" : "BMS Offline"}
        </Pill>
        <Pill toneKey={wifi ? "safe" : "danger"} pulse={wifi}>
          {wifi ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
          {wifi ? `WiFi ${rssi} dBm` : "WiFi"}
        </Pill>
        <Pill toneKey={aws ? "safe" : "danger"} pulse={aws}>
          {aws ? <Cloud className="h-3.5 w-3.5" /> : <CloudOff className="h-3.5 w-3.5" />}
          {aws ? "AWS Cloud" : "Cloud"}
        </Pill>
        <Pill toneKey={isSafe ? "safe" : "danger"} pulse>
          {isSafe ? "Safe" : "Critical"}
        </Pill>

        <button
          onClick={refetch}
          title="Refresh now"
          className="ml-1 inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${status.loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>
    </header>
  );
}
