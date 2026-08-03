import {
  BatteryCharging,
  Flame,
  Thermometer,
  ShieldCheck,
} from "lucide-react";

function StatusCard({ title, value, status, valueColor }) {

  let Icon = BatteryCharging;

  if (title === "Fire Risk") Icon = Flame;
  if (title === "Temperature") Icon = Thermometer;
  if (title === "System Status") Icon = ShieldCheck;

  return (
    <div className="bg-[#111827] rounded-xl p-6 shadow-lg border border-gray-800 hover:border-blue-500 transition-all">

      <div className="flex justify-between items-center">

        <p className="text-gray-400 font-medium">
          {title}
        </p>

        <Icon className="text-blue-400" size={26} />

      </div>

      <h2 className={`text-5xl font-bold mt-6 ${valueColor}`}>
        {value}
      </h2>

      <p className={`mt-3 font-medium ${valueColor}`}>
        {status}
      </p>

    </div>
  );
}

export default StatusCard;