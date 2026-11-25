import { useState } from "react";
import { Link } from "react-router-dom";
import { Save, RefreshCcw, Plug, Wifi, Cloud, Sparkles, Trash2, Palette, Check, Eye, EyeOff, Sliders, Shield } from "lucide-react";
import { Card, Pill, Readout } from "../components/ui";
import { useDevice } from "../context/DeviceContext";
import { useTelemetryCtx } from "../context/TelemetryContext";
import { fmtUptime, ago } from "../lib/format";
import { THEMES, getTheme, setTheme } from "../lib/theme";
import {
  getApiKey, setApiKey, clearApiKey, getModel, setModel,
  getSystemPrompt, setSystemPrompt, resetSystemPrompt,
  callChatCompletion, DEFAULT_MODEL, AVAILABLE_MODELS, sanitizeKey
} from "../lib/deepseek";

const REFRESH_OPTIONS = [3000, 5000, 10000, 30000];

export default function Settings() {
  const { deviceId, setDeviceId, refreshMs, setRefreshMs } = useDevice();
  const { latest, status, refetch } = useTelemetryCtx();
  const [draft, setDraft] = useState(deviceId);
  const [theme, setThemeState] = useState(getTheme());

  const chooseTheme = (id) => {
    setTheme(id);
    setThemeState(id);
  };
  const [saved, setSaved] = useState(false);
  const [apiKey, setApiKeyDraft] = useState(getApiKey());
  const [model, setModelDraft] = useState(getModel());
  const [prompt, setPromptDraft] = useState(getSystemPrompt());
  const [aiSaved, setAiSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState("");
  const t = latest?.telemetry || {};

  const [showKey, setShowKey] = useState(false);

  const saveDevice = () => {
    setDeviceId(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const saveAI = () => {
    const cleanKey = sanitizeKey(apiKey);
    setApiKey(cleanKey);
    setApiKeyDraft(cleanKey);
    setModel(model);
    setSystemPrompt(prompt);
    setAiSaved(true);
    setTestResult(cleanKey ? "Configuration saved." : "Saved (No API key set).");
    setTimeout(() => setAiSaved(false), 1500);
  };

  const resetAI = () => {
    clearApiKey();
    setModel(DEFAULT_MODEL);
    resetSystemPrompt();
    setPromptDraft(getSystemPrompt());
    setApiKeyDraft("");
    setModelDraft(DEFAULT_MODEL);
    setTestResult("API key cleared.");
  };

  const testAI = async () => {
    setTesting(true);
    setTestResult("");
    const cleanKey = sanitizeKey(apiKey);
    if (!cleanKey) {
      setTestResult("Error: Please enter a DeepSeek API key (sk-...) before testing.");
      setTesting(false);
      return;
    }
    // Save to storage immediately
    setApiKey(cleanKey);
    setApiKeyDraft(cleanKey);
    setModel(model);
    setSystemPrompt(prompt);

    try {
      await callChatCompletion({
        messages: [
          { role: "user", content: "Reply with the single word: OK" },
        ],
        model,
        apiKey: cleanKey,
      });
      setTestResult(`Connection OK — Successfully connected to DeepSeek using model "${model}".`);
    } catch (e) {
      let msg = e.message;
      if (msg.includes("401")) {
        msg += "\n\nTip: 401 Authentication Fails indicates an invalid API key. Please check:\n1. Copy the full sk-... string from platform.deepseek.com/api_keys\n2. Ensure your account is active and has credits\n3. Do not include extra quotes or 'Bearer' prefix.";
      } else if (msg.includes("402")) {
        msg += "\n\nTip: 402 Insufficient Balance indicates your DeepSeek account has zero remaining credit. Top up at platform.deepseek.com/top_up.";
      }
      setTestResult(`Failed: ${msg}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Settings</h2>
        <p className="text-sm text-slate-400">Device, polling and connection configuration.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card title="Device" subtitle="BMS node identifier used for all API calls" icon={<Plug className="h-4 w-4 text-cyan-300" />} className="xl:col-span-1">
          <label className="text-xs text-slate-400 block mb-1.5">Device ID</label>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
          />
          <button onClick={saveDevice} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-200 hover:bg-cyan-500/20">
            <Save className="h-3.5 w-3.5" /> {saved ? "Saved" : "Save device"}
          </button>
        </Card>

        <Card title="Polling" subtitle="How often the UI refreshes telemetry" icon={<RefreshCcw className="h-4 w-4 text-emerald-300" />}>
          <div className="flex flex-wrap gap-2">
            {REFRESH_OPTIONS.map((ms) => (
              <button
                key={ms}
                onClick={() => setRefreshMs(ms)}
                className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${refreshMs === ms ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-200" : "border-slate-700 bg-slate-900/50 text-slate-400 hover:text-slate-200"}`}
              >
                {ms / 1000}s
              </button>
            ))}
          </div>
          <div className="mt-4 text-xs text-slate-500">Current: {refreshMs / 1000}s interval</div>
        </Card>

        <Card title="Connection" subtitle="Latest uplink status" icon={<Wifi className="h-4 w-4 text-blue-300" />}>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm text-slate-300"><Plug className="h-4 w-4 text-slate-500" /> BMS</span><Pill toneKey={t.bms_online ? "safe" : "danger"} pulse={t.bms_online}>{t.bms_online ? "Online" : "Offline"}</Pill></div>
            <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm text-slate-300"><Wifi className="h-4 w-4 text-slate-500" /> WiFi</span><Pill toneKey={t.wifi_online !== false ? "safe" : "danger"}>{t.wifi_online !== false ? `${t.rssi} dBm` : "Offline"}</Pill></div>
            <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm text-slate-300"><Cloud className="h-4 w-4 text-slate-500" /> AWS</span><Pill toneKey={t.aws_online !== false ? "safe" : "danger"}>{t.aws_online !== false ? "Connected" : "Offline"}</Pill></div>
            <div className="pt-2 border-t border-slate-800 text-xs text-slate-400">
              <button onClick={refetch} className="text-cyan-300 hover:underline mr-1">Refresh now</button>· last {ago(status.updatedAt)} · API {status.online ? "reachable" : "unreachable"}
            </div>
          </div>
        </Card>

        <Card title="Appearance" subtitle="Choose the dashboard theme" icon={<Palette className="h-4 w-4 text-pink-300" />} className="xl:col-span-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {THEMES.map((th) => {
              const active = theme === th.id;
              return (
                <button
                  key={th.id}
                  id={`theme-${th.id}`}
                  onClick={() => chooseTheme(th.id)}
                  className={`group text-left rounded-xl border p-3 transition-all ${active ? "border-cyan-500/60 ring-1 ring-cyan-500/40 bg-cyan-500/5" : "border-slate-700 hover:border-slate-500"}`}
                >
                  <div className="flex h-14 overflow-hidden rounded-lg border border-slate-700">
                    <div className="flex-1" style={{ background: th.swatch[0] }} />
                    <div className="flex-1" style={{ background: th.swatch[1] }} />
                    <div className="w-6" style={{ background: th.swatch[2] }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-slate-100">{th.label}</div>
                      <div className="text-[11px] text-slate-500">{th.desc}</div>
                    </div>
                    {active && <Check className="h-4 w-4 text-cyan-300" />}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

      <Card
        title="AI Assistant — DeepSeek"
        subtitle="Connected to DeepSeek API with function-calling support"
        icon={<Sparkles className="h-4 w-4 text-purple-300" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">DeepSeek API Key</label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKeyDraft(e.target.value)}
                  placeholder="sk-..."
                  autoComplete="off"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 pr-10 text-sm font-mono text-slate-100 outline-none focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((s) => !s)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  title={showKey ? "Hide API key" : "Show API key"}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Keys start with <code className="text-purple-300">sk-</code>. Stored securely in your browser.
              </p>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Model</label>
              <select
                value={model}
                onChange={(e) => setModelDraft(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-purple-500"
              >
                {AVAILABLE_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                {AVAILABLE_MODELS.find((m) => m.id === model)?.desc || "OpenAI-compatible DeepSeek model"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={saveAI}
                className="inline-flex items-center gap-2 rounded-lg border border-purple-500/40 bg-purple-500/10 px-3 py-2 text-xs font-medium text-purple-200 hover:bg-purple-500/20"
              >
                <Save className="h-3.5 w-3.5" />
                {aiSaved ? "Saved" : "Save configuration"}
              </button>
              <button
                onClick={testAI}
                disabled={testing || !apiKey}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800/60 px-3 py-2 text-xs font-medium text-slate-100 hover:bg-slate-700 disabled:opacity-50"
              >
                {testing ? <RefreshCcw className="h-3.5 w-3.5 animate-spin" /> : <Plug className="h-3.5 w-3.5" />}
                Test connection
              </button>
              <button
                onClick={resetAI}
                className="inline-flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-xs font-medium text-rose-300 hover:bg-rose-500/15"
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear
              </button>
            </div>
            {testResult && (
              <div
                className={`text-xs rounded-lg border p-3 whitespace-pre-wrap leading-relaxed ${
                  testResult.startsWith("Connection OK")
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                    : testResult.startsWith("Failed:")
                    ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
                    : "border-slate-700 bg-slate-900/40 text-slate-300"
                }`}
              >
                {testResult}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-slate-400">System prompt</label>
              <button onClick={() => { resetSystemPrompt(); setPromptDraft(getSystemPrompt()); }} className="text-[11px] text-slate-500 hover:text-slate-300">Reset</button>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPromptDraft(e.target.value)}
              rows={12}
              className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs text-slate-200 outline-none focus:border-purple-500 font-mono"
            />
          </div>
        </div>
      </Card>

      <Card
        title="Demo & Mock Physics Simulator"
        subtitle="Internal testing console for 3S pack scenarios and viva defense"
        icon={<Sliders className="h-4 w-4 text-amber-300" />}
        className="xl:col-span-3"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-300">
              Access the secret demo console to test 12 viva protection scenarios, dynamic load simulator (0–15A), IR voltage sag, and publish simulated telemetry to AWS.
            </p>
            <p className="text-[11px] text-slate-500 mt-1 font-mono">
              Passphrase: <span className="text-slate-400">cellguard-demo</span> · Accessible via <span className="text-slate-400">/demo</span> or <span className="text-slate-400">/mock</span>
            </p>
          </div>
          <Link
            to="/demo"
            className="shrink-0 inline-flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-500/20 transition-colors"
          >
            <Shield className="h-3.5 w-3.5 text-amber-400" />
            Open Demo Console
          </Link>
        </div>
      </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Readout label="API" value={status.online ? "Online" : "Offline"} toneKey={status.online ? "ok" : "danger"} />
        <Readout label="Uptime" value={fmtUptime(t.uptime_ms)} />
        <Readout label="Node" value={t.node_id || "—"} />
        <Readout label="Sample Age" value={latest?.timestamp ? ago(latest.timestamp) : "—"} />
      </div>
    </div>
  );
}
