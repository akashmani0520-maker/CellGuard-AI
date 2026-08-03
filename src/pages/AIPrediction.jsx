import AIInsights from "../components/AIInsights";
import TemperatureChart from "../components/TemperatureChart";
import VoltageChart from "../components/VoltageChart";
import AIFireGauge from "../components/AIFireGauge";

import useBatteryData from "../hooks/useBatteryData";
import useAIPrediction from "../hooks/useAIPrediction";

function AIPrediction() {

  const batteryData = useBatteryData();
  const ai = useAIPrediction(batteryData);

  if (!batteryData) {
    return (
      <div className="text-white text-2xl">
        Loading AI Prediction...
      </div>
    );
  }

  const prediction = ai || {
    batteryHealth: batteryData.batteryHealth,
    fireRisk: batteryData.fireRisk,
    systemStatus: batteryData.systemStatus,
    confidence: 97,
    remainingLife: "4.2 Years",
    recommendation: "Waiting for AI Prediction...",
  };

  let riskColor = "text-green-400";

  if (prediction.fireRisk >= 70) {
    riskColor = "text-red-500";
  } else if (prediction.fireRisk >= 30) {
    riskColor = "text-yellow-400";
  }

  return (
    <div className="space-y-8">

      {/* Heading */}

      <div>

        <h1 className="text-4xl font-bold">
          AI Battery Prediction
        </h1>

        <p className="text-gray-400 mt-2">
          Real-Time Machine Learning Battery Health Analysis
        </p>

      </div>

      {/* Top Cards */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

        <div className="bg-[#111827] rounded-xl border border-gray-800 p-6">

          <p className="text-gray-400">
            Battery Health
          </p>

          <h1 className="text-5xl font-bold text-green-400 mt-4">
            {prediction.batteryHealth}%
          </h1>

        </div>

        <div className="bg-[#111827] rounded-xl border border-gray-800 p-6">

          <p className="text-gray-400">
            Fire Probability
          </p>

          <h1 className={`text-5xl font-bold mt-4 ${riskColor}`}>
            {prediction.fireRisk}%
          </h1>

          <p className={`mt-3 font-semibold ${riskColor}`}>
            {prediction.systemStatus}
          </p>

        </div>

        <div className="bg-[#111827] rounded-xl border border-gray-800 p-6">

          <p className="text-gray-400">
            Remaining Life
          </p>

          <h1 className="text-4xl font-bold text-blue-400 mt-4">
            {prediction.remainingLife}
          </h1>

        </div>

        <div className="bg-[#111827] rounded-xl border border-gray-800 p-6">

          <p className="text-gray-400">
            AI Confidence
          </p>

          <h1 className="text-5xl font-bold text-purple-400 mt-4">
            {prediction.confidence}%
          </h1>

        </div>

      </div>

      {/* AI Gauge + AI Insights */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        <AIFireGauge />

        <AIInsights />

      </div>

      {/* AI Recommendation */}

      <div className="bg-[#111827] rounded-xl border border-gray-800 p-6">

        <h2 className="text-2xl font-bold mb-4">
          AI Recommendation
        </h2>

        <p className="text-lg text-gray-300 leading-8">
          {prediction.recommendation}
        </p>

      </div>

      {/* Live Charts */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        <TemperatureChart />

        <VoltageChart />

      </div>

    </div>
  );
}

export default AIPrediction;