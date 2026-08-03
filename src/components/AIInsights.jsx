import { Brain } from "lucide-react";
import useBatteryData from "../hooks/useBatteryData";
import useAIPrediction from "../hooks/useAIPrediction";

function AIInsights() {
  const batteryData = useBatteryData();
  const ai = useAIPrediction(batteryData);

  if (!batteryData) return null;

  const prediction = ai || {
    fireRisk: batteryData.fireRisk,
    batteryHealth: batteryData.batteryHealth,
    confidence: 97,
    remainingLife: "4.2 Years",
    systemStatus: batteryData.systemStatus,
    recommendation: "Waiting for AI prediction...",
  };

  let statusColor = "text-green-400";

  if (prediction.systemStatus === "WARNING") {
    statusColor = "text-yellow-400";
  }

  if (prediction.systemStatus === "CRITICAL") {
    statusColor = "text-red-500";
  }

  return (
    <div className="bg-[#111827] rounded-xl p-6 border border-gray-800">

      <div className="flex items-center gap-3 mb-6">
        <Brain className="text-blue-400" size={30} />
        <h2 className="text-2xl font-bold">
          AI Analysis
        </h2>
      </div>

      <div className="space-y-5">

        <div className="bg-[#1A2335] rounded-xl p-5">

          <p className="text-blue-400 font-semibold">
            AI Confidence
          </p>

          <h1 className="text-4xl font-bold mt-2">
            {prediction.confidence}%
          </h1>

          <p className="text-gray-400 mt-2">
            Machine learning prediction confidence.
          </p>

        </div>

        <div className="bg-[#1A2335] rounded-xl p-5">

          <p className="text-green-400 font-semibold">
            Remaining Battery Life
          </p>

          <h1 className="text-4xl font-bold mt-2">
            {prediction.remainingLife}
          </h1>

          <p className="text-gray-400 mt-2">
            Estimated useful battery life.
          </p>

        </div>

        <div className="bg-[#1A2335] rounded-xl p-5">

          <p className={`font-semibold ${statusColor}`}>
            System Status
          </p>

          <h1 className={`text-3xl font-bold mt-2 ${statusColor}`}>
            {prediction.systemStatus}
          </h1>

        </div>

        <div className="bg-[#1A2335] rounded-xl p-5">

          <p className="text-orange-400 font-semibold">
            AI Recommendation
          </p>

          <p className="text-gray-300 mt-3 leading-7">
            {prediction.recommendation}
          </p>

        </div>

      </div>

    </div>
  );
}

export default AIInsights;