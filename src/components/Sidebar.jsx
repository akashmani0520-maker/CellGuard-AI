import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Activity, LineChart, BrainCircuit, Bell,
  History, FileText, Settings, ShieldCheck,
} from "lucide-react";
import { useTelemetryCtx } from "../context/TelemetryContext";

const LINKS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/live-monitor", label: "Live Monitor", icon: Activity },
  { to: "/battery-analytics", label: "Battery Analytics", icon: LineChart },
  { to: "/ai-prediction", label: "AI Prediction", icon: BrainCircuit },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/history", label: "History", icon: History },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const { status } = useTelemetryCtx();
  const online = status.online;

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-slate-800/70 bg-ink-950/60 sticky top-0 h-screen">
      <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-800/70">
        <img
          src="/cellguard.jpeg"
          alt="CellGuard AI Logo"
          className="h-9 w-9 rounded-xl object-cover border border-cyan-500/30 shadow-sm"
        />
        <div>
          <div className="text-sm font-bold text-white tracking-wide">CellGuard AI</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {LINKS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 border border-transparent"
              }`
            }
          >
            <Icon className="h-4.5 w-4.5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-slate-800/70">
        <div className="rounded-xl glass p-3 flex items-center gap-3">
          <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${online ? "bg-emerald-400 pulse-dot" : "bg-rose-500"}`} />
          <div className="text-xs">
            <div className="text-slate-200 font-medium">{online ? "Live stream" : "Disconnected"}</div>
            <div className="text-slate-500">{online ? "AWS uplink active" : "check network"}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
