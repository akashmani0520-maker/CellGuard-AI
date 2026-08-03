import DashboardOverview from "../components/DashboardOverview";
import StatusCard from "../components/StatusCard";
import LiveParameters from "../components/LiveParameters";
import TemperatureChart from "../components/TemperatureChart";
import VoltageChart from "../components/VoltageChart";
import RecentAlerts from "../components/RecentAlerts";
import AIInsights from "../components/AIInsights";
import BatteryHeatMap from "../components/BatteryHeatMap";
import DeviceStatus from "../components/DeviceStatus";

import useBatteryData from "../hooks/useBatteryData";
import useAIPrediction from "../hooks/useAIPrediction";

function Dashboard() {
  const batteryData = useBatteryData();

  // AI ko battery data pass karna zaroori hai
  const aiPrediction = useAIPrediction(batteryData);

  if (!batteryData) {
    return (
      <div className="text-white text-2xl">
        Connecting to Firebase...
      </div>
    );
  }

  return (
    <div className="space-y-8">

      <DashboardOverview />

      {/* Status Cards */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

        <StatusCard
          title="Battery Health"
          value={`${batteryData.batteryHealth}%`}
          status="Excellent"
          valueColor="text-green-400"
        />

        <StatusCard
          title="Fire Risk"
          value={`${batteryData.fireRisk}%`}
          status={
            batteryData.fireRisk >= 70
              ? "Critical"
              : batteryData.fireRisk >= 40
              ? "Warning"
              : "Low Risk"
          }
          valueColor="text-orange-400"
        />

        <StatusCard
          title="Temperature"
          value={`${batteryData.temperature}°C`}
          status={
            batteryData.temperature >= 40
              ? "High"
              : "Normal"
          }
          valueColor="text-green-400"
        />

        <StatusCard
          title="System Status"
          value={batteryData.systemStatus}
          status="All Systems Normal"
          valueColor="text-green-400"
        />

      </div>

      {/* Live Parameters + AI Gauge */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        <LiveParameters />

        <div className="bg-[#111827] rounded-xl p-6 border border-gray-800">

          <h2 className="text-xl font-bold mb-6">
            AI Fire Risk Gauge
          </h2>

          <div className="flex justify-center items-center h-72">

            <div className="w-44 h-44 rounded-full border-[12px] border-green-500 flex items-center justify-center">

              <div className="text-center">

                <h1 className="text-5xl font-bold text-green-400">
                  {aiPrediction
                    ? `${aiPrediction.fireRisk}%`
                    : `${batteryData.fireRisk}%`}
                </h1>

                <p className="text-gray-400 mt-2">
                  {aiPrediction
                    ? aiPrediction.systemStatus
                    : batteryData.systemStatus}
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Charts */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        <TemperatureChart />

        <VoltageChart />

      </div>

      {/* Alerts + AI */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        <RecentAlerts />

        <AIInsights />

      </div>

      {/* Heatmap */}

      <BatteryHeatMap />

      {/* Device Status */}

      <DeviceStatus />

    </div>
  );
}

export default Dashboard;