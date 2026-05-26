import { useState } from "react";

import Sidebar from "./components/Sidebar";

import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Attendance from "./pages/Attendance";

export default function App() {

  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (

    <div className="min-h-screen bg-[#050507] text-white relative overflow-x-hidden">

      {/* BACKGROUND */}
      <div className="absolute inset-0 overflow-hidden">

        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-orange-500/20 blur-3xl rounded-full"></div>

        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-red-600/20 blur-3xl rounded-full"></div>

      </div>

      <div className="relative z-10 flex min-h-screen">

        {/* MOBILE SIDEBAR OVERLAY */}
        {sidebarOpen && (

          <div
            className="fixed inset-0 bg-black/70 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>

        )}

        {/* SIDEBAR */}
        <div className={`
          fixed lg:relative z-50 lg:z-10
          h-full lg:h-auto
          transition-all duration-300
          ${sidebarOpen ? "left-0" : "-left-full"}
          lg:left-0
        `}>

          <Sidebar
            active={active}
            setActive={(value) => {
              setActive(value);
              setSidebarOpen(false);
            }}
          />

        </div>

        {/* MAIN */}
        <div className="flex-1 p-3 md:p-5 overflow-y-auto w-full">

          {/* MOBILE TOPBAR */}
          <div className="lg:hidden flex items-center justify-between mb-5 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">

            <button
              onClick={() => setSidebarOpen(true)}
              className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center text-2xl"
            >
              ☰
            </button>

            <h1 className="text-2xl font-black bg-gradient-to-r from-orange-300 to-yellow-200 bg-clip-text text-transparent">
              TAJ ERP
            </h1>

          </div>

          {active === "dashboard" && <Dashboard />}

          {active === "employees" && <Employees />}

          {active === "attendance" && <Attendance />}

          {active !== "dashboard" &&
            active !== "employees" &&
            active !== "attendance" && (

            <div className="rounded-[40px] border border-white/10 bg-white/5 backdrop-blur-xl p-10">

              <h1 className="text-4xl lg:text-5xl font-black">
                {active.toUpperCase()}
              </h1>

              <p className="mt-5 text-white/50 text-lg lg:text-xl">
                Coming soon...
              </p>

            </div>

          )}

        </div>

      </div>

    </div>

  );
}