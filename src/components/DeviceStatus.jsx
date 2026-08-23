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

  if (!batteryData || !batteryData.raw) return null;

  const raw = batteryData.raw;
  const isOnline = raw.telemetry?.aws_online && raw.telemetry?.wifi_online;
  const deviceId = raw.device_id || "CGA-001";
  
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
              {deviceId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Wifi className={isOnline ? "text-green-400" : "text-red-400"} />
          <div>
            <p className="text-gray-400">Connection</p>
            <p className={`font-bold ${isOnline ? "text-green-400" : "text-red-400"}`}>
              {isOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <MapPin className="text-red-400" />
          <div>
            <p className="text-gray-400">Node ID</p>
            <p className="font-bold">
              {raw.telemetry?.node_id || "Unknown"}
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