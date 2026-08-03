import {
  LayoutDashboard,
  Activity,
  BatteryCharging,
  Brain,
  History,
  Settings,
  TriangleAlert,
  FileText,
  LogOut,
} from "lucide-react";

import { NavLink } from "react-router-dom";

const menuItems = [
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    path: "/",
  },
  {
    icon: Activity,
    title: "Live Monitor",
    path: "/live-monitor",
  },
  {
    icon: BatteryCharging,
    title: "Battery Analytics",
    path: "/battery-analytics",
  },
  {
    icon: Brain,
    title: "AI Prediction",
    path: "/ai-prediction",
  },
  {
    icon: TriangleAlert,
    title: "Alerts",
    path: "/alerts",
  },
  {
    icon: FileText,
    title: "Reports",
    path: "/reports",
  },
  {
    icon: History,
    title: "History",
    path: "/history",
  },
  {
    icon: Settings,
    title: "Settings",
    path: "/settings",
  },
];

function Sidebar() {
  return (
    <div className="w-72 bg-[#111827] border-r border-gray-800 flex flex-col min-h-screen">

      {/* Logo */}
      <div className="p-8">
        <h1 className="text-3xl font-bold text-blue-500">
          CellGuard AI
        </h1>

        <p className="text-gray-400 text-sm mt-2">
          Battery Safety Platform
        </p>
      </div>

      {/* Menu */}
      <div className="flex-1 px-5">
        <div className="space-y-2">

          {menuItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={index}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-4 p-4 rounded-xl transition-all duration-300 ${
                    isActive
                      ? "bg-blue-600"
                      : "hover:bg-[#1A2335]"
                  }`
                }
              >
                <Icon size={20} />

                <span className="font-medium">
                  {item.title}
                </span>
              </NavLink>
            );
          })}

        </div>
      </div>

      {/* Bottom User Panel */}
      <div className="border-t border-gray-800 p-5">

        <div className="flex items-center justify-between">

          <div>
            <p className="font-semibold">
              Admin
            </p>

            <p className="text-gray-400 text-sm">
              System Operator
            </p>
          </div>

          <LogOut
            className="cursor-pointer hover:text-red-400"
            size={22}
          />

        </div>

      </div>

    </div>
  );
}

export default Sidebar;