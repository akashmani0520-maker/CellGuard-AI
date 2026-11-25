// Secret Demo Console — accessible at /demo and /mock
// Protected by a simple passphrase gate so it stays out of regular navigation.
// Provides full control over 3S battery physics scenarios, viva defense dossiers,
// parameter overrides, dynamic load simulation, and live preview telemetry.

import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Play, Square, RefreshCcw, Zap, Thermometer,
  Battery, AlertTriangle, Activity, Shield, ArrowLeft, Eye, EyeOff,
  Sliders, ToggleLeft, ToggleRight, Radio, AlertOctagon, Flame,
  Snowflake, Cpu, Wrench, Clock, CheckCircle2, HelpCircle, BookOpen,
  FastForward, RotateCcw
} from "lucide-react";
import { useMock } from "../context/MockContext";
import { SCENARIOS, LOAD_PRESETS, generateSnapshot } from "../lib/mockData";
import { publishMockTelemetry, DEFAULT_DEVICE_ID } from "../lib/api";
import { decodeFaultFlags } from "../lib/faults";

// ---- Passphrase gate --------------------------------------------------------
const PASSPHRASE = "cellguard-demo";

function PassphraseGate({ onUnlock }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [show, setShow] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (input.trim().toLowerCase() === PASSPHRASE) {
      onUnlock();
    } else {
      setError(true);
      setTimeout(() => setError(false), 1800);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: "radial-gradient(ellipse at 50% 0%, #0f1729 0%, #060a14 100%)" }}
    >
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl border border-amber-500/30 bg-amber-500/10 mb-4">
            <Shield className="h-8 w-8 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Demo & Viva Console</h1>
          <p className="text-sm text-slate-400 mt-1">Enter the demo passphrase to continue</p>
        </div>

        <form onSubmit={submit}
          className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur p-6 space-y-4"
        >
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Passphrase"
              autoFocus
              className={`w-full rounded-xl border ${error ? "border-rose-500/70 bg-rose-500/5" : "border-slate-700 bg-slate-800/60"} px-4 py-3 pr-10 text-sm text-slate-100 outline-none focus:border-amber-500 transition-colors`}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {error && <p className="text-xs text-rose-400">Incorrect passphrase.</p>}
          <button
            type="submit"
            className="w-full rounded-xl bg-amber-500 py-3 text-sm font-semibold text-black hover:bg-amber-400 transition-colors"
          >
            Unlock Console
          </button>
        </form>

        <p className="text-center text-xs text-slate-600 mt-4">
          Internal viva & examiner test bench · Not linked in main navigation.
        </p>
      </div>
    </div>
  );
}

// ---- Category Definition ----------------------------------------------------
const CATEGORIES = [
  { id: "all", label: "All Scenarios" },
  { id: "Normal", label: "Normal (3)" },
  { id: "Dynamics", label: "Dynamics (3)" },
  { id: "Charging", label: "Charging & Balancing (3)" },
  { id: "Safety", label: "Safety & Protection (5)" },
  { id: "Thermal", label: "Thermal (2)" },
  { id: "Degradation", label: "Degradation (2)" },
  { id: "Hardware", label: "Hardware & Diagnostics (2)" },
];

