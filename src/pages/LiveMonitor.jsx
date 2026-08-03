import TemperatureChart from "../components/TemperatureChart";
import VoltageChart from "../components/VoltageChart";
import LiveParameters from "../components/LiveParameters";
import BatteryHeatMap from "../components/BatteryHeatMap";
import DeviceStatus from "../components/DeviceStatus";

function LiveMonitor() {
  return (
    <>

      <h1 className="text-4xl font-bold">
        Live Battery Monitoring
      </h1>

      <p className="text-gray-400 mt-2">
        Real-time monitoring of battery pack parameters.
      </p>

      {/* Live Parameters */}

      <LiveParameters />

      {/* Charts */}

      <div className="grid grid-cols-2 gap-6 mt-8">

        <TemperatureChart />

        <VoltageChart />

      </div>

      {/* Heat Map */}

      <BatteryHeatMap />

      {/* Device Status */}

      <DeviceStatus />

    </>
  );
}

export default LiveMonitor;