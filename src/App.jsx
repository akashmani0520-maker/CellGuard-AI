import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DeviceProvider } from "./context/DeviceContext";
import { MockProvider } from "./context/MockContext";
import MainLayout from "./layouts/MainLayout";

import Dashboard from "./pages/Dashboard";
import LiveMonitor from "./pages/LiveMonitor";
import Analytics from "./pages/Analytics";
import AiPrediction from "./pages/AiPrediction";
import Alerts from "./pages/Alerts";
import History from "./pages/History";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import DemoConsole from "./pages/DemoConsole";

export default function App() {
  return (
    <BrowserRouter>
      <MockProvider>
        <DeviceProvider>
          <Routes>
            {/* Hidden demo console — no sidebar, accessed directly via URL */}
            <Route path="/demo" element={<DemoConsole />} />

            <Route element={<MainLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/live-monitor" element={<LiveMonitor />} />
              <Route path="/battery-analytics" element={<Analytics />} />
              <Route path="/ai-prediction" element={<AiPrediction />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/history" element={<History />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </DeviceProvider>
      </MockProvider>
    </BrowserRouter>
  );
}
