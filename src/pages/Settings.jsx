import { useState } from "react";
import {
  Thermometer,
  BatteryCharging,
  Zap,
  Gauge,
  Save,
} from "lucide-react";

import { ref, update } from "firebase/database";
import { database } from "../firebase/firebase";

function Settings() {
  const [temperature, setTemperature] = useState(32.7);
  const [voltage, setVoltage] = useState(12.6);
  const [current, setCurrent] = useState(2.3);
  const [batteryHealth, setBatteryHealth] = useState(92);

  const saveData = async () => {
    let fireRisk = 10;

    if (temperature > 35) fireRisk += 20;
    if (temperature > 40) fireRisk += 30;

    if (batteryHealth < 80) fireRisk += 20;
    if (batteryHealth < 60) fireRisk += 20;

    if (voltage > 13) fireRisk += 10;

    let systemStatus = "SAFE";

    if (fireRisk >= 70) {
      systemStatus = "CRITICAL";
    } else if (fireRisk >= 40) {
      systemStatus = "WARNING";
    }

    await update(ref(database, "battery"), {
      temperature: Number(temperature),
      voltage: Number(voltage),
      current: Number(current),
      batteryHealth: Number(batteryHealth),
      fireRisk,
      systemStatus,
    });

    alert("Battery values updated successfully.");
  };

  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-4xl font-bold">
          Battery Simulator
        </h1>

        <p className="text-gray-400 mt-2">
          Simulate live battery values for AI testing.
        </p>
      </div>

      {/* Temperature */}

      <div className="bg-[#111827] rounded-xl p-6 border border-gray-800">

        <div className="flex items-center gap-3 mb-4">
          <Thermometer className="text-red-400" />
          <h2 className="text-xl font-bold">
            Temperature
          </h2>
        </div>

        <input
          type="range"
          min="20"
          max="70"
          value={temperature}
          onChange={(e) => setTemperature(e.target.value)}
          className="w-full"
        />

        <p className="mt-4 text-2xl text-red-400">
          {temperature} °C
        </p>

      </div>

      {/* Voltage */}

      <div className="bg-[#111827] rounded-xl p-6 border border-gray-800">

        <div className="flex items-center gap-3 mb-4">
          <Zap className="text-yellow-400" />
          <h2 className="text-xl font-bold">
            Voltage
          </h2>
        </div>

        <input
          type="range"
          min="10"
          max="14"
          step="0.1"
          value={voltage}
          onChange={(e) => setVoltage(e.target.value)}
          className="w-full"
        />

        <p className="mt-4 text-2xl text-yellow-400">
          {voltage} V
        </p>

      </div>

      {/* Current */}

      <div className="bg-[#111827] rounded-xl p-6 border border-gray-800">

        <div className="flex items-center gap-3 mb-4">
          <Gauge className="text-blue-400" />
          <h2 className="text-xl font-bold">
            Current
          </h2>
        </div>

        <input
          type="range"
          min="0"
          max="10"
          step="0.1"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          className="w-full"
        />

        <p className="mt-4 text-2xl text-blue-400">
          {current} A
        </p>

      </div>

      {/* Battery Health */}

      <div className="bg-[#111827] rounded-xl p-6 border border-gray-800">

        <div className="flex items-center gap-3 mb-4">
          <BatteryCharging className="text-green-400" />
          <h2 className="text-xl font-bold">
            Battery Health
          </h2>
        </div>

        <input
          type="range"
          min="20"
          max="100"
          value={batteryHealth}
          onChange={(e) => setBatteryHealth(e.target.value)}
          className="w-full"
        />

        <p className="mt-4 text-2xl text-green-400">
          {batteryHealth} %
        </p>

      </div>

      <button
        onClick={saveData}
        className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-xl flex items-center gap-3 text-lg font-semibold transition"
      >
        <Save />
        Update Firebase
      </button>

    </div>
  );
}

export default Settings;