// ---- Scenario card ----------------------------------------------------------
function ScenarioCard({ sc, active, onClick }) {
  const icons = {
    nominal: <Battery className="h-4 w-4" />,
    load_step: <Activity className="h-4 w-4" />,
    pulse_burst: <Zap className="h-4 w-4" />,
    regen_braking: <RefreshCcw className="h-4 w-4" />,
    charging_cc: <Zap className="h-4 w-4" />,
    charging_cv: <Sliders className="h-4 w-4" />,
    active_balancing: <Sliders className="h-4 w-4" />,
    cell_imbalance: <AlertTriangle className="h-4 w-4" />,
    aged_capacity_fade: <Clock className="h-4 w-4" />,
    low_soc_warning: <Battery className="h-4 w-4" />,
    undervoltage_trip: <AlertOctagon className="h-4 w-4" />,
    overvoltage_trip: <AlertOctagon className="h-4 w-4" />,
    thermal_warning: <Thermometer className="h-4 w-4" />,
    thermal_cutoff: <Flame className="h-4 w-4" />,
    cold_charge_inhibit: <Snowflake className="h-4 w-4" />,
    overcurrent_short: <Shield className="h-4 w-4" />,
    ground_mux_fix: <Cpu className="h-4 w-4" />,
    sensor_wire_break: <Wrench className="h-4 w-4" />,
  };

  return (
    <button
      onClick={onClick}
      style={{ borderColor: active ? sc.color : undefined }}
      className={`text-left rounded-xl border p-4 transition-all relative ${
        active
          ? "ring-2 bg-slate-900/90 shadow-lg"
          : "border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60"
      }`}
    >
      <div className="flex items-center gap-2 mb-2" style={{ color: sc.color }}>
        {icons[sc.id] || <Activity className="h-4 w-4" />}
        <span className="text-sm font-semibold text-slate-100">{sc.label}</span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: sc.color + "25", color: sc.color }}
        >
          {sc.category || "Viva"}
        </span>
        {active && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            ACTIVE
          </span>
        )}
        {sc.faultFlags > 0 && (
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
            0x{sc.faultFlags.toString(16).toUpperCase()}
          </span>
        )}
      </div>
      <p className="text-xs text-slate-400 leading-relaxed">{sc.desc}</p>
    </button>
  );
}

