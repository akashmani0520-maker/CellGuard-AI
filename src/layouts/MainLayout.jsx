import { Link, Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { TelemetryProvider } from "../context/TelemetryContext";
import AssistantDock from "../components/AssistantDock";
import { useMock } from "../context/MockContext";
import { SCENARIOS } from "../lib/mockData";

function DemoBanner() {
  const { enabled, scenario, disableMock } = useMock();
  if (!enabled) return null;
  const sc = SCENARIOS[scenario] || SCENARIOS.nominal;
  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-3 px-4 py-2 text-xs font-semibold"
      style={{
        background: "linear-gradient(90deg, rgba(234,179,8,0.18) 0%, rgba(234,179,8,0.08) 100%)",
        borderBottom: "1px solid rgba(234,179,8,0.35)",
      }}
    >
      <span className="flex items-center gap-2 text-amber-300">
        <span className="relative inline-flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
        </span>
        DEMO MODE ACTIVE — Scenario: {sc.label} — Hardware data bypassed
      </span>
      <div className="flex items-center gap-3">
        <Link
          to="/demo"
          className="text-amber-200 hover:text-white underline underline-offset-2"
        >
          Open Console
        </Link>
        <button
          onClick={disableMock}
          className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-amber-200 hover:bg-amber-500/20"
        >
          Disable
        </button>
      </div>
    </div>
  );
}

export default function MainLayout() {
  return (
    <TelemetryProvider>
      <div className="flex min-h-screen text-white">
        <Sidebar />
        <div className="flex-1 min-w-0">
          <DemoBanner />
          <div className="grid-bg min-h-screen">
            <div className="px-4 md:px-8 pt-6 pb-16">
              <Header />
              <main className="mt-6">
                <Outlet />
              </main>
            </div>
          </div>
        </div>
      </div>
      <AssistantDock />
    </TelemetryProvider>
  );
}
