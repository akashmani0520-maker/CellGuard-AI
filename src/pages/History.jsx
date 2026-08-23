import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";
import { fetchBatteryHistory } from "../services/awsService";

function History() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const loadHistory = async () => {
      try {
        const data = await fetchBatteryHistory("NANO_ESP_BMS_NODE_01");
        if (isMounted && data) {
          setHistory(data.reverse());
        }
      } catch (error) {
        console.error("Failed to load history", error);
      }
    };

    loadHistory();
    const interval = setInterval(loadHistory, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div>
      <h1 className="text-4xl font-bold">Battery History</h1>
      <p className="text-gray-400 mt-2">Live battery monitoring history from AWS IoT Core.</p>

      <div className="bg-[#111827] rounded-xl border border-gray-800 mt-8 overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#1A2335]">
            <tr>
              <th className="text-left p-4">Time</th>
              <th className="text-left p-4">Battery Health</th>
              <th className="text-left p-4">Temperature</th>
              <th className="text-left p-4">Voltage</th>
              <th className="text-left p-4">Fire Risk</th>
              <th className="text-left p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item, index) => (
              <tr key={index} className="border-t border-gray-800 hover:bg-[#1A2335]">
                <td className="p-4 flex items-center gap-2">
                  <Clock3 size={18} />
                  {new Date(Number(item.timestamp)).toLocaleString()}
                </td>
                <td className="p-4">{item.batteryHealth}%</td>
                <td className="p-4">{item.temperature}°C</td>
                <td className="p-4">{item.voltage}V</td>
                <td className="p-4">{item.fireRisk}%</td>
                <td className={`p-4 font-semibold ${
                    item.systemStatus === "SAFE"
                      ? "text-green-400"
                      : item.systemStatus === "WARNING"
                      ? "text-yellow-400"
                      : "text-red-400"
                  }`}>
                  {item.systemStatus}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default History;