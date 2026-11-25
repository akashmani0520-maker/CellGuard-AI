// Secret Demo Console — accessible at /demo
// Protected by a simple passphrase gate so it stays out of regular navigation.
// Provides full control over mock telemetry scenarios, parameter sliders,
// and a live preview of what the dashboard will show.

import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Play, Square, RefreshCcw, ChevronRight, Zap, Thermometer,
  Battery, AlertTriangle, Activity, Shield, ArrowLeft, Eye, EyeOff,
  Sliders, ToggleLeft, ToggleRight, Radio,
} from "lucide-react";
import { useMock } from "../context/MockContext";
import { SCENARIOS, generateSnapshot } from "../lib/mockData";

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
          <h1 className="text-2xl font-bold text-white">Demo Console</h1>
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
          Not linked in navigation — internal use only.
        </p>
      </div>
    </div>
  );
}

// ---- Scenario card ----------------------------------------------------------
function ScenarioCard({ sc, active, onClick }) {
  const icons = {
    nominal: <Battery className="h-5 w-5" />,
    charging: <Zap className="h-5 w-5" />,
    high_load: <Activity className="h-5 w-5" />,
    cell_imbalance: <Sliders className="h-5 w-5" />,
    thermal_warning: <Thermometer className="h-5 w-5" />,
    low_soc: <Battery className="h-5 w-5" />,
    fault: <AlertTriangle className="h-5 w-5" />,
  };
  return (
    <button
      onClick={onClick}
      style={{ borderColor: active ? sc.color + "80" : undefined }}
      className={`text-left rounded-xl border p-4 transition-all ${
        active
          ? "ring-1 bg-white/5"
          : "border-slate-800 hover:border-slate-600 bg-slate-900/40"
      }`}
    >
      <div className="flex items-center gap-2 mb-2" style={{ color: active ? sc.color : "#94a3b8" }}>
        {icons[sc.id] || <Activity className="h-5 w-5" />}
        <span className="text-sm font-semibold text-slate-100">{sc.label}</span>
        {active && (
          <span
            className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: sc.color + "30", color: sc.color }}
          >
            ACTIVE
          </span>
        )}
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">{sc.desc}</p>
    </button>
  );
}

