import { useState } from "react";
import { Power, PlugZap, Eraser, Loader2 } from "lucide-react";
import { Card, Pill } from "./ui";
import { sendCommand } from "../lib/api";
import { useDevice } from "../context/DeviceContext";
import { useTelemetryCtx } from "../context/TelemetryContext";

export function SwitchButton({ active, pending, onClick, activeClass }) {
  return (
    <button
      onClick={onClick}
      disabled={pending}
      className={`relative inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold border transition-all disabled:opacity-60 ${active ? activeClass : "bg-slate-900/60 text-slate-400 border-slate-700 hover:border-slate-500"}`}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {active ? "On" : "Off"}
    </button>
  );
}

export default function ControlPanel() {
  const { deviceId } = useDevice();
  const { latest, refetch } = useTelemetryCtx();
  const t = latest?.telemetry || {};
  const [pending, setPending] = useState(null);

  const act = async (command, state, key) => {
    setPending(key);
    try {
      await sendCommand(deviceId, command, state);
      await refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setPending(null);
    }
  };

  return (
    <Card icon={<Power className="h-4 w-4 text-cyan-300" />} title="Remote Control" subtitle="Dispatch relay commands via AWS IoT" bodyClass="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Pill toneKey={t.charger_detected ? "warning" : "safe"}>{t.charger_detected ? "Charger detected" : "No charger"}</Pill>
        <Pill toneKey={t.load_detected ? "warning" : "safe"}>{t.load_detected ? "Load detected" : "No load"}</Pill>
        <Pill toneKey={t.charging ? "ok" : "safe"} pulse={t.charging}>{t.charging ? "Charging" : "Idle"}</Pill>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-200">Load Relay</div>
              <div className="text-xs text-slate-500">Toggle external load contactor</div>
            </div>
            <SwitchButton
              active={!!t.load_relay}
              pending={pending === "load"}
              activeClass="bg-amber-500/15 text-amber-300 border-amber-500/40"
              onClick={() => act("load_relay", t.load_relay ? 0 : 1, "load")}
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-200">Charger Relay</div>
              <div className="text-xs text-slate-500">Toggle charger contactor</div>
            </div>
            <SwitchButton
              active={!!t.charger_relay}
              pending={pending === "charger"}
              activeClass="bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
              onClick={() => act("charger_relay", t.charger_relay ? 0 : 1, "charger")}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 justify-between rounded-xl border border-slate-800 bg-slate-900/30 p-4">
        <div className="flex items-center gap-2">
          <PlugZap className="h-4 w-4 text-slate-400" />
          <div>
            <div className="text-sm font-medium text-slate-200">Clear faults</div>
            <div className="text-xs text-slate-500">Reset latched fault flags on device</div>
          </div>
        </div>
        <button
          onClick={() => act("clear_faults", 0, "clear")}
          disabled={pending === "clear"}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800/60 px-3 py-2 text-xs font-medium text-slate-100 hover:bg-slate-700 disabled:opacity-60"
        >
          {pending === "clear" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eraser className="h-3.5 w-3.5" />} Clear
        </button>
      </div>
    </Card>
  );
}
