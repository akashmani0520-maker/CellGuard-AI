import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";

import Dashboard from "./pages/Dashboard";
import LiveMonitor from "./pages/LiveMonitor";
import BatteryAnalytics from "./pages/BatteryAnalytics";
import AIPrediction from "./pages/AIPrediction";
import Alerts from "./pages/Alerts";
import Reports from "./pages/Reports";
import History from "./pages/History";
import Settings from "./pages/Settings";

function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route element={<MainLayout />}>

          <Route path="/" element={<Dashboard />} />

          <Route
            path="/live-monitor"
            element={<LiveMonitor />}
          />

          <Route
            path="/battery-analytics"
            element={<BatteryAnalytics />}
          />

          <Route
            path="/ai-prediction"
            element={<AIPrediction />}
          />

          <Route
            path="/alerts"
            element={<Alerts />}
          />

          <Route
            path="/reports"
            element={<Reports />}
          />

          <Route
            path="/history"
            element={<History />}
          />

          <Route
            path="/settings"
            element={<Settings />}
          />

        </Route>

      </Routes>

    </BrowserRouter>
  );
}

export default App;