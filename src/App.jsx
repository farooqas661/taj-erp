import { useEffect, useState } from "react";

import Sidebar from "./components/Sidebar";

import Dashboard from "./pages/Dashboard";
import WorkerDashboard from "./pages/WorkerDashboard";

import Employees from "./pages/Employees";

import Attendance from "./pages/Attendance";
import AdminAttendance from "./pages/AdminAttendance";

import Tasks from "./pages/Tasks";

import Salary from "./pages/Salary";
import Stock from "./pages/Stock";
import Orders from "./pages/Orders";
import Reports from "./pages/Reports";
import Calls from "./pages/Calls";
import Settings from "./pages/Settings";

import Login from "./pages/Login";

import { supabase } from "./lib/supabase";

export default function App() {

  const [active, setActive] =
    useState("dashboard");

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [permissions, setPermissions] =
    useState({});

  const [employee, setEmployee] =
    useState(null);

  const [employeeId, setEmployeeId] =
    useState(
      localStorage.getItem(
        "employee_id"
      ) || ""
    );

  // LOGIN
  const handleLogin = (id) => {

    localStorage.setItem(
      "employee_id",
      id
    );

    setEmployeeId(id);

  };

  // FETCH EMPLOYEE
  const fetchEmployee = async () => {

    if (!employeeId) return;

    const { data, error } =
      await supabase
        .from("employees")
        .select("*")
        .eq(
          "employee_id",
          employeeId
        )
        .single();

    if (!error && data) {

      setEmployee(data);

    }

  };

  // FETCH PERMISSIONS
  const fetchPermissions = async () => {

    if (!employeeId) return;

    const { data, error } =
      await supabase
        .from("employee_permissions")
        .select("*")
        .eq(
          "employee_id",
          employeeId
        )
        .single();

    if (!error && data) {

      setPermissions(data);

    }

  };

  useEffect(() => {

    fetchEmployee();

    fetchPermissions();

  }, [employeeId]);

  // NOT LOGGED IN
  if (!employeeId) {

    return (
      <Login onLogin={handleLogin} />
    );

  }

  return (

    <div className="min-h-screen bg-[#050507] text-white relative overflow-x-hidden">

      {/* BACKGROUND */}
      <div className="absolute inset-0 overflow-hidden">

        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-orange-500/20 blur-[140px] rounded-full"></div>

        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-red-600/20 blur-[140px] rounded-full"></div>

      </div>

      <div className="relative z-10 flex min-h-screen">

        {/* MOBILE OVERLAY */}
        {sidebarOpen && (

          <div
            className="fixed inset-0 bg-black/70 z-40 lg:hidden"
            onClick={() =>
              setSidebarOpen(false)
            }
          ></div>

        )}

        {/* SIDEBAR */}
        <div className={`
          fixed lg:relative z-50 lg:z-10
          h-full lg:h-auto
          transition-all duration-300
          ${sidebarOpen
            ? "left-0"
            : "-left-full"}
          lg:left-0
        `}>

          <Sidebar
            active={active}
            setActive={(value) => {

              setActive(value);

              setSidebarOpen(false);

            }}
            permissions={permissions}
          />

        </div>

        {/* MAIN */}
        <div className="flex-1 p-3 md:p-5 overflow-y-auto w-full">

          {/* MOBILE TOPBAR */}
          <div className="lg:hidden flex items-center justify-between mb-5 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">

            <button
              onClick={() =>
                setSidebarOpen(true)
              }
              className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center text-2xl"
            >
              ☰
            </button>

            <h1 className="text-2xl font-black bg-gradient-to-r from-orange-300 to-yellow-200 bg-clip-text text-transparent">

              TAJ ERP

            </h1>

          </div>

          {/* DASHBOARD */}
          {active === "dashboard" && (

            employee?.role
              ?.trim()
              .toLowerCase() === "worker"

              ? <WorkerDashboard />

              : <Dashboard />

          )}

          {/* EMPLOYEES */}
          {active === "employees" &&
            permissions.employees && (
              <Employees />
          )}

          {/* ATTENDANCE */}
          {active === "attendance" &&
            permissions.attendance && (

              employee?.role
                ?.trim()
                .toLowerCase() === "worker"

                ? <Attendance />

                : <AdminAttendance />

          )}

          {/* TASKS */}
          {active === "tasks" &&
            permissions.attendance && (
              <Tasks />
          )}

          {/* SALARY */}
          {active === "salary" &&
            permissions.salary && (
              <Salary />
          )}

          {/* STOCK */}
          {active === "stock" &&
            permissions.stock && (
              <Stock />
          )}

          {/* ORDERS */}
          {active === "orders" &&
            permissions.orders && (
              <Orders />
          )}

          {/* REPORTS */}
          {active === "reports" &&
            permissions.reports && (
              <Reports />
          )}

          {/* SETTINGS */}
          {active === "settings" &&
            permissions.settings && (
              <Settings />
          )}

          {/* CALLS */}
          {active === "calls" &&
            permissions.calls && (
              <Calls />
          )}

        </div>

      </div>

    </div>

  );
}