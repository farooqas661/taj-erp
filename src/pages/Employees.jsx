import { useState } from "react";

export default function Employees() {
  const generateEmployeeId = () => {
    return `EMP${String(employees.length + 1).padStart(3, "0")}`;
  };
  const [employees, setEmployees] = useState([
    {
      employee_id: "EMP001",
      full_name: "Admin User",
      role: "Admin",
      department: "Management",
      salary: "50000",
    },
  ]);

  const [form, setForm] = useState({
    employee_id: generateEmployeeId(),
    full_name: "",
    role: "",
    department: "",
    salary: "",
  });

  const addEmployee = () => {

    if (
      !form.employee_id ||
      !form.full_name ||
      !form.role
    ) {
      alert("Fill all required fields");
      return;
    }

    setEmployees([
      ...employees,
      form,
    ]);

    setForm({
      employee_id: generateEmployeeId(),
      full_name: "",
      role: "",
      department: "",
      salary: "",
    });

    alert("Employee Added");
  };

  return (
    <div>

      {/* HEADER */}
      <div className="rounded-[40px] border border-white/10 bg-white/5 backdrop-blur-[40px] p-8">

        <h1 className="text-6xl font-black bg-gradient-to-r from-white via-orange-100 to-orange-300 bg-clip-text text-transparent">
          Employee Management
        </h1>

        <p className="mt-4 text-white/50 text-xl">
          Manage factory employees
        </p>

      </div>

      {/* FORM */}
      <div className="rounded-[40px] border border-white/10 bg-white/5 backdrop-blur-[40px] p-8 mt-8">

        <h2 className="text-3xl font-bold mb-6">
          Add Employee
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          <input
            placeholder="Employee ID"
            value={form.employee_id}
            onChange={(e) =>
              setForm({
                ...form,
                employee_id: e.target.value,
              })
            }
            className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
          />

          <input
            placeholder="Full Name"
            value={form.full_name}
            onChange={(e) =>
              setForm({
                ...form,
                full_name: e.target.value,
              })
            }
            className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
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
            className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
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
            className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
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
            className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
          />

        </div>

        <button
          onClick={addEmployee}
          className="mt-8 px-10 py-5 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 text-xl font-bold hover:scale-[1.03] transition-all"
        >
          Add Employee
        </button>

      </div>

      {/* EMPLOYEE LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-8">

        {employees.map((emp, index) => (

          <div
            key={index}
            className="relative overflow-hidden rounded-[35px] border border-white/10 bg-white/5 backdrop-blur-[40px] p-6 hover:scale-[1.03] transition-all duration-300"
          >

            <div className="absolute top-[-70px] right-[-70px] w-[180px] h-[180px] rounded-full bg-orange-500/20 blur-[100px]"></div>

            <div className="relative z-10">

              <div className="w-20 h-20 rounded-[25px] bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-4xl shadow-2xl">
                👤
              </div>

              <h1 className="mt-6 text-3xl font-black">
                {emp.full_name}
              </h1>

              <div className="mt-5 space-y-3 text-white/60">

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