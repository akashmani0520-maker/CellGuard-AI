import { Cpu, Clock3, Activity } from "lucide-react";

function DashboardOverview() {
  return (
    <div className="grid grid-cols-3 gap-6 mt-8">

      <div className="bg-[#111827] rounded-xl p-6 border border-gray-800">

        <div className="flex items-center gap-3 mb-3">
          <Cpu className="text-blue-400" />
          <h3 className="text-lg font-semibold">
            Device ID
          </h3>
        </div>

        <p className="text-3xl font-bold">
          CGA-001
        </p>

        <p className="text-gray-400 mt-2">
          Primary Battery Unit
        </p>

      </div>

      <div className="bg-[#111827] rounded-xl p-6 border border-gray-800">

        <div className="flex items-center gap-3 mb-3">
          <Clock3 className="text-yellow-400" />
          <h3 className="text-lg font-semibold">
            Last Sync
          </h3>
        </div>

        <p className="text-3xl font-bold">
          2 sec
        </p>

        <p className="text-green-400 mt-2">
          Live Connected
        </p>

      </div>

      <div className="bg-[#111827] rounded-xl p-6 border border-gray-800">

        <div className="flex items-center gap-3 mb-3">
          <Activity className="text-green-400" />
          <h3 className="text-lg font-semibold">
            Active Sensors
          </h3>
        </div>

        <p className="text-3xl font-bold">
          8 / 8
        </p>

        <p className="text-green-400 mt-2">
          All Sensors Online
        </p>

      </div>

    </div>
  );
}

export default DashboardOverview;