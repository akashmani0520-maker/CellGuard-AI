import { Bell, Wifi, UserCircle } from "lucide-react";

function Header() {
  const now = new Date();

  const time = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const date = now.toLocaleDateString([], {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex justify-between items-center bg-[#111827] rounded-xl p-6 border border-gray-800">

      <div>

        <h1 className="text-3xl font-bold">
          EV Battery Safety & Health Dashboard
        </h1>

        <p className="text-gray-400 mt-2">
          {date}
        </p>

      </div>

      <div className="flex items-center gap-8">

        <div className="text-right">

          <p className="text-2xl font-bold">
            {time}
          </p>

          <div className="flex items-center justify-end gap-2 mt-1">

            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>

            <span className="text-green-400">
              Live Connected
            </span>

          </div>

        </div>

        <Bell className="cursor-pointer hover:text-blue-400" />

        <Wifi className="text-green-400" />

        <UserCircle size={36} className="text-blue-400" />

      </div>

    </div>
  );
}

export default Header;