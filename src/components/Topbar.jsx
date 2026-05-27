import { useEffect, useState } from "react";

import { supabase } from "../lib/supabase";

export default function Topbar({ title }) {

  const employeeId =
    localStorage.getItem("employee_id");

  const [employee, setEmployee] = useState(null);

  // FETCH EMPLOYEE
  const fetchEmployee = async () => {

    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("employee_id", employeeId)
      .single();

    if (!error && data) {

      setEmployee(data);

    }

  };

  useEffect(() => {

    fetchEmployee();

  }, []);

  return (

    <div className="rounded-[35px] border border-white/10 bg-white/5 backdrop-blur-3xl p-5 md:p-7 relative overflow-hidden">

      {/* BG GLOW */}
      <div className="absolute top-[-120px] left-[-120px] w-[280px] h-[280px] bg-orange-500/20 blur-[140px] rounded-full"></div>

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

        {/* LEFT */}
        <div>

          <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-white via-orange-100 to-orange-300 bg-clip-text text-transparent">
            {title}
          </h1>

          <p className="mt-3 text-white/40 text-lg">
            Welcome back to TAJ ERP
          </p>

        </div>

        {/* RIGHT */}
        <div className="flex flex-col md:flex-row md:items-center gap-4">

          {/* SEARCH */}
          <input
            type="text"
            placeholder="Search..."
            className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none w-full md:w-[260px]"
          />

          {/* NOTIFICATION */}
          <button className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl">
            🔔
          </button>

          {/* STATUS */}
          <div className="px-6 h-16 rounded-2xl bg-green-500/20 border border-green-500/20 flex items-center justify-center text-green-300 font-bold">
            Online
          </div>

          {/* PROFILE */}
          <div className="flex items-center gap-4 rounded-2xl bg-white/5 border border-white/10 px-4 py-3">

            {/* PHOTO */}
            {employee?.profile_photo ? (

              <img
                src={employee.profile_photo}
                alt="Profile"
                className="w-16 h-16 rounded-2xl object-cover border border-white/10"
              />

            ) : (

              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-3xl font-black">

                {employee?.full_name
                  ? employee.full_name.charAt(0)
                  : "U"}

              </div>

            )}

            {/* INFO */}
            <div>

              <h1 className="text-2xl font-black">

                {employee?.full_name || "User"}

              </h1>

              <p className="text-white/40">

                {employee?.role || "Employee"}

              </p>

            </div>

          </div>

        </div>

      </div>

    </div>

  );
}