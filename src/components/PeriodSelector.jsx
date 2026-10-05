import { useState } from "react";
import { CalendarRange, Loader2, Search } from "lucide-react";

const toLocal = (ms) => {
  const d = new Date(ms);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
const fromLocal = (s) => (s ? new Date(s).getTime() : 0);

const PRESETS = [
  { label: "6h", ms: 6 * 3600 * 1000 },
  { label: "24h", ms: 24 * 3600 * 1000 },
  { label: "7d", ms: 7 * 24 * 3600 * 1000 },
  { label: "30d", ms: 30 * 24 * 3600 * 1000 },
];

export default function PeriodSelector({ onApply, loading, defaultValue }) {
  const now = Date.now();
  const def = defaultValue && defaultValue.start && defaultValue.end
    ? { start: toLocal(defaultValue.start), end: toLocal(defaultValue.end) }
    : { start: toLocal(now - 24 * 3600 * 1000), end: toLocal(now) };

  const [start, setStart] = useState(def.start);
  const [end, setEnd] = useState(def.end);

  const applyPreset = (ms) => {
    const e = Date.now();
    setStart(toLocal(e - ms));
    setEnd(toLocal(e));
    onApply(e - ms, e);
  };

  const applyCustom = () => {
    const s = fromLocal(start);
    const e = fromLocal(end);
    if (!s || !e || e <= s) {
      onApply(0, 0);
      return;
    }
    onApply(s, e);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-sm text-slate-300 mr-1">
          <CalendarRange className="h-4 w-4 text-cyan-300" />
          <span className="font-medium">Period</span>
        </div>

        <div className="flex items-center gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => applyPreset(p.ms)}
              className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-cyan-500/50 hover:text-cyan-200"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="mx-1 h-6 w-px bg-slate-700" />

        <label className="flex items-center gap-2 text-xs text-slate-400">
          From
          <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900/60 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-cyan-500" />
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-400">
          To
          <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900/60 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-cyan-500" />
        </label>

        <button
          onClick={applyCustom}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
          Analyze period
        </button>
      </div>
    </div>
  );
}
