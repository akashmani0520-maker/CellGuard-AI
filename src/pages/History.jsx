import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";
import { ref, onValue } from "firebase/database";
import { database } from "../firebase/firebase";

function History() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const historyRef = ref(database, "history");

    const unsubscribe = onValue(historyRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = Object.values(snapshot.val());
        setHistory(data.reverse());
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div>

      <h1 className="text-4xl font-bold">
        Battery History
      </h1>

      <p className="text-gray-400 mt-2">
        Live battery monitoring history from Firebase.
      </p>

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

              <tr
                key={index}
                className="border-t border-gray-800 hover:bg-[#1A2335]"
              >

                <td className="p-4 flex items-center gap-2">
                  <Clock3 size={18} />
                  {item.time}
                </td>

                <td className="p-4">
                  {item.batteryHealth}%
                </td>

                <td className="p-4">
                  {item.temperature}°C
                </td>

                <td className="p-4">
                  {item.voltage}V
                </td>

                <td className="p-4">
                  {item.fireRisk}%
                </td>

                <td
                  className={`p-4 font-semibold ${
                    item.systemStatus === "SAFE"
                      ? "text-green-400"
                      : item.systemStatus === "WARNING"
                      ? "text-yellow-400"
                      : "text-red-400"
                  }`}
                >
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