import useBatteryData from "../hooks/useBatteryData";

function BatteryHeatMap() {
  const batteryData = useBatteryData();

  if (!batteryData) {
    return (
      <div className="bg-[#111827] rounded-xl p-6 mt-8 border border-gray-800">
        <h2 className="text-2xl font-bold">
          Battery Cell Heat Map
        </h2>

        <p className="text-gray-400 mt-4">
          Connecting to Firebase...
        </p>
      </div>
    );
  }

  const base = Number(batteryData.temperature);

  // 16 simulated battery cells
  const cells = [
    base - 2,
    base - 1,
    base,
    base + 1,

    base - 1,
    base,
    base + 2,
    base + 3,

    base - 2,
    base,
    base + 1,
    base + 4,

    base - 3,
    base - 1,
    base,
    base + 2,
  ];

  const getColor = (temp) => {
    if (temp >= 45)
      return "bg-red-600 animate-pulse";

    if (temp >= 40)
      return "bg-red-500";

    if (temp >= 35)
      return "bg-orange-500";

    if (temp >= 30)
      return "bg-yellow-500";

    return "bg-green-500";
  };

  return (
    <div className="bg-[#111827] rounded-xl p-6 border border-gray-800">

      <div className="flex justify-between items-center mb-6">

        <div>

          <h2 className="text-2xl font-bold">
            Battery Cell Heat Map
          </h2>

          <p className="text-gray-400 mt-1">
            Real-Time Thermal Distribution
          </p>

        </div>

        <div className="text-right">

          <p className="text-gray-400">
            Average
          </p>

          <h2 className="text-3xl font-bold text-green-400">
            {base.toFixed(1)}°C
          </h2>

        </div>

      </div>

      <div className="grid grid-cols-4 gap-5">

        {cells.map((temp, index) => (

          <div
            key={index}
            className={`${getColor(temp)}
            h-24
            rounded-xl
            flex
            flex-col
            justify-center
            items-center
            shadow-lg
            transition-all
            duration-500
            hover:scale-105`}
          >

            <p className="text-xs text-white/80">
              Cell {index + 1}
            </p>

            <h2 className="text-2xl font-bold text-white">
              {temp.toFixed(1)}°
            </h2>

          </div>

        ))}

      </div>

      <div className="flex gap-8 mt-8 flex-wrap">

        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-green-500 rounded"></div>
          <span>Safe</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-yellow-500 rounded"></div>
          <span>Warm</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-orange-500 rounded"></div>
          <span>High</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-red-600 rounded animate-pulse"></div>
          <span>Critical</span>
        </div>

      </div>

    </div>
  );
}

export default BatteryHeatMap;