import { useEffect, useState } from "react";

import Topbar from "../components/Topbar";

import { supabase } from "../lib/supabase";

export default function Permissions() {

  const [employees, setEmployees] = useState([]);

  // FETCH EMPLOYEES + PERMISSIONS
  const fetchData = async () => {

    const { data, error } = await supabase
      .from("employee_permissions")
      .select("*")
      .order("id", { ascending: true });

    if (!error) {
      setEmployees(data);
    }

  };

  useEffect(() => {
    fetchData();
  }, []);

  // TOGGLE
  const togglePermission = async (
    employeeId,
    field,
    value
  ) => {

    await supabase
      .from("employee_permissions")
      .update({
        [field]: !value,
      })
      .eq("employee_id", employeeId);

    fetchData();

  };

  const features = [
    "dashboard",
    "employees",
    "attendance",
    "salary",
    "stock",
    "orders",
    "reports",
    "settings",
    "calls",
  ];

  return (

    <div>

      <Topbar title="Permissions" />

      <div className="mt-6 rounded-[35px] border border-white/10 bg-white/5 backdrop-blur-3xl p-5 md:p-8 overflow-auto">

        <h1 className="text-3xl md:text-4xl font-black mb-8">
          Employee Permissions
        </h1>

        <div className="space-y-6">

          {employees.map((emp, index) => (

            <div
              key={index}
              className="rounded-[30px] border border-white/10 bg-white/5 p-5"
            >

              {/* HEADER */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                <div>

                  <h1 className="text-2xl font-black">
                    {emp.employee_id}
                  </h1>

                  <p className="text-white/40 mt-1">
                    Permission Control
                  </p>

                </div>

                {/* APPROVED */}
                <button
                  onClick={() =>
                    togglePermission(
                      emp.employee_id,
                      "approved",
                      emp.approved
                    )
                  }
                  className={`px-5 py-3 rounded-2xl font-bold transition-all ${
                    emp.approved
                      ? "bg-green-500"
                      : "bg-red-500"
                  }`}
                >

                  {emp.approved
                    ? "Approved"
                    : "Not Approved"}

                </button>

              </div>

              {/* FEATURES */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mt-8">

                {features.map((feature, i) => (

                  <button
                    key={i}
                    onClick={() =>
                      togglePermission(
                        emp.employee_id,
                        feature,
                        emp[feature]
                      )
                    }
                    className={`rounded-2xl p-4 border transition-all ${
                      emp[feature]
                        ? "bg-green-500/20 border-green-500"
                        : "bg-red-500/20 border-red-500"
                    }`}
                  >

                    <h1 className="font-bold capitalize text-sm md:text-base">
                      {feature}
                    </h1>

                    <p className="mt-2 text-xs md:text-sm">

                      {emp[feature]
                        ? "Enabled"
                        : "Disabled"}

                    </p>

                  </button>

                ))}

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>

  );
}