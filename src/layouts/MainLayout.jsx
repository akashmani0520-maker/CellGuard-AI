import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { Outlet } from "react-router-dom";

function MainLayout() {
  return (
    <div className="flex min-h-screen bg-[#0B1220] text-white">

      <Sidebar />

      <div className="flex-1 overflow-y-auto">

        <div className="p-8">

          <Header />

          <div className="mt-8">

            <Outlet />

          </div>

        </div>

      </div>

    </div>
  );
}

export default MainLayout;