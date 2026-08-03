import {
  TriangleAlert,
  CircleCheckBig,
} from "lucide-react";

import useAlerts from "../hooks/useAlerts";

function RecentAlerts() {

  const alerts = useAlerts();

  if (!alerts.length) return null;

  return (
    <div className="bg-[#111827] rounded-xl p-6 border border-gray-800">

      <h2 className="text-xl font-bold mb-6">
        Recent Alerts
      </h2>

      <div className="space-y-4">

        {alerts.map((alert, index) => (

          <div
            key={index}
            className="flex justify-between items-center bg-[#1A2335] p-4 rounded-lg"
          >

            <div className="flex items-center gap-3">

              {alert.status === "Safe" || alert.status === "Info" ? (
                <CircleCheckBig className="text-green-400" />
              ) : (
                <TriangleAlert className="text-red-400" />
              )}

              <div>

                <p className="font-semibold">
                  {alert.message}
                </p>

                <p className="text-gray-400 text-sm">
                  {alert.time}
                </p>

              </div>

            </div>

            <span
              className={
                alert.status === "Safe" || alert.status === "Info"
                  ? "text-green-400"
                  : "text-red-400"
              }
            >
              {alert.status}
            </span>

          </div>

        ))}

      </div>

    </div>
  );
}

export default RecentAlerts;