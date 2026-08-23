import { useState } from "react";
import { Power, Zap, AlertTriangle } from "lucide-react";
import { sendCommand } from "../services/awsService";

function Settings() {
  const [loading, setLoading] = useState(false);

  const handleCommand = async (command, state = 0) => {
    try {
      setLoading(true);
      await sendCommand("NANO_ESP_BMS_NODE_01", command, state);
      alert(`Command ${command} sent successfully.`);
    } catch (error) {
      alert("Failed to send command.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Device Control Panel</h1>
        <p className="text-gray-400 mt-2">Send commands to the BMS node via AWS API Gateway.</p>
      </div>

      {/* Load Relay */}
      <div className="bg-[#111827] rounded-xl p-6 border border-gray-800">
        <div className="flex items-center gap-3 mb-4">
          <Power className="text-red-400" />
          <h2 className="text-xl font-bold">Load Relay</h2>
        </div>
        <div className="flex gap-4 mt-4">
          <button
            onClick={() => handleCommand('load_relay', 1)}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50"
          >
            Turn ON
          </button>
          <button
            onClick={() => handleCommand('load_relay', 0)}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50"
          >
            Turn OFF
          </button>
        </div>
      </div>

      {/* Charger Relay */}
      <div className="bg-[#111827] rounded-xl p-6 border border-gray-800">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="text-yellow-400" />
          <h2 className="text-xl font-bold">Charger Relay</h2>
        </div>
        <div className="flex gap-4 mt-4">
          <button
            onClick={() => handleCommand('charger_relay', 1)}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50"
          >
            Turn ON
          </button>
          <button
            onClick={() => handleCommand('charger_relay', 0)}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50"
          >
            Turn OFF
          </button>
        </div>
      </div>

      {/* System Diagnostics */}
      <div className="bg-[#111827] rounded-xl p-6 border border-gray-800">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="text-blue-400" />
          <h2 className="text-xl font-bold">System Diagnostics</h2>
        </div>
        <button
          onClick={() => handleCommand('clear_faults')}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50 mt-4"
        >
          Clear Faults
        </button>
      </div>
    </div>
  );
}

export default Settings;