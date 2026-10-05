import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { TelemetryProvider } from "../context/TelemetryContext";
import AssistantDock from "../components/AssistantDock";

export default function MainLayout() {
  return (
    <TelemetryProvider>
      <div className="flex min-h-screen text-white">
        <Sidebar />
        <div className="flex-1 min-w-0">
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
