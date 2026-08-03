import {
  Thermometer,
  Zap,
  BatteryCharging,
  Gauge,
} from "lucide-react";

import useBatteryData from "../hooks/useBatteryData";

function LiveParameters() {
  const batteryData = useBatteryData();

  if (!batteryData) {
    return null;
  }

  return (
    <div className="bg-[#111827] rounded-xl p-6 border border-gray-800">

      <h2 className="text-xl font-bold mb-6">
        Live Parameters
      </h2>

      <div className="grid grid-cols-2 gap-6">

        <div className="flex items-center gap-3">
          <Thermometer className="text-red-400" />
          <div>
            <p className="text-gray-400">Temperature</p>
            <p className="text-xl font-bold">
              {batteryData.temperature} °C
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Zap className="text-yellow-400" />
          <div>
            <p className="text-gray-400">Voltage</p>
            <p className="text-xl font-bold">
              {batteryData.voltage} V
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <BatteryCharging className="text-green-400" />
          <div>
            <p className="text-gray-400">Current</p>
            <p className="text-xl font-bold">
              {batteryData.current} A
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Gauge className="text-blue-400" />
          <div>
            <p className="text-gray-400">Battery Health</p>
            <p className="text-xl font-bold">
              {batteryData.batteryHealth}%
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}

export default LiveParameters;