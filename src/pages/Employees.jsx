import { useEffect, useState } from "react";

import Topbar from "../components/Topbar";

import { supabase } from "../lib/supabase";

export default function Employees() {

  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    role: "",
    department: "",
    salary: "",
  });

  // FETCH EMPLOYEES
  const fetchEmployees = async () => {

    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("id", { ascending: false });

    if (!error) {
      setEmployees(data);
    }

  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // ADD EMPLOYEE
  const addEmployee = async () => {

    if (
      !form.full_name ||
      !form.role
    ) {
      alert("Fill required fields");
      return;
    }

    setLoading(true);

    const employeeId =
      `EMP${String(employees.length + 1).padStart(3, "0")}`;

    const { error } = await supabase
      .from("employees")
      .insert([
        {
          employee_id: employeeId,
          full_name: form.full_name,
          role: form.role,
          department: form.department,
          salary: form.salary,
        },
      ]);

    setLoading(false);

    if (error) {

      console.log(error);

      alert("Error adding employee");

      return;
    }

    setForm({
      full_name: "",
      role: "",
      department: "",
      salary: "",
    });

    fetchEmployees();

    alert("Employee Added");

  };

  return (

    <div>

      {/* TOPBAR */}
      <Topbar title="Employees" />

      {/* FORM */}
      <div className="rounded-[35px] border border-white/10 bg-white/5 backdrop-blur-3xl p-5 md:p-8 mt-6">

        <h2 className="text-2xl md:text-3xl font-bold mb-6">
          Add Employee
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <input
            placeholder="Full Name"
            value={form.full_name}
            onChange={(e) =>
              setForm({
                ...form,
                full_name: e.target.value,
              })
            }
            className="bg-white/5 border border-white/10 rounded-2xl px-4 py-4 outline-none text-sm md:text-base"
          />

          <input
            placeholder="Role"
            value={form.role}
            onChange={(e) =>
              setForm({
                ...form,
                role: e.target.value,
              })
            }
            className="bg-white/5 border border-white/10 rounded-2xl px-4 py-4 outline-none text-sm md:text-base"
          />

          <input
            placeholder="Department"
            value={form.department}
            onChange={(e) =>
              setForm({
                ...form,
                department: e.target.value,
              })
            }
            className="bg-white/5 border border-white/10 rounded-2xl px-4 py-4 outline-none text-sm md:text-base"
          />

          <input
            placeholder="Salary"
            value={form.salary}
            onChange={(e) =>
              setForm({
                ...form,
                salary: e.target.value,
              })
            }
            className="bg-white/5 border border-white/10 rounded-2xl px-4 py-4 outline-none text-sm md:text-base"
          />

        </div>

        <button
          onClick={addEmployee}
          disabled={loading}
          className="mt-6 w-full md:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 text-base md:text-lg font-bold hover:scale-[1.02] transition-all"
        >

          {loading ? "Adding..." : "Add Employee"}

        </button>

      </div>

      {/* EMPLOYEE LIST */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mt-6">

        {employees.map((emp, index) => (

          <div
            key={index}
            className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/5 backdrop-blur-3xl p-5 hover:scale-[1.02] transition-all duration-300"
          >

            {/* Glow */}
            <div className="absolute top-[-50px] right-[-50px] w-[150px] h-[150px] bg-orange-500/20 blur-[120px] rounded-full"></div>

            <div className="relative z-10">

              {/* Avatar */}
              <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-3xl shadow-2xl">
                👤
              </div>

              {/* Name */}
              <h1 className="mt-5 text-2xl md:text-3xl font-black break-words">
                {emp.full_name}
              </h1>

              {/* Details */}
              <div className="mt-5 space-y-2 text-white/60 text-sm md:text-base">

                <p>ID : {emp.employee_id}</p>

                <p>Role : {emp.role}</p>

                <p>Department : {emp.department}</p>

                <p>Salary : ₹{emp.salary}</p>

              </div>

            </div>

          </div>

        ))}

      </div>

    </div>

  );
}