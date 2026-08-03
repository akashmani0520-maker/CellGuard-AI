import DashboardOverview from "../components/DashboardOverview";
import StatusCard from "../components/StatusCard";
import TemperatureChart from "../components/TemperatureChart";
import VoltageChart from "../components/VoltageChart";
import BatteryHeatMap from "../components/BatteryHeatMap";
import AIInsights from "../components/AIInsights";

function BatteryAnalytics() {
  return (
    <>

      <h1 className="text-4xl font-bold">
        Battery Analytics
      </h1>

      <p className="text-gray-400 mt-2">
        Complete battery health analysis and performance insights.
      </p>

      <DashboardOverview />

      <div className="grid grid-cols-4 gap-6 mt-8">

        <StatusCard
          title="Battery Health"
          value="92%"
          status="Excellent"
          valueColor="text-green-400"
        />

        <StatusCard
          title="Temperature"
          value="32.7°C"
          status="Normal"
          valueColor="text-green-400"
        />

        <StatusCard
          title="Fire Risk"
          value="18%"
          status="Low Risk"
          valueColor="text-orange-400"
        />

        <StatusCard
          title="System Status"
          value="SAFE"
          status="Healthy"
          valueColor="text-green-400"
        />

      </div>

      <div className="grid grid-cols-2 gap-6 mt-8">

        <TemperatureChart />

        <VoltageChart />

      </div>

      <BatteryHeatMap />

      <div className="mt-8">

        <AIInsights />

      </div>

    </>
  );
}

export default BatteryAnalytics;