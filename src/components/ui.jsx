// Small presentational primitives reused across all pages.
import { badgeTone, tone } from "../lib/faults";

export function Card({ title, subtitle, icon, actions, children, className = "", bodyClass = "" }) {
  return (
    <section className={`panel p-5 ${className}`}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            {icon && <span className="text-slate-300">{icon}</span>}
            <div>
              {title && <h3 className="text-sm font-semibold text-slate-100 tracking-wide">{title}</h3>}
              {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

export function Stat({ label, value, sub, toneKey = "ok", icon, large = false }) {
  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <div className={`tabular mt-2 font-semibold ${large ? "text-3xl" : "text-2xl"} ${tone[toneKey] || tone.ok}`}>
        {value}
      </div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

export function Pill({ children, toneKey = "ok", pulse = false }) {
  const cls = badgeTone[toneKey] || badgeTone.ok;
  return (
    <span className={`relative inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${cls}`}>
      {pulse && <span className="relative inline-flex h-1.5 w-1.5"><span className="pulse-dot absolute inline-flex h-full w-full rounded-full bg-current" /></span>}
      {children}
    </span>
  );
}

export function Bar({ value, max = 100, toneKey = "ok", height = 6 }) {
  const pct = Math.max(0, Math.min(100, (Math.abs(Number(value) || 0) / Math.abs(max || 1)) * 100));
  const colors = {
    safe: "bg-emerald-400",
    ok: "bg-sky-400",
    warning: "bg-amber-400",
    danger: "bg-rose-500",
  };
  return (
    <div className="w-full bg-slate-800 rounded-full" style={{ height }}>
      <div
        className={`${colors[toneKey] || colors.ok} rounded-full transition-all duration-500`}
        style={{ width: `${pct}%`, height }}
      />
    </div>
  );
}

// A single labelled readout used on dashboard tiles.
export function Readout({ label, value, sub, toneKey = "ok" }) {
  return (
    <div className="rounded-xl border border-slate-800/70 bg-slate-900/40 px-4 py-3">
      <div className="text-[11px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`tabular mt-1 text-xl font-semibold ${tone[toneKey] || tone.ok}`}>{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}
