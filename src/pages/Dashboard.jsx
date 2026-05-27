import { useEffect, useState } from "react";

import Topbar from "../components/Topbar";

import { supabase } from "../lib/supabase";

export default function Dashboard() {

  const [employeeCount, setEmployeeCount] =
    useState(0);

  const [attendanceCount, setAttendanceCount] =
    useState(0);

  const [activeWorkers, setActiveWorkers] =
    useState(0);

  const [adminCount, setAdminCount] =
    useState(0);

  // FETCH DASHBOARD DATA
  const fetchDashboard = async () => {

    // EMPLOYEES
    const { data: employees } =
      await supabase
        .from("employees")
        .select("*");

    // ATTENDANCE
    const { data: attendance } =
      await supabase
        .from("attendance")
        .select("*");

    if (employees) {

      setEmployeeCount(employees.length);

      const admins =
        employees.filter(
          emp =>
            emp.role === "admin"
        );

      setAdminCount(admins.length);

    }

    if (attendance) {

      setAttendanceCount(
        attendance.length
      );

      const active =
        attendance.filter(
          item => !item.check_out
        );

      setActiveWorkers(active.length);

    }

  };

  useEffect(() => {

    fetchDashboard();

  }, []);

  // CARD DATA
  const cards = [

    {
      title: "Employees",
      value: employeeCount,
      icon: "🧑‍💼",
      glow: "from-orange-500/20",
    },

    {
      title: "Attendance",
      value: attendanceCount,
      icon: "🕒",
      glow: "from-green-500/20",
    },

    {
      title: "Active Workers",
      value: activeWorkers,
      icon: "🏭",
      glow: "from-blue-500/20",
    },

    {
      title: "Admins",
      value: adminCount,
      icon: "👑",
      glow: "from-pink-500/20",
    },

  ];

  return (

    <div>

      {/* TOPBAR */}
      <Topbar title="Dashboard" />

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mt-6">

        {cards.map((card, index) => (

          <div
            key={index}
            className="rounded-[35px] border border-white/10 bg-white/5 backdrop-blur-3xl p-6 relative overflow-hidden"
          >

            {/* GLOW */}
            <div className={`absolute top-[-80px] right-[-80px] w-[220px] h-[220px] bg-orange-500/20 blur-[140px] rounded-full`}>
            </div>

            <div className="relative z-10">

              {/* ICON */}
              <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-4xl">

                {card.icon}

              </div>

              {/* TITLE */}
              <p className="mt-8 text-white/50 text-2xl">
                {card.title}
              </p>

              {/* VALUE */}
              <h1 className="text-6xl font-black mt-3">
                {card.value}
              </h1>

            </div>

          </div>

        ))}

      </div>

      {/* LIVE STATUS */}
      <div className="mt-6 rounded-[35px] border border-white/10 bg-white/5 backdrop-blur-3xl p-8 relative overflow-hidden">

        <div className="absolute bottom-[-120px] right-[-120px] w-[300px] h-[300px] bg-red-500/10 blur-[180px] rounded-full"></div>

        <div className="relative z-10">

          <h1 className="text-5xl font-black">
            Factory Live Status
          </h1>

          <p className="mt-4 text-white/40 text-xl">
            Realtime operational overview from Supabase database
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10">

            {/* ACTIVE */}
            <div className="rounded-3xl bg-green-500/10 border border-green-500/20 p-6">

              <p className="text-green-300 text-xl font-bold">
                Active Workers
              </p>

              <h1 className="text-5xl font-black mt-3">
                {activeWorkers}
              </h1>

            </div>

            {/* ATTENDANCE */}
            <div className="rounded-3xl bg-orange-500/10 border border-orange-500/20 p-6">

              <p className="text-orange-300 text-xl font-bold">
                Attendance Records
              </p>

              <h1 className="text-5xl font-black mt-3">
                {attendanceCount}
              </h1>

            </div>

            {/* ADMINS */}
            <div className="rounded-3xl bg-blue-500/10 border border-blue-500/20 p-6">

              <p className="text-blue-300 text-xl font-bold">
                Admin Accounts
              </p>

              <h1 className="text-5xl font-black mt-3">
                {adminCount}
              </h1>

            </div>

          </div>

        </div>

      </div>

    </div>

  );
}