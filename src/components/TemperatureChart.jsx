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

function TemperatureChart() {

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

            temp: Number(batteryData.temperature),

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
        Live Temperature Trend
      </h2>

      <ResponsiveContainer width="100%" height={300}>

        <LineChart data={history}>

          <CartesianGrid stroke="#374151" />

          <XAxis dataKey="time" hide />

          <YAxis />

          <Tooltip />

          <Line
            dataKey="temp"
            stroke="#ef4444"
            strokeWidth={3}
            dot={false}
            isAnimationActive
          />

        </LineChart>

      </ResponsiveContainer>

    </div>

  );

}

export default TemperatureChart;