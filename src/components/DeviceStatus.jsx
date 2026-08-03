import {
  Wifi,
  Cpu,
  MapPin,
  Clock,
  BatteryCharging,
} from "lucide-react";

import useBatteryData from "../hooks/useBatteryData";

function DeviceStatus() {
  const batteryData = useBatteryData();

  if (!batteryData) return null;

  return (
    <div className="bg-[#111827] rounded-xl p-6 mt-8 border border-gray-800">

      <h2 className="text-2xl font-bold mb-6">
        Device Status
      </h2>

      <div className="grid grid-cols-2 gap-6">

        <div className="flex items-center gap-3">
          <Cpu className="text-blue-400" />
          <div>
            <p className="text-gray-400">Device ID</p>
            <p className="font-bold">
              CGA-001
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Wifi className="text-green-400" />
          <div>
            <p className="text-gray-400">Connection</p>
            <p className="font-bold text-green-400">
              Online
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <MapPin className="text-red-400" />
          <div>
            <p className="text-gray-400">Location</p>
            <p className="font-bold">
              Nagpur
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Clock className="text-yellow-400" />
          <div>
            <p className="text-gray-400">Last Updated</p>
            <p className="font-bold">
              Live
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <BatteryCharging className="text-green-400" />
          <div>
            <p className="text-gray-400">Battery Health</p>
            <p className="font-bold text-green-400">
              {batteryData.batteryHealth}%
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}

export default DeviceStatus;