import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DeviceProvider } from "./context/DeviceContext";
import { MockProvider } from "./context/MockContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
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
    <ErrorBoundary>
      <BrowserRouter>
        <MockProvider>
          <DeviceProvider>
            <Routes>
              {/* Demo / Mock Console — accessed via /demo or /mock */}
              <Route path="/demo" element={<DemoConsole />} />
              <Route path="/mock" element={<DemoConsole />} />

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

              {/* Catch-all redirect to prevent blank page on unknown routes */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </DeviceProvider>
        </MockProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