// ---- Live telemetry preview card --------------------------------------------
function TelemetryPreview({ snap }) {
  if (!snap) return null;
  const t = snap.telemetry || {};
  const rows = [
    ["Pack Voltage", `${t.pack_voltage?.toFixed(2)} V`],
    ["Pack Current", `${t.pack_current?.toFixed(2)} A`],
    ["Pack Power", `${t.pack_power?.toFixed(1)} W`],
    ["State of Charge", `${t.soc?.toFixed(1)} %`],
    ["Cell Delta", `${((t.cell_delta || 0) * 1000).toFixed(0)} mV`],
    ["Max Temp", `${Math.max(...(t.temperature || [0])).toFixed(1)} °C`],
    ["Fault Flags", `0x${(t.fault_flags || 0).toString(16).padStart(2, "0").toUpperCase()}`],
    ["Fault Count", String(t.fault_count || 0)],
    ["BMS Online", t.bms_online ? "Yes" : "No"],
    ["Is Safe", snap.analysis?.is_safe ? "Yes" : "No"],
  ];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Live Preview
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
        <div className="mt-3 space-y-1">
          {snap.analysis.anomalies.map((a, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-rose-300 bg-rose-500/10 rounded-lg px-3 py-1.5">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              {a}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Override sliders -------------------------------------------------------
function OverrideSliders({ overrides, onChange }) {
  const sliders = [
    { key: "soc", label: "State of Charge (%)", min: 0, max: 100, step: 1, default: 72 },
    { key: "pack_voltage", label: "Pack Voltage (V)", min: 10, max: 17, step: 0.1, default: 14.4 },
    { key: "pack_current", label: "Pack Current (A)", min: -30, max: 20, step: 0.1, default: -4.2 },
  ];
  return (
    <div className="space-y-4">
      {sliders.map((s) => {
        const val = overrides[s.key] !== undefined ? overrides[s.key] : s.default;
        return (
          <div key={s.key}>
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <span>{s.label}</span>
              <span className="font-mono text-slate-200">{Number(val).toFixed(1)}</span>
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
        onClick={() => onChange({ soc: undefined, pack_voltage: undefined, pack_current: undefined })}
        className="text-xs text-slate-500 hover:text-slate-300 underline underline-offset-2"
      >
        Reset overrides
      </button>
    </div>
  );
}

// ---- Main console -----------------------------------------------------------
function ConsoleUI() {
  const navigate = useNavigate();
  const {
    enabled, scenario, animating,
    overrides, enableMock, disableMock,
    setScenario, setOverrides, toggleAnimating,
  } = useMock();

  const [preview, setPreview] = useState(null);
  const tickRef = useRef(0);

  // Live preview ticking
  useEffect(() => {
    const sc = scenario || "nominal";
    setPreview(generateSnapshot(sc, 0, overrides));
    if (!animating) return;
    const id = setInterval(() => {
      tickRef.current += 1;
      setPreview(generateSnapshot(sc, tickRef.current, overrides));
    }, 1200);
    return () => clearInterval(id);
  }, [scenario, overrides, animating]);

  const handleScenario = (id) => {
    setScenario(id);
    tickRef.current = 0;
    if (!enabled) enableMock(id);
  };

  const handleOverride = (patch) => {
    // Allow resetting overrides to defaults
    const next = { ...overrides };
    Object.entries(patch).forEach(([k, v]) => {
      if (v === undefined) delete next[k];
      else next[k] = v;
    });
    setOverrides(next);
  };

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
            <span className="font-semibold text-white text-sm">Demo Console</span>
            <span className="text-[10px] text-slate-600 font-mono bg-slate-800/80 px-2 py-0.5 rounded">
              /demo
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
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
      <div className={`px-6 py-2 text-xs font-medium flex items-center gap-2 ${
        enabled
          ? "bg-amber-500/10 border-b border-amber-500/20 text-amber-300"
          : "bg-slate-900/40 border-b border-slate-800/40 text-slate-500"
      }`}>
        <span className={`inline-flex h-1.5 w-1.5 rounded-full ${enabled ? "bg-amber-400 animate-pulse" : "bg-slate-600"}`} />
        {enabled
          ? `Mock mode ACTIVE — all dashboard pages are showing simulated data for "${SCENARIOS[scenario]?.label || scenario}"`
          : "Mock mode disabled — enable it above to inject simulated data into the dashboard"
        }
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left: scenarios + overrides */}
        <div className="xl:col-span-2 space-y-6">
          {/* Scenario selector */}
          <section>
            <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" /> Select Scenario
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.values(SCENARIOS).map((sc) => (
                <ScenarioCard
                  key={sc.id}
                  sc={sc}
                  active={scenario === sc.id}
                  onClick={() => handleScenario(sc.id)}
                />
              ))}
            </div>
          </section>

          {/* Manual overrides */}
          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
            <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-cyan-400" /> Parameter Overrides
              <span className="text-xs text-slate-600 font-normal ml-1">(applied on top of scenario values)</span>
            </h2>
            <OverrideSliders overrides={overrides} onChange={handleOverride} />
          </section>

          {/* Instructions */}
          <section className="rounded-xl border border-slate-800/60 bg-slate-900/30 p-5 text-xs text-slate-500 space-y-2 leading-relaxed">
            <div className="text-slate-400 font-semibold mb-2">How to use</div>
            <div>1. Pick a scenario above — data updates immediately in the preview on the right.</div>
            <div>2. Click <span className="text-amber-300 font-mono">Enable Mock</span> to inject the simulation into all dashboard pages.</div>
            <div>3. Navigate to the <span className="text-cyan-300">Dashboard</span>, <span className="text-cyan-300">Live Monitor</span>, or any other page — they all show simulated telemetry.</div>
            <div>4. Adjust sliders to fine-tune individual parameters on top of the scenario baseline.</div>
            <div>5. Toggle <span className="text-cyan-300">Animating</span> to freeze the data at any point for a static screenshot.</div>
            <div>6. Click <span className="text-rose-300 font-mono">Disable Mock</span> or the banner link to switch back to real hardware data.</div>
            <div className="pt-2 border-t border-slate-800">
              Passphrase: <span className="font-mono text-slate-400">{PASSPHRASE}</span>
              {" · "}
              URL: <span className="font-mono text-slate-400">/demo</span>
              {" · "}
              Not linked in sidebar navigation.
            </div>
          </section>
        </div>

        {/* Right: live preview */}
        <div className="space-y-4">
          <div className="sticky top-4">
            <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" /> Live Telemetry Preview
              {animating && <span className="text-[10px] text-emerald-500 animate-pulse">LIVE</span>}
            </h2>
            <TelemetryPreview snap={preview} />

            {/* Cell voltages mini-grid */}
            {preview?.telemetry?.cell_voltage && (
              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Cell Voltages</div>
                <div className="grid grid-cols-2 gap-2">
                  {preview.telemetry.cell_voltage.map((v, i) => {
                    const danger = v < 3.0 || v > 4.2;
                    const warn = v < 3.3 || v > 4.1;
                    return (
                      <div
                        key={i}
                        className={`rounded-lg border px-3 py-2 text-center ${
                          danger ? "border-rose-500/50 bg-rose-500/10" :
                          warn ? "border-amber-500/40 bg-amber-500/8" :
                          "border-slate-700 bg-slate-800/40"
                        }`}
                      >
                        <div className="text-[10px] text-slate-500 mb-0.5">Cell {i + 1}</div>
                        <div className={`text-sm font-mono font-semibold ${danger ? "text-rose-400" : warn ? "text-amber-400" : "text-emerald-300"}`}>
                          {v.toFixed(3)} V
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Temperature display */}
            {preview?.telemetry?.temperature && (
              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Temperatures</div>
                <div className="space-y-2">
                  {preview.telemetry.temperature.map((temp, i) => {
                    const hot = temp > 45;
                    const warm = temp > 35;
                    const pct = Math.min(100, ((temp - 20) / 40) * 100);
                    return (
                      <div key={i}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-500">Sensor {i + 1}</span>
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
