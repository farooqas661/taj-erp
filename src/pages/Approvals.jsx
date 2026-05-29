import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Topbar from "../components/Topbar";

export default function Approvals() {

  const [employees, setEmployees] =
    useState([]);

  const fetchPending = async () => {

    const { data } = await supabase
      .from("employees")
      .select("*")
      .eq("approval_status", "pending")
      .order("id", {
        ascending: false,
      });

    if (data) {

      setEmployees(data);

    }

  };

  useEffect(() => {

    fetchPending();

  }, []);

  const approveEmployee =
    async (employee) => {

      const employeeNumber =
        String(employee.id)
          .padStart(3, "0");

      const newEmployeeId =
        `EMP${employeeNumber}`;

      const { error } =
        await supabase
          .from("employees")
          .update({
            employee_id:
              newEmployeeId,
            approval_status:
              "approved",
            registration_status:
              "approved",
            status: "active",
            role:
              employee.requested_role ||
              "worker",
          })
          .eq("id", employee.id);

          if (error) {

            console.log("APPROVE ERROR:", error);
          
            alert(JSON.stringify(error));
          
            return;
          
          }
      alert(
        `${newEmployeeId} approved`
      );

      fetchPending();

    };

  const rejectEmployee =
    async (employee) => {

      const reason =
        prompt(
          "Reason for rejection?"
        );

      await supabase
        .from("employees")
        .update({
          approval_status:
            "rejected",
          registration_status:
            "rejected",
          rejected_reason:
            reason || "",
        })
        .eq("id", employee.id);

      fetchPending();

    };

  return (

    <div>

      <Topbar
        title="Approvals"
      />

      <div className="mt-6 rounded-[35px] border border-white/10 bg-white/5 backdrop-blur-3xl p-8">

        <h1 className="text-4xl font-black mb-6">
          Pending Registrations
        </h1>

        {employees.length === 0 && (

          <div className="text-white/50">
            No pending approvals
          </div>

        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

          {employees.map(
            (employee) => (

              <div
                key={employee.id}
                className="rounded-[30px] border border-white/10 bg-white/5 p-6"
              >

                {employee.selfie_url && (

                  <img
                    src={
                      employee.selfie_url
                    }
                    alt=""
                    className="w-28 h-28 rounded-full object-cover border border-white/10 mb-5 cursor-pointer"
                    onClick={() =>
                      window.open(
                        employee.selfie_url,
                        "_blank"
                      )
                    }
                  />

                )}

                <h2 className="text-3xl font-black">
                  {
                    employee.full_name
                  }
                </h2>

                <div className="mt-4 space-y-2 text-white/60">

                  <div>
                    Phone:
                    {" "}
                    {
                      employee.phone
                    }
                  </div>

                  <div>
                    Email:
                    {" "}
                    {
                      employee.email
                    }
                  </div>

                  <div>
                    Requested Role:
                    {" "}
                    {
                      employee.requested_role
                    }
                  </div>

                  <div>
                    Temporary ID:
                    {" "}
                    {
                      employee.employee_id
                    }
                  </div>

                </div>

                <div className="flex gap-3 mt-6">

                  <button
                    onClick={() =>
                      approveEmployee(
                        employee
                      )
                    }
                    className="px-6 py-3 rounded-2xl bg-green-600 font-bold"
                  >
                    Approve
                  </button>

                  <button
                    onClick={() =>
                      rejectEmployee(
                        employee
                      )
                    }
                    className="px-6 py-3 rounded-2xl bg-red-600 font-bold"
                  >
                    Reject
                  </button>

                </div>

              </div>

            )
          )}

        </div>

      </div>

    </div>

  );
}