import { useState } from "react";

import Sidebar from "./components/Sidebar";

import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Attendance from "./pages/Attendance";

export default function App() {

  const [active, setActive] = useState("dashboard");

  return (

    <div className="min-h-screen bg-[#050507] overflow-hidden text-white relative">

      {/* BACKGROUND */}
      <div className="absolute inset-0 overflow-hidden">

        <div className="absolute top-[-250px] left-[-150px] w-[700px] h-[700px] rounded-full bg-orange-500/20 blur-[180px]"></div>

        <div className="absolute bottom-[-250px] right-[-150px] w-[700px] h-[700px] rounded-full bg-red-700/20 blur-[180px]"></div>

        <div className="absolute top-[40%] left-[40%] w-[400px] h-[400px] rounded-full bg-green-700/20 blur-[160px]"></div>

      </div>

      <div className="relative z-10 flex h-screen">

        {/* SIDEBAR */}
        <Sidebar
          active={active}
          setActive={setActive}
        />

        {/* MAIN */}
        <div className="flex-1 p-5 overflow-auto">

          {active === "dashboard" && <Dashboard />}

          {active === "employees" && <Employees />}

          {active === "attendance" && <Attendance />}

          {active !== "dashboard" &&
            active !== "employees" &&
            active !== "attendance" && (

            <div className="rounded-[40px] border border-white/10 bg-white/5 backdrop-blur-[40px] p-10">

              <h1 className="text-5xl font-black">
                {active.toUpperCase()}
              </h1>

              <p className="mt-5 text-white/50 text-xl">
                Coming soon...
              </p>

            </div>

          )}

        </div>

      </div>

    </div>

  );
}