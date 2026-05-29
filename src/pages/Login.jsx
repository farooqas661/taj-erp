import { useState } from "react";
import Register from "./Register";
import { supabase } from "../lib/supabase";

export default function Login({ onLogin }) {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const handleLogin = async () => {
    if (!employeeId || !password) {
      alert("Enter Employee ID & Password");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("employee_id", employeeId)
      .eq("password", password)
      .single();

    setLoading(false);

    if (error || !data) {
      alert("Invalid Employee ID or Password");
      return;
    }

    if (data.approval_status !== "approved") {
      alert("Account waiting for admin approval");
      return;
    }

    onLogin(employeeId);
  };

  if (showRegister) {
    return <Register />;
  }

  return (
    <div className="min-h-screen bg-[#050507] text-white overflow-hidden relative flex items-center justify-center p-4">
      {/* BACKGROUND */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-orange-500/20 blur-[140px] rounded-full"></div>
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-red-600/20 blur-[140px] rounded-full"></div>
      </div>

      {/* LOGIN CARD */}
      <div className="relative z-10 w-full max-w-md rounded-[40px] border border-white/10 bg-white/5 backdrop-blur-3xl p-6 md:p-8 overflow-hidden shadow-2xl">
        {/* Glow */}
        <div className="absolute top-[-100px] right-[-100px] w-[250px] h-[250px] bg-orange-500/20 blur-[140px] rounded-full"></div>

        <div className="relative z-10">
          {/* LOGO */}
          <div className="flex flex-col items-center">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#0f3d1e] to-[#14532d] flex items-center justify-center text-5xl font-black shadow-2xl border border-white/10">
              TAJ
            </div>

            <h1 className="mt-6 text-4xl md:text-5xl font-black bg-gradient-to-r from-orange-300 to-yellow-200 bg-clip-text text-transparent">
              TAJ ERP
            </h1>

            <p className="mt-3 text-white/40 text-center">
              Smart Factory Management System
            </p>
          </div>

          {/* FORM */}
          <div className="mt-10 space-y-5">
            <input
              type="text"
              placeholder="Employee ID"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none text-base"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none text-base"
            />

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 font-bold text-lg hover:scale-[1.02] transition-all"
            >
              {loading ? "Checking..." : "Login"}
            </button>

            <button
              onClick={() => setShowRegister(true)}
              className="w-full py-4 rounded-2xl border border-white/10 bg-white/5 font-bold"
            >
              New Employee? Register Here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}