// ---- College Viva & Technical Defense Panel ---------------------------------
function VivaDefensePanel({ scenarioId }) {
  const sc = SCENARIOS[scenarioId] || SCENARIOS.nominal;
  const decoded = decodeFaultFlags(sc.faultFlags || 0);

  return (
    <div className="rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-950/80 p-5 space-y-4 shadow-lg backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-500/20 pb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-white tracking-wide">
            College Viva & Technical Defense Dossier
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {sc.label}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Category:</span>
          <span className="font-semibold text-indigo-300">{sc.category}</span>
        </div>
      </div>

      {/* Viva Question */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Examiner Viva Question</span>
        </div>
        <p className="text-xs text-amber-100 font-medium leading-relaxed">
          "{sc.vivaQuestion || "How does the BMS manage and protect the 3S pack in this state?"}"
        </p>
      </div>

      {/* Viva Answer */}
      <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-3.5 space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          <span>High-Scoring Engineering Defense Answer</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {sc.vivaAnswer || "The system maintains closed-loop protection by monitoring real-time voltage, current, and thermal thresholds."}
        </p>
      </div>

      {/* Relays & Protection Interlocks */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
          <span className="text-[11px] text-slate-400 block mb-1">Load Contactor Relay</span>
          <span className={`inline-flex items-center gap-1.5 font-mono text-xs font-bold ${
            sc.expectedRelays?.load ? "text-emerald-400" : "text-rose-400"
          }`}>
            <span className={`h-2 w-2 rounded-full ${sc.expectedRelays?.load ? "bg-emerald-400" : "bg-rose-500 animate-pulse"}`} />
            {sc.expectedRelays?.load ? "CLOSED (Delivering)" : "OPEN (Tripped/Isolated)"}
          </span>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
          <span className="text-[11px] text-slate-400 block mb-1">Charge Contactor Relay</span>
          <span className={`inline-flex items-center gap-1.5 font-mono text-xs font-bold ${
            sc.expectedRelays?.charger ? "text-cyan-400" : "text-slate-400"
          }`}>
            <span className={`h-2 w-2 rounded-full ${sc.expectedRelays?.charger ? "bg-cyan-400" : "bg-slate-600"}`} />
            {sc.expectedRelays?.charger ? "CLOSED (Charging)" : "OPEN (Inhibited/Isolated)"}
          </span>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
          <span className="text-[11px] text-slate-400 block mb-1">Active Fault Register</span>
          <span className={`inline-flex items-center gap-1.5 font-mono text-xs font-bold ${
            sc.faultFlags ? "text-rose-400" : "text-emerald-400"
          }`}>
            {sc.faultFlags ? `0x${sc.faultFlags.toString(16).padStart(4, "0").toUpperCase()}` : "0x0000 (Normal)"}
          </span>
          {decoded.list.length > 0 && (
            <div className="text-[10px] text-rose-300 mt-1 truncate">
              {decoded.list.map(f => f.code).join(", ")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- One-Click Case & Fault Injector Toolbar --------------------------------
function QuickFaultInjector({ activeScenario, onSelectScenario }) {
  const quickActions = [
    { id: "nominal", label: "3S Cruise (Nominal)", icon: Battery, color: "#10b981" },
    { id: "load_step", label: "Load Step (7.5A)", icon: Activity, color: "#06b6d4" },
    { id: "pulse_burst", label: "Launch Burst (13A)", icon: Zap, color: "#f59e0b" },
    { id: "regen_braking", label: "Regen Brake (-7A)", icon: RefreshCcw, color: "#14b8a6" },
    { id: "undervoltage_trip", label: "Trip UV (2.85V)", icon: AlertOctagon, color: "#dc2626" },
    { id: "thermal_cutoff", label: "Trip OT (58°C)", icon: Flame, color: "#ef4444" },
    { id: "overcurrent_short", label: "Trip Short (<25µs)", icon: Shield, color: "#991b1b" },
    { id: "cold_charge_inhibit", label: "Cold Inhibit (<0°C)", icon: Snowflake, color: "#0284c7" },
    { id: "ground_mux_fix", label: "Dual-MUX Demo", icon: Cpu, color: "#7c3aed" },
  ];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="font-semibold flex items-center gap-1.5 text-slate-300">
          <Zap className="h-3.5 w-3.5 text-amber-400" /> One-Click Case & Fault Injection Toolbar
        </span>
        <span className="text-[11px] text-slate-500">Instant test condition switching</span>
      </div>
      <div className="flex flex-wrap gap-2 pt-1">
        {quickActions.map(act => (
          <button
            key={act.id}
            onClick={() => onSelectScenario(act.id)}
            style={{
              borderColor: activeScenario === act.id ? act.color : undefined,
              backgroundColor: activeScenario === act.id ? `${act.color}20` : undefined,
            }}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
              activeScenario === act.id
                ? "text-white ring-1 shadow"
                : "border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:border-slate-700"
            }`}
          >
            <act.icon className="h-3 w-3" style={{ color: act.color }} />
            {act.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---- Live telemetry preview card --------------------------------------------
function TelemetryPreview({ snap }) {
  if (!snap) return null;
  const t = snap.telemetry || {};
  const current = Number(t.pack_current || 0);
  const power = Number(t.pack_power || 0);
  const isCharging = Boolean(t.charging || current < 0);
  const rows = [
    ["Pack Voltage", `${(t.pack_voltage ?? 0).toFixed(2)} V`],
    ["Pack Current", `${Math.abs(current).toFixed(2)} A ${isCharging ? "(Charge)" : "(Discharge)"}`],
    ["Pack Power", `${Math.abs(power).toFixed(1)} W`],
    ["State of Charge", `${(t.soc ?? 0).toFixed(1)} %`],
    ["Cell Delta", `${(((t.cell_delta || 0)) * 1000).toFixed(0)} mV`],
    ["Max Temp", `${Math.max(...(t.temperature && t.temperature.length ? t.temperature : [0])).toFixed(1)} °C`],
    ["Fault Flags", `0x${((t.fault_flags || 0)).toString(16).padStart(4, "0").toUpperCase()}`],
    ["Fault Count", String(t.fault_count || 0)],
    ["BMS Online", t.bms_online ? "Yes" : "No"],
    ["Is Safe", snap.analysis?.is_safe ? "Yes" : "No"],
  ];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Live Telemetry Readout
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between items-center border-b border-slate-800/60 pb-1.5">
            <span className="text-xs text-slate-500">{label}</span>
            <span className="text-xs font-mono font-semibold text-slate-200">{value}</span>
          </div>
        ))}
      </div>
      {snap.analysis?.anomalies?.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {snap.analysis.anomalies.map((a, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-rose-300 bg-rose-500/10 rounded-lg px-3 py-1.5 border border-rose-500/20">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-400" />
              <span>{a}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Hardware Interlocks & Dual-MUX Card ------------------------------------
function HardwareInterlocksCard({ snap }) {
  if (!snap) return null;
  const t = snap.telemetry || {};
  const dualMux = t.dual_mux || { active_channel: 1, ref_voltage: 0.0 };
  const loadRelay = Boolean(t.load_relay);
  const chargerRelay = Boolean(t.charger_relay);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
        Hardware Interlocks & Dual-MUX State
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className={`p-2.5 rounded-lg border text-center transition-all ${
          loadRelay ? "border-emerald-500/40 bg-emerald-500/10" : "border-rose-500/40 bg-rose-500/10"
        }`}>
          <div className="text-[10px] text-slate-400">Load Contactor</div>
          <div className={`text-xs font-mono font-bold mt-0.5 ${loadRelay ? "text-emerald-300" : "text-rose-300"}`}>
            {loadRelay ? "CLOSED · Active" : "OPEN · Tripped"}
          </div>
        </div>

        <div className={`p-2.5 rounded-lg border text-center transition-all ${
          chargerRelay ? "border-cyan-500/40 bg-cyan-500/10" : "border-slate-800 bg-slate-800/40"
        }`}>
          <div className="text-[10px] text-slate-400">Charge Contactor</div>
          <div className={`text-xs font-mono font-bold mt-0.5 ${chargerRelay ? "text-cyan-300" : "text-slate-400"}`}>
            {chargerRelay ? "CLOSED · Active" : "OPEN · Inactive"}
          </div>
        </div>
      </div>

      {/* Dual-MUX Ground Referencing Display */}
      <div className="p-3 rounded-lg border border-purple-500/20 bg-purple-500/5 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-purple-300 font-semibold flex items-center gap-1.5">
            <Cpu className="h-3.5 w-3.5 text-purple-400" />
            Dual-MUX Ground Shift
          </span>
          <span className="font-mono text-purple-200 font-bold text-[11px]">
            CH {dualMux.active_channel} (Cell {dualMux.active_channel})
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Virtual GND: {dualMux.ref_voltage?.toFixed(1)} V</span>
          <span className="text-emerald-400">100% Differential Positive</span>
        </div>
      </div>

      {/* Balancing Indicator */}
      {t.active_balancing_cell && (
        <div className="flex items-center justify-between p-2 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs text-amber-200">
          <span className="flex items-center gap-1.5">
            <Sliders className="h-3.5 w-3.5 text-amber-400" />
            Active Bleed Shunt: Cell {t.active_balancing_cell}
          </span>
          <span className="font-mono font-bold">100 mA Shunt Active</span>
        </div>
      )}
    </div>
  );
}

// ---- Dynamic Load Simulator -------------------------------------------------
function LoadSimulator({ currentPreset, onSelectPreset, overrides = {}, onOverrideChange }) {
  const customAmps = overrides.pack_current !== undefined ? overrides.pack_current : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {Object.values(LOAD_PRESETS).map((p) => {
          const isSelected = (!customAmps && currentPreset === p.id) || (customAmps === p.current);
          return (
            <button
              key={p.id}
              onClick={() => {
                onSelectPreset(p.id);
                onOverrideChange({ pack_current: p.current, loadPreset: p.id });
              }}
              style={{
                borderColor: isSelected ? p.color : undefined,
                backgroundColor: isSelected ? p.color + "15" : undefined,
              }}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                isSelected
                  ? "ring-1"
                  : "border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold mb-1" style={{ color: p.color }}>
                <span>{p.label}</span>
              </div>
              <div className="text-sm font-mono font-bold text-slate-100">
                {p.current < 0 ? `Charge ${Math.abs(p.current)}A` : `${p.current.toFixed(2)} A`}
              </div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5">{p.desc}</div>
            </button>
          );
        })}
      </div>

      {/* Manual Fine-grained Load Slider */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40">
        <div className="flex justify-between items-center text-xs text-slate-300 mb-2">
          <span className="font-semibold flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-amber-400" /> Continuous Load Slider (IR Sag Dynamics)
          </span>
          <span className="font-mono text-amber-300 font-bold text-sm">
            {customAmps !== null ? Number(customAmps).toFixed(2) : "Scenario Default"} A
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="15"
          step="0.1"
          value={customAmps !== null ? customAmps : 2.5}
          onChange={(e) => onOverrideChange({ pack_current: Number(e.target.value), loadPreset: null })}
          className="w-full accent-amber-400 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
          <span>0.0 A (Idle / 0W)</span>
          <span>5.0 A (Motor / ~55W)</span>
          <span>10.0 A (High Load / ~105W)</span>
          <span>15.0 A (Peak Surge / ~150W)</span>
        </div>
      </div>
    </div>
  );
}

// ---- Override sliders -------------------------------------------------------
function OverrideSliders({ overrides = {}, onChange }) {
  const sliders = [
    { key: "soc", label: "State of Charge (%)", min: 0, max: 100, step: 1, default: 75 },
    { key: "pack_voltage", label: "Pack Voltage (3S: 9.0V - 12.6V)", min: 8.5, max: 13.0, step: 0.05, default: 11.1 },
    { key: "pack_current", label: "Pack Current (A)", min: 0, max: 15, step: 0.1, default: 2.2 },
  ];
  return (
    <div className="space-y-4">
      {sliders.map((s) => {
        const val = overrides[s.key] !== undefined ? overrides[s.key] : s.default;
        return (
          <div key={s.key}>
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <span>{s.label}</span>
              <span className="font-mono text-slate-200">{Number(val).toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={s.min} max={s.max} step={s.step}
              value={val}
              onChange={(e) => onChange({ [s.key]: Number(e.target.value) })}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
              <span>{s.min}</span><span>{s.max}</span>
            </div>
          </div>
        );
      })}
      <button
        onClick={() => onChange({ soc: undefined, pack_voltage: undefined, pack_current: undefined, loadPreset: undefined })}
        className="text-xs text-slate-500 hover:text-slate-300 underline underline-offset-2"
      >
        Reset manual overrides
      </button>
    </div>
  );
}

// ---- Main console UI --------------------------------------------------------
function ConsoleUI() {
  const navigate = useNavigate();
  const {
    enabled, scenario, loadPreset, animating,
    overrides, enableMock, disableMock,
    setScenario, setLoadPreset, setOverrides, toggleAnimating,
  } = useMock();

  const [preview, setPreview] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [tickSpeed, setTickSpeed] = useState(1200); // 1200ms normal, 500ms fast, 2500ms slow
  const tickRef = useRef(0);

  // --- AWS publish state ---
  const [publishLog, setPublishLog] = useState([]);
  const [publishing, setPublishing] = useState(false);
  const [autoPublish, setAutoPublish] = useState(false);
  const [publishDeviceId, setPublishDeviceId] = useState(DEFAULT_DEVICE_ID);
  const logRef = useRef(null);

  const addLog = (level, msg) => {
    const ts = new Date().toLocaleTimeString([], { hour12: false });
    setPublishLog((prev) => {
      const next = [...prev, { ts, level, msg }];
      return next.length > 200 ? next.slice(next.length - 200) : next;
    });
    requestAnimationFrame(() => {
      if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    });
  };

  const doPublish = async (snap) => {
    if (publishing) return;
    const s = snap || preview;
    if (!s) { addLog("warn", "No snapshot ready — wait for preview to load."); return; }
    setPublishing(true);
    addLog("info", `POST ${publishDeviceId} | scenario=${scenario} | V=${s.telemetry?.pack_voltage?.toFixed(2)}V I=${s.telemetry?.pack_current?.toFixed(2)}A SoC=${s.telemetry?.soc?.toFixed(1)}%`);
    try {
      const result = await publishMockTelemetry(s, publishDeviceId);
      addLog("ok", `Accepted by Lambda. ts=${result.timestamp} | ${result.message}`);
    } catch (err) {
      addLog("err", `FAILED: ${err.message}`);
    } finally {
      setPublishing(false);
    }
  };

  // Auto-publish interval
  useEffect(() => {
    if (!autoPublish) return;
    const id = setInterval(() => {
      const snap = generateSnapshot(scenario || "nominal", tickRef.current, overrides || {});
      doPublish(snap);
    }, 5000);
    return () => clearInterval(id);
  }, [autoPublish, scenario, overrides, publishDeviceId]);

  // Live preview ticking
  useEffect(() => {
    const sc = scenario || "nominal";
    setPreview(generateSnapshot(sc, 0, overrides || {}));
    if (!animating) return;
    const id = setInterval(() => {
      tickRef.current += 1;
      setPreview(generateSnapshot(sc, tickRef.current, overrides || {}));
    }, tickSpeed);
    return () => clearInterval(id);
  }, [scenario, overrides, animating, tickSpeed]);

  const handleScenario = (id) => {
    setScenario(id);
    tickRef.current = 0;
    if (!enabled) enableMock(id);
  };

  const handleOverride = (patch) => {
    const next = { ...overrides };
    Object.entries(patch).forEach(([k, v]) => {
      if (v === undefined) delete next[k];
      else next[k] = v;
    });
    setOverrides(next);
  };

  const filteredScenarios = useMemo(() => {
    const all = Object.values(SCENARIOS);
    if (selectedCategory === "all") return all;
    return all.filter((s) => s.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="min-h-screen text-white"
      style={{ background: "radial-gradient(ellipse at 50% -20%, #0f1b35 0%, #060a14 100%)" }}
    >
      {/* Header */}
      <div className="border-b border-slate-800/70 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </button>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-amber-400" />
            <span className="font-semibold text-white text-sm">Demo & Viva Physics Simulator</span>
            <span className="text-[10px] text-slate-500 font-mono bg-slate-800/80 px-2 py-0.5 rounded">
              /demo · /mock
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Tick Speed toggle */}
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900/60 p-0.5 text-xs">
            <button
              onClick={() => setTickSpeed(2500)}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                tickSpeed === 2500 ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              0.5x
            </button>
            <button
              onClick={() => setTickSpeed(1200)}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                tickSpeed === 1200 ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              1.0x
            </button>
            <button
              onClick={() => setTickSpeed(500)}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                tickSpeed === 500 ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              2.5x
            </button>
          </div>

          {/* Animate toggle */}
          <button
            onClick={toggleAnimating}
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              animating
                ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200"
                : "border-slate-700 text-slate-400"
            }`}
          >
            {animating
              ? <><Radio className="h-3.5 w-3.5 animate-pulse" /> Animating</>
              : <><Square className="h-3.5 w-3.5" /> Static</>
            }
          </button>

          {/* Enable / Disable */}
          {enabled ? (
            <button
              onClick={disableMock}
              className="flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/20"
            >
              <ToggleRight className="h-4 w-4" /> Disable Mock
            </button>
          ) : (
            <button
              onClick={() => enableMock(scenario || "nominal")}
              className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-200 hover:bg-amber-500/20"
            >
              <ToggleLeft className="h-4 w-4" /> Enable Mock
            </button>
          )}

          {enabled && (
            <Link
              to="/"
              className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-500/20"
            >
              <Play className="h-3.5 w-3.5" /> View Dashboard
            </Link>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className={`px-6 py-2 text-xs font-medium flex items-center justify-between ${
        enabled
          ? "bg-amber-500/10 border-b border-amber-500/20 text-amber-300"
          : "bg-slate-900/40 border-b border-slate-800/40 text-slate-500"
      }`}>
        <div className="flex items-center gap-2">
          <span className={`inline-flex h-1.5 w-1.5 rounded-full ${enabled ? "bg-amber-400 animate-pulse" : "bg-slate-600"}`} />
          {enabled
            ? `Mock mode ACTIVE — all dashboard pages are showing simulated 3S data for "${SCENARIOS[scenario]?.label || scenario}"`
            : "Mock mode disabled — enable it above to inject simulated data into the dashboard"
          }
        </div>
        <div className="text-[11px] font-mono text-slate-500">
          3S Pack (11.1V Nominal · 12.6V Max · 9.0V Cutoff)
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left: scenarios + viva dossier + overrides */}
        <div className="xl:col-span-2 space-y-6">
          {/* Quick Fault & Case Injector Toolbar */}
          <QuickFaultInjector
            activeScenario={scenario}
            onSelectScenario={handleScenario}
          />

          {/* College Viva Examination Defense Panel */}
          <VivaDefensePanel scenarioId={scenario} />

          {/* Dynamic Load Simulator */}
          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
            <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" /> Dynamic Load Simulator (IR Sag & Thermal Losses)
              <span className="text-xs text-slate-500 font-normal ml-1">
                (Observe instantaneous V=IR drop, temperature rise & dynamic SoC decline)
              </span>
            </h2>
            <LoadSimulator
              currentPreset={overrides.loadPreset || loadPreset}
              onSelectPreset={(p) => setLoadPreset(p)}
              overrides={overrides}
              onOverrideChange={handleOverride}
            />
          </section>

          {/* 18 Viva Scenarios with Category Filter */}
          <section className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Activity className="h-4 w-4 text-cyan-400" /> Viva & Protection Scenarios
                <span className="text-xs text-slate-500 font-normal ml-1">
                  (18 College Viva Demonstrations for 3S Pack)
                </span>
              </h2>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap gap-1.5 pb-1 border-b border-slate-800/80">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedCategory === cat.id
                      ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/40"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Scenario Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {filteredScenarios.map((sc) => (
                <ScenarioCard
                  key={sc.id}
                  sc={sc}
                  active={scenario === sc.id}
                  onClick={() => handleScenario(sc.id)}
                />
              ))}
            </div>
          </section>

          {/* Manual Parameter Overrides */}
          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
            <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-cyan-400" /> Parameter Overrides
              <span className="text-xs text-slate-600 font-normal ml-1">(applied on top of scenario values)</span>
            </h2>
            <OverrideSliders overrides={overrides} onChange={handleOverride} />
          </section>

          {/* AWS Publish Panel */}
          <section className="rounded-xl border border-slate-700 bg-slate-900/60 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Radio className="h-4 w-4 text-emerald-400" /> Publish to AWS
              <span className="text-xs text-slate-600 font-normal ml-1">(POST → Lambda → DynamoDB)</span>
            </h2>

            <div>
              <label className="text-xs text-slate-500 block mb-1">Target device_id</label>
              <input
                value={publishDeviceId}
                onChange={(e) => setPublishDeviceId(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs font-mono text-slate-100 outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => doPublish(null)}
                disabled={publishing}
                className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50"
              >
                {publishing
                  ? <><RefreshCcw className="h-3.5 w-3.5 animate-spin" /> Sending...</>
                  : <><Play className="h-3.5 w-3.5" /> Publish once</>
                }
              </button>

              <button
                onClick={() => setAutoPublish((a) => !a)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                  autoPublish
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                    : "border-slate-700 text-slate-400 hover:text-slate-200"
                }`}
              >
                {autoPublish
                  ? <><Square className="h-3.5 w-3.5" /> Stop auto (5 s)</>
                  : <><Radio className="h-3.5 w-3.5" /> Auto every 5 s</>
                }
              </button>

              <button
                onClick={() => setPublishLog([])}
                className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-500 hover:text-slate-300"
              >
                Clear log
              </button>
            </div>

            <div
              ref={logRef}
              className="h-44 overflow-y-auto rounded-lg border border-slate-800 bg-black/60 p-3 font-mono text-[11px] leading-relaxed space-y-0.5"
            >
              {publishLog.length === 0 && (
                <span className="text-slate-600">Console ready. Hit "Publish once" or enable auto-publish.</span>
              )}
              {publishLog.map((entry, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-slate-600 shrink-0">{entry.ts}</span>
                  <span className={{
                    ok:   "text-emerald-400",
                    err:  "text-rose-400",
                    warn: "text-amber-400",
                    info: "text-slate-400",
                  }[entry.level] || "text-slate-400"}>
                    {entry.level === "ok"   && "[OK]  "}
                    {entry.level === "err"  && "[ERR] "}
                    {entry.level === "warn" && "[WRN] "}
                    {entry.level === "info" && "[   ] "}
                    {entry.msg}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Instructions */}
          <section className="rounded-xl border border-slate-800/60 bg-slate-900/30 p-5 text-xs text-slate-500 space-y-2 leading-relaxed">
            <div className="text-slate-400 font-semibold mb-2">Examiner & Viva Instructions</div>
            <div>1. Select any of the 18 scenarios above to demonstrate authentic 3S Li-ion pack behavior.</div>
            <div>2. Use the <span className="text-indigo-300 font-medium">Viva Defense Dossier</span> for examiner questions and high-scoring answers.</div>
            <div>3. Click <span className="text-amber-300 font-mono">Enable Mock</span> to inject simulated data into all dashboard pages.</div>
            <div>4. Observe the <span className="text-cyan-300">Dual-MUX Ground Referencing</span> virtualizer in the right panel to explain how series cell voltage is read without negative rail ADC limits.</div>
            <div>5. Use the <span className="text-emerald-300 font-mono">Publish to AWS</span> panel to send mock telemetry directly to DynamoDB for full end-to-end cloud pipeline validation.</div>
            <div className="pt-2 border-t border-slate-800">
              Passphrase: <span className="font-mono text-slate-400">{PASSPHRASE}</span>
              {" · "}
              URL: <span className="font-mono text-slate-400">/demo or /mock</span>
            </div>
          </section>
        </div>

        {/* Right: live preview + hardware interlocks */}
        <div className="space-y-4">
          <div className="sticky top-4 space-y-4">
            <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" /> Live Telemetry Preview
              {animating && <span className="text-[10px] text-emerald-500 animate-pulse font-bold">LIVE</span>}
            </h2>

            {/* Core Telemetry Preview */}
            <TelemetryPreview snap={preview} />

            {/* Hardware Interlocks & Dual-MUX State */}
            <HardwareInterlocksCard snap={preview} />

            {/* 3S Series Cell Voltages mini-grid */}
            {preview?.telemetry?.cell_voltage && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    3S Series Cell Voltages
                  </div>
                  <span className="text-[10px] text-cyan-400 font-mono font-semibold">
                    Delta: {((preview.telemetry.cell_delta || 0) * 1000).toFixed(0)} mV
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {preview.telemetry.cell_voltage.slice(0, 3).map((v, i) => {
                    const danger = v < 2.95 || v > 4.25;
                    const warn = v < 3.3 || v > 4.15;
                    return (
                      <div
                        key={i}
                        className={`rounded-lg border px-2.5 py-2 text-center transition-all ${
                          danger ? "border-rose-500/50 bg-rose-500/10" :
                          warn ? "border-amber-500/40 bg-amber-500/8" :
                          "border-slate-700 bg-slate-800/40"
                        }`}
                      >
                        <div className="text-[10px] text-slate-500 mb-0.5">Cell {i + 1}</div>
                        <div className={`text-sm font-mono font-bold ${danger ? "text-rose-400" : warn ? "text-amber-400" : "text-emerald-300"}`}>
                          {v.toFixed(3)} V
                        </div>
                        <div className="text-[9px] text-slate-500 mt-0.5">
                          {((v - 3.7) * 1000 >= 0 ? "+" : "") + ((v - 3.7) * 1000).toFixed(0)} mV
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Temperature display */}
            {preview?.telemetry?.temperature && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Thermal Profile (3 Channels)
                </div>
                <div className="space-y-3">
                  {preview.telemetry.temperature.map((temp, i) => {
                    const hot = temp > 45;
                    const warm = temp > 38;
                    const pct = Math.min(100, Math.max(0, ((temp - 20) / 45) * 100));
                    const sensorNames = [
                      "Sensor 1 · Pack Core",
                      "Sensor 2 · MOSFETs & Shunt",
                      "Sensor 3 · Case / Ambient",
                    ];
                    return (
                      <div key={i}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400">{sensorNames[i] || `Sensor ${i + 1}`}</span>
                          <span className={`font-mono font-semibold ${hot ? "text-rose-400" : warm ? "text-amber-400" : "text-cyan-300"}`}>
                            {temp.toFixed(1)} °C
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${hot ? "bg-rose-500" : warm ? "bg-amber-400" : "bg-cyan-400"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Entry point with gate --------------------------------------------------
export default function DemoConsole() {
  const [unlocked, setUnlocked] = useState(() => {
    try { return sessionStorage.getItem("cellguard.demo.unlocked") === "1"; } catch { return false; }
  });

  const unlock = () => {
    try { sessionStorage.setItem("cellguard.demo.unlocked", "1"); } catch {}
    setUnlocked(true);
  };

  if (!unlocked) return <PassphraseGate onUnlock={unlock} />;
  return <ConsoleUI />;
}
