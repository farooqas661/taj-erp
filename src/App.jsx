import Stock from "./pages/Stock";
import Approvals from "./pages/Approvals";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { App as CapApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

import Sidebar from "./components/Sidebar";

import Dashboard from "./pages/Dashboard";
import WorkerDashboard from "./pages/WorkerDashboard";

import Employees from "./pages/Employees";

import Attendance from "./pages/Attendance";
import AdminAttendance from "./pages/AdminAttendance";

import Tasks from "./pages/Tasks";

import Salary from "./pages/Salary";
import Orders from "./pages/Orders";
import Reports from "./pages/Reports";
import Calls from "./pages/Calls";
import Settings from "./pages/Settings";

const Wallet = lazy(() => import("./pages/Wallet"));

import Login from "./pages/Login";

import {
  clearAppSession,
  EMPLOYEE_ID_KEY,
  getSessionToken,
  supabase,
} from "./lib/supabase";

export default function App() {

  const [active, setActive] =
    useState("dashboard");

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [permissions, setPermissions] =
    useState({});

  const [employee, setEmployee] =
    useState(null);

  const [sessionReady, setSessionReady] =
    useState(false);

  const [employeeId, setEmployeeId] =
    useState(
      localStorage.getItem(
        EMPLOYEE_ID_KEY
      ) || ""
    );

  const activeRef = useRef(active);
  const sidebarOpenRef = useRef(sidebarOpen);
  const employeeIdRef = useRef(employeeId);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    sidebarOpenRef.current = sidebarOpen;
  }, [sidebarOpen]);

  useEffect(() => {
    employeeIdRef.current = employeeId;
  }, [employeeId]);

  // Android hardware back: navigate in-app instead of closing the activity
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return undefined;
    }

    const listenerPromise = CapApp.addListener(
      "backButton",
      () => {
        if (sidebarOpenRef.current) {
          setSidebarOpen(false);
          return;
        }

        if (!employeeIdRef.current) {
          CapApp.exitApp();
          return;
        }

        if (activeRef.current !== "dashboard") {
          setActive("dashboard");
          return;
        }

        CapApp.exitApp();
      }
    );

    return () => {
      void listenerPromise.then((handle) => handle.remove());
    };
  }, []);

  // LOGIN
  const handleLogin = (id) => {

    localStorage.setItem(
      EMPLOYEE_ID_KEY,
      id
    );

    setSessionReady(false);
    setEmployeeId(id);

  };

  const clearSession = () => {
    clearAppSession();
    setEmployeeId("");
    setEmployee(null);
    setPermissions({});
    setSessionReady(false);
  };

  // FETCH EMPLOYEE
  const fetchEmployee = async () => {

    if (!employeeId) {
      setSessionReady(false);
      return;
    }

    if (!getSessionToken()) {
      clearSession();
      return;
    }

    const { data, error } =
      await supabase
        .from("employees")
        .select(
          "employee_id, full_name, role, approval_status, profile_photo, salary"
        )
        .eq(
          "employee_id",
          employeeId
        )
        .single();

    if (
      error ||
      !data ||
      data.approval_status !== "approved"
    ) {
      clearSession();
      return;
    }

    setEmployee(data);
    setSessionReady(true);

  };

  // FETCH PERMISSIONS
  const fetchPermissions = async () => {

    if (!employeeId || !getSessionToken()) return;

    const { data, error } =
      await supabase
        .from("employee_permissions")
        .select("*")
        .eq(
          "employee_id",
          employeeId
        )
        .single();

    if (error) {
      // No permissions row yet — stay logged in with empty access
      if (error.code === "PGRST116") {
        setPermissions({});
        return;
      }

      clearSession();
      return;
    }

    if (data) {
      setPermissions(data);
    }

  };

  useEffect(() => {

    if (!employeeId) {
      setSessionReady(false);
      return;
    }

    if (!getSessionToken()) {
      clearSession();
      return;
    }

    fetchEmployee();
    fetchPermissions();

  }, [employeeId]);

  // NOT LOGGED IN — require both employee id and session token
  if (!employeeId || !getSessionToken()) {

    return (
      <Login onLogin={handleLogin} />
    );

  }

  if (!sessionReady || !employee) {
    return (
      <div className="min-h-screen bg-[#050507] text-white flex items-center justify-center">
        <p className="text-white/50 text-lg">Loading session...</p>
      </div>
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
            employee={employee}
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

          {/* APPROVALS */}
{active === "approvals" &&
  permissions.employees && (
    <Approvals />
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
            (permissions.tasks ??
              permissions.attendance) && (
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

          {/* WALLET */}
          {active === "wallet" &&
            (permissions.wallet ||
              ["admin", "manager", "accountant"].includes(
                employee?.role?.trim().toLowerCase() || ""
              )) && (
              <Suspense fallback={null}>
                <Wallet />
              </Suspense>
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