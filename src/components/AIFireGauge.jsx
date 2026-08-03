import GaugeComponent from "react-gauge-component";
import useBatteryData from "../hooks/useBatteryData";
import useAIPrediction from "../hooks/useAIPrediction";

function AIFireGauge() {

  const batteryData = useBatteryData();
  const ai = useAIPrediction(batteryData);

  if (!batteryData) return null;

  const prediction = ai || {
    fireRisk: batteryData.fireRisk || 0,
    systemStatus: batteryData.systemStatus || "SAFE",
  };

  let color = "#22c55e";

  if (prediction.fireRisk >= 70) {
    color = "#ef4444";
  } else if (prediction.fireRisk >= 30) {
    color = "#f59e0b";
  }

  return (

    <div className="bg-[#111827] rounded-xl p-6 border border-gray-800">

      <h2 className="text-2xl font-bold mb-6">
        AI Fire Risk Gauge
      </h2>

      <GaugeComponent

        type="semicircle"

        value={prediction.fireRisk}

        minValue={0}

        maxValue={100}

        arc={{
          colorArray: ["#22c55e", "#f59e0b", "#ef4444"],
          subArcs: [
            { limit: 30 },
            { limit: 70 },
            { limit: 100 },
          ],
        }}

        pointer={{
          color: color,
          length: 0.75,
          width: 15,
        }}

        labels={{
          valueLabel: {
            formatTextValue: () => `${prediction.fireRisk}%`,
            style: {
              fontSize: "40px",
              fill: "#ffffff",
            },
          },
        }}

      />

      <div className="text-center mt-4">

        <p className={`text-xl font-bold ${
          prediction.systemStatus === "SAFE"
            ? "text-green-400"
            : prediction.systemStatus === "WARNING"
            ? "text-yellow-400"
            : "text-red-500"
        }`}>

          {prediction.systemStatus}

        </p>

      </div>

    </div>

  );

}

export default AIFireGauge;