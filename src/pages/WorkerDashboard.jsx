import { useEffect, useState } from "react";

import Topbar from "../components/Topbar";

import { supabase } from "../lib/supabase";

const formatSalary = (amount) => {
  const value = Number(amount) || 0;

  if (value >= 1000) {
    return "₹" + Math.round(value / 1000) + "K";
  }

  return "₹" + value;
};

const countPresentDays = (records, year, month) => {
  const seen = new Set();

  records.forEach((record) => {
    const date = new Date(
      record.check_in || record.created_at
    );

    if (
      date.getFullYear() === year &&
      date.getMonth() + 1 === month
    ) {
      seen.add(date.toDateString());
    }
  });

  return seen.size;
};

const isTodayTask = (task, today) => {
  if (task.status === "completed") return false;

  const todayStr = today.toISOString().slice(0, 10);

  if (task.deadline) {
    return String(task.deadline).slice(0, 10) === todayStr;
  }

  if (task.created_at) {
    return (
      new Date(task.created_at).toDateString() ===
      today.toDateString()
    );
  }

  return false;
};

const taskStatusLabel = (status) => {
  if (status === "completed") return "Completed";
  if (status === "in_progress") return "Active";
  return "Pending";
};

const taskStatusClass = (status) => {
  if (status === "completed") {
    return "bg-green-500/20 text-green-300";
  }

  if (status === "in_progress") {
    return "bg-green-500/20 text-green-300";
  }

  return "bg-orange-500/20 text-orange-300";
};

const defaultCards = [
  {
    title: "Attendance",
    value: "0 Days",
    icon: "🕒",
    color: "from-green-500 to-green-700",
  },
  {
    title: "Shift",
    value: "--",
    icon: "🏭",
    color: "from-orange-500 to-red-600",
  },
  {
    title: "Tasks",
    value: "0",
    icon: "📋",
    color: "from-blue-500 to-cyan-600",
  },
  {
    title: "Salary",
    value: "₹0",
    icon: "💰",
    color: "from-pink-500 to-red-600",
  },
];

export default function WorkerDashboard() {
  const employeeId =
    localStorage.getItem("employee_id");

  const [cards, setCards] = useState(defaultCards);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (!employeeId) return;

    let cancelled = false;

    const loadDashboard = async () => {
      const current = new Date();
      const month = current.getMonth() + 1;
      const year = current.getFullYear();

      const [
        employeeRes,
        attendanceRes,
        tasksRes,
        settingsRes,
      ] = await Promise.all([
        supabase
          .from("employees")
          .select("salary")
          .eq("employee_id", employeeId)
          .maybeSingle(),
        supabase
          .from("attendance")
          .select("check_in, created_at")
          .eq("employee_id", employeeId),
        supabase
          .from("tasks")
          .select(
            "id, title, description, deadline, status, created_at"
          )
          .eq("assigned_to", employeeId)
          .order("id", { ascending: false }),
        supabase
          .from("app_settings")
          .select("shift_start, shift_end")
          .limit(1)
          .maybeSingle(),
      ]);

      if (cancelled) return;

      const employee = employeeRes.data;
      const attendance = attendanceRes.data || [];
      const workerTasks = tasksRes.data || [];
      const settings = settingsRes.data;

      const presentDays = countPresentDays(
        attendance,
        year,
        month
      );

      const todayTasks = workerTasks.filter((task) =>
        isTodayTask(task, current)
      );

      const openTasks = workerTasks.filter(
        (task) => task.status !== "completed"
      );

      const shiftStart =
        settings?.shift_start?.slice(0, 5) || "08:00";
      const shiftEnd =
        settings?.shift_end?.slice(0, 5) || "17:00";

      setCards([
        {
          title: "Attendance",
          value: presentDays + " Days",
          icon: "🕒",
          color: "from-green-500 to-green-700",
        },
        {
          title: "Shift",
          value: shiftStart + " - " + shiftEnd,
          icon: "🏭",
          color: "from-orange-500 to-red-600",
        },
        {
          title: "Tasks",
          value: String(openTasks.length),
          icon: "📋",
          color: "from-blue-500 to-cyan-600",
        },
        {
          title: "Salary",
          value: formatSalary(employee?.salary),
          icon: "💰",
          color: "from-pink-500 to-red-600",
        },
      ]);

      setTasks(todayTasks.slice(0, 5));
    };

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  return (

    <div>

      {/* TOPBAR */}
      <Topbar title="Worker Dashboard" />

      {/* WELCOME */}
      <div className="mt-6 rounded-[35px] border border-white/10 bg-white/5 backdrop-blur-3xl p-6 md:p-8 relative overflow-hidden">

        <div className="absolute top-0 right-0 w-[250px] h-[250px] bg-orange-500/20 blur-[140px] rounded-full"></div>

        <div className="relative z-10">

          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-white via-orange-100 to-orange-300 bg-clip-text text-transparent">
            Welcome Worker 👋
          </h1>

          <p className="mt-4 text-white/50 text-base md:text-lg">
            Manage your attendance, shifts and tasks
          </p>

        </div>

      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mt-6">

        {cards.map((card, index) => (

          <div
            key={index}
            className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/5 backdrop-blur-3xl p-5 hover:scale-[1.02] transition-all duration-300"
          >

            {/* Glow */}
            <div className={`absolute top-[-60px] right-[-60px] w-[180px] h-[180px] rounded-full bg-gradient-to-r ${card.color} opacity-20 blur-[120px]`}></div>

            <div className="relative z-10">

              {/* Icon */}
              <div className={`w-16 h-16 rounded-[22px] bg-gradient-to-br ${card.color} flex items-center justify-center text-3xl shadow-2xl`}>

                {card.icon}

              </div>

              {/* Title */}
              <p className="mt-6 text-white/50 text-base">
                {card.title}
              </p>

              {/* Value */}
              <h1 className="mt-2 text-4xl font-black">
                {card.value}
              </h1>

            </div>

          </div>

        ))}

      </div>

      {/* TASK PANEL */}
      <div className="mt-6 rounded-[35px] border border-white/10 bg-white/5 backdrop-blur-3xl p-6 md:p-8">

        <h1 className="text-3xl font-black mb-6">
          Today Tasks
        </h1>

        <div className="space-y-4">

          {tasks.length === 0 && (
            <p className="text-white/40 text-center py-6">
              No tasks scheduled for today
            </p>
          )}

          {tasks.map((task) => (

            <div
              key={task.id}
              className="rounded-2xl bg-white/5 border border-white/10 p-5 flex items-center justify-between"
            >

              <div>

                <h1 className="font-bold text-lg">
                  {task.title}
                </h1>

                <p className="text-white/40 text-sm mt-1">
                  {task.deadline || task.description || "--"}
                </p>

              </div>

              <div
                className={`px-4 py-2 rounded-xl text-sm font-bold ${taskStatusClass(
                  task.status
                )}`}
              >
                {taskStatusLabel(task.status)}
              </div>

            </div>

          ))}

        </div>

      </div>

    </div>

  );
}
