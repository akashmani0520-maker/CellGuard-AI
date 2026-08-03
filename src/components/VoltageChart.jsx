import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import { useEffect, useState } from "react";
import useBatteryData from "../hooks/useBatteryData";

function VoltageChart() {

  const batteryData = useBatteryData();
  const [history, setHistory] = useState([]);

  useEffect(() => {

    if (!batteryData) return;

    const interval = setInterval(() => {

      setHistory((prev) => {

        const updated = [

          ...prev,

          {

            time: new Date().toLocaleTimeString(),

            voltage: Number(batteryData.voltage),

          },

        ];

        return updated.slice(-20);

      });

    }, 2000);

    return () => clearInterval(interval);

  }, [batteryData]);

  if (!batteryData) return null;

  return (

    <div className="bg-[#111827] rounded-xl p-6 border border-gray-800">

      <h2 className="text-xl font-bold mb-6">
        Live Voltage Trend
      </h2>

      <ResponsiveContainer width="100%" height={300}>

        <LineChart data={history}>

          <CartesianGrid stroke="#374151" />

          <XAxis dataKey="time" hide />

          <YAxis />

          <Tooltip />

          <Line
            dataKey="voltage"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={false}
            isAnimationActive
          />

        </LineChart>

      </ResponsiveContainer>

    </div>

  );

}

export default VoltageChart;