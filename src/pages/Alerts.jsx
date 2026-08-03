import {
  TriangleAlert,
  CircleCheck,
  Clock,
} from "lucide-react";

import useAlerts from "../hooks/useAlerts";

function Alerts() {

  const alerts = useAlerts();

  if (!alerts.length) {
    return <div className="text-white">Loading...</div>;
  }

  return (
    <>
      <h1 className="text-4xl font-bold">
        Alerts & Notifications
      </h1>

      <p className="text-gray-400 mt-2">
        Recent battery events and warning notifications.
      </p>

      <div className="space-y-5 mt-8">

        {alerts.map((alert, index) => (

          <div
            key={index}
            className="bg-[#111827] rounded-xl p-6 border border-gray-800 flex justify-between items-center"
          >

            <div className="flex items-center gap-4">

              {alert.status === "Safe" || alert.status === "Info" ? (
                <CircleCheck className="text-green-400" size={30} />
              ) : (
                <TriangleAlert className="text-red-400" size={30} />
              )}

              <div>

                <h2 className="font-bold text-lg">
                  {alert.message}
                </h2>

                <p
                  className={
                    alert.status === "Safe" || alert.status === "Info"
                      ? "text-green-400"
                      : "text-red-400"
                  }
                >
                  {alert.status}
                </p>

              </div>

            </div>

            <div className="flex items-center gap-2 text-gray-400">
              <Clock size={18} />
              {alert.time}
            </div>

          </div>

        ))}

      </div>

    </>
  );
}

export default Alerts;