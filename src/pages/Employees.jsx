import { useEffect, useState } from "react";

import Topbar from "../components/Topbar";

import { supabase } from "../lib/supabase";

export default function Employees() {

  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(false);

  const [selectedEmployee, setSelectedEmployee] =
    useState(null);

  const [permissions, setPermissions] =
    useState(null);

  const [editEmployee, setEditEmployee] =
    useState(null);

  // FORM
  const [form, setForm] = useState({
    employee_id: "",
    full_name: "",
    phone: "",
    email: "",
    department: "",
    password: "",
    role: "worker",
    salary: "",
    emergency_contact: "",
  });

  // FETCH EMPLOYEES
  const fetchEmployees = async () => {

    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("id", { ascending: false });

    if (!error && data) {

      setEmployees(data);

    }

  };

  useEffect(() => {

    fetchEmployees();

  }, []);

  // HANDLE CHANGE
  const handleChange = (e) => {

    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

  };

  // ADD EMPLOYEE
  const handleAddEmployee = async () => {

    if (
      !form.employee_id ||
      !form.full_name ||
      !form.password
    ) {

      alert("Fill required fields");

      return;

    }

    setLoading(true);

    // INSERT EMPLOYEE
    const { error } = await supabase
      .from("employees")
      .insert([
        {
          ...form,
          approval_status: "approved",
          status: "active",
        },
      ]);

    if (!error) {

      // DEFAULT PERMISSIONS
      await supabase
        .from("employee_permissions")
        .insert([
          {
            employee_id: form.employee_id,
            dashboard: true,
            employees: false,
            attendance: true,
            salary: false,
            stock: false,
            orders: false,
            reports: false,
            settings: false,
            calls: false,
          },
        ]);

      alert("Employee Added");

      setForm({
        employee_id: "",
        full_name: "",
        phone: "",
        email: "",
        department: "",
        password: "",
        role: "worker",
        salary: "",
        emergency_contact: "",
      });

      fetchEmployees();

    } else {

      alert(error.message);

    }

    setLoading(false);

  };

  // DELETE EMPLOYEE
  const handleDelete = async (employeeId) => {

    const confirmDelete =
      confirm("Delete Employee?");

    if (!confirmDelete) return;

    await supabase
      .from("employees")
      .delete()
      .eq("employee_id", employeeId);

    await supabase
      .from("employee_permissions")
      .delete()
      .eq("employee_id", employeeId);

    fetchEmployees();

  };

  // OPEN PERMISSIONS
  const openPermissions = async (employee) => {

    setSelectedEmployee(employee);

    const { data } = await supabase
      .from("employee_permissions")
      .select("*")
      .eq(
        "employee_id",
        employee.employee_id
      )
      .single();

    setPermissions(data);

  };

  // TOGGLE PERMISSION
  const togglePermission = async (
    key,
    value
  ) => {

    const updated = {
      ...permissions,
      [key]: !value,
    };

    setPermissions(updated);

    await supabase
      .from("employee_permissions")
      .update({
        [key]: !value,
      })
      .eq(
        "employee_id",
        selectedEmployee.employee_id
      );

  };

  return (

    <div>

      {/* TOPBAR */}
      <Topbar title="Employees" />

      {/* ADD EMPLOYEE */}
      <div className="mt-6 rounded-[35px] border border-white/10 bg-white/5 backdrop-blur-3xl p-6 md:p-8">

        <h1 className="text-3xl font-black mb-6">
          Add Employee
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

          <input
            name="employee_id"
            value={form.employee_id}
            onChange={handleChange}
            placeholder="Employee ID"
            className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
          />

          <input
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            placeholder="Full Name"
            className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
          />

          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Phone Number"
            className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
          />

          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
          />

          <input
            name="department"
            value={form.department}
            onChange={handleChange}
            placeholder="Department"
            className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
          />

          <input
            name="salary"
            value={form.salary}
            onChange={handleChange}
            placeholder="Salary"
            className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
          />

          <input
            name="emergency_contact"
            value={form.emergency_contact}
            onChange={handleChange}
            placeholder="Emergency Contact"
            className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
          />

          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Password"
            className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
          />

          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
          >

            <option value="worker">
              Worker
            </option>

            <option value="admin">
              Admin
            </option>

            <option value="manager">
              Manager
            </option>

          </select>

        </div>

        <button
          onClick={handleAddEmployee}
          disabled={loading}
          className="mt-6 px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 font-bold text-lg"
        >

          {loading
            ? "Adding..."
            : "Add Employee"}

        </button>

      </div>

      {/* EMPLOYEE LIST */}
      <div className="mt-6 rounded-[35px] border border-white/10 bg-white/5 backdrop-blur-3xl p-6 md:p-8">

        <h1 className="text-3xl font-black mb-6">
          Employee List
        </h1>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

          {employees.map((employee, index) => (

            <div
              key={index}
              className="rounded-[30px] border border-white/10 bg-white/5 p-6"
            >

              <div className="flex flex-col md:flex-row md:items-center gap-5">

                {/* PROFILE */}
                <div>

                  {employee.profile_photo ? (

                    <img
                      src={employee.profile_photo}
                      alt="Profile"
                      className="w-24 h-24 rounded-3xl object-cover border border-white/10"
                    />

                  ) : (

                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-4xl font-black">

                      {employee.full_name
                        ?.charAt(0)}

                    </div>

                  )}

                </div>

                {/* INFO */}
                <div className="flex-1">

                  <h1 className="text-3xl font-black">
                    {employee.full_name}
                  </h1>

                  <p className="text-white/40 mt-2">
                    {employee.employee_id}
                  </p>

                  <p className="text-white/40">
                    {employee.department}
                  </p>

                  <div className="flex flex-wrap gap-3 mt-4">

                    <div className="px-4 py-2 rounded-xl bg-orange-500/20 text-orange-300 text-sm font-bold">
                      {employee.role}
                    </div>

                    <div className={`px-4 py-2 rounded-xl text-sm font-bold ${
                      employee.status === "active"
                        ? "bg-green-500/20 text-green-300"
                        : "bg-red-500/20 text-red-300"
                    }`}>

                      {employee.status}

                    </div>

                  </div>

                </div>

                {/* ACTIONS */}
                <div className="flex flex-col gap-3">

                  <button
                    onClick={() =>
                      setEditEmployee(employee)
                    }
                    className="px-5 py-3 rounded-2xl bg-orange-500/20 text-orange-300 font-bold"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() =>
                      openPermissions(employee)
                    }
                    className="px-5 py-3 rounded-2xl bg-blue-500/20 text-blue-300 font-bold"
                  >
                    Permissions
                  </button>

                  <button
                    onClick={() =>
                      handleDelete(
                        employee.employee_id
                      )
                    }
                    className="px-5 py-3 rounded-2xl bg-red-500/20 text-red-300 font-bold"
                  >
                    Delete
                  </button>

                </div>

              </div>

            </div>

          ))}

        </div>

      </div>

      {/* EDIT EMPLOYEE POPUP */}
      {editEmployee && (

        <div className="fixed inset-0 bg-black/80 z-[999] flex items-center justify-center p-5 overflow-auto">

          <div className="w-full max-w-3xl rounded-[35px] border border-white/10 bg-[#0b0b0d] p-6 md:p-8">

            <div className="flex items-center justify-between mb-8">

              <div>

                <h1 className="text-4xl font-black">
                  Edit Employee
                </h1>

                <p className="text-white/40 mt-2">
                  Update employee information
                </p>

              </div>

              <button
                onClick={() =>
                  setEditEmployee(null)
                }
                className="w-14 h-14 rounded-2xl bg-red-500 text-2xl font-black"
              >
                ✕
              </button>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <input
                value={editEmployee.full_name || ""}
                onChange={(e) =>
                  setEditEmployee({
                    ...editEmployee,
                    full_name: e.target.value,
                  })
                }
                placeholder="Full Name"
                className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
              />

              <input
                value={editEmployee.phone || ""}
                onChange={(e) =>
                  setEditEmployee({
                    ...editEmployee,
                    phone: e.target.value,
                  })
                }
                placeholder="Phone"
                className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
              />

            </div>

            <button
              onClick={async () => {

                await supabase
                  .from("employees")
                  .update({
                    full_name:
                      editEmployee.full_name,
                    phone:
                      editEmployee.phone,
                  })
                  .eq(
                    "employee_id",
                    editEmployee.employee_id
                  );

                alert("Employee Updated");

                setEditEmployee(null);

                fetchEmployees();

              }}
              className="mt-8 w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 font-bold text-lg"
            >
              Save Changes
            </button>

          </div>

        </div>

      )}

      {/* PERMISSION POPUP */}
      {selectedEmployee && permissions && (

        <div className="fixed inset-0 bg-black/80 z-[999] flex items-center justify-center p-5">

          <div className="w-full max-w-3xl rounded-[35px] border border-white/10 bg-[#0b0b0d] p-6 md:p-8">

            <div className="flex items-center justify-between mb-8">

              <div>

                <h1 className="text-4xl font-black">

                  {selectedEmployee.full_name}

                </h1>

                <p className="text-white/40 mt-2">

                  Permission Control Panel

                </p>

              </div>

              <button
                onClick={() => {
                  setSelectedEmployee(null);
                  setPermissions(null);
                }}
                className="w-14 h-14 rounded-2xl bg-red-500 text-2xl font-black"
              >
                ✕
              </button>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {Object.keys(permissions)
                .filter(key =>
                  typeof permissions[key] === "boolean"
                )
                .map((key, index) => (

                  <div
                    key={index}
                    className="rounded-2xl border border-white/10 bg-white/5 p-5 flex items-center justify-between"
                  >

                    <h1 className="text-2xl font-bold capitalize">
                      {key}
                    </h1>

                    <button
                      onClick={() =>
                        togglePermission(
                          key,
                          permissions[key]
                        )
                      }
                      className={`px-5 py-3 rounded-2xl font-bold ${
                        permissions[key]
                          ? "bg-green-500/20 text-green-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >

                      {permissions[key]
                        ? "Enabled"
                        : "Disabled"}

                    </button>

                  </div>

                ))}

            </div>

          </div>

        </div>

      )}

    </div>

  );
}