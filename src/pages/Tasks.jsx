import { useEffect, useState } from "react";

import Topbar from "../components/Topbar";

import { supabase } from "../lib/supabase";

export default function Tasks() {

  const employeeId =
    localStorage.getItem("employee_id");

  const [employee, setEmployee] =
    useState(null);

  const [tasks, setTasks] =
    useState([]);

  const [employees, setEmployees] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  // FORM
  const [form, setForm] = useState({
    title: "",
    description: "",
    assigned_to: "",
    priority: "medium",
    deadline: "",
  });

  // FETCH EMPLOYEE
  const fetchEmployee = async () => {

    const { data } = await supabase
      .from("employees")
      .select("*")
      .eq("employee_id", employeeId)
      .single();

    setEmployee(data);

  };

  // FETCH EMPLOYEES
  const fetchEmployees = async () => {

    const { data } = await supabase
      .from("employees")
      .select("*");

    if (data) {

      setEmployees(data);

    }

  };

  // FETCH TASKS
  const fetchTasks = async () => {

    let query = supabase
      .from("tasks")
      .select("*")
      .order("id", { ascending: false });

    // WORKER ONLY SEES OWN TASKS
    if (
      employee?.role === "worker"
    ) {

      query = query.eq(
        "assigned_to",
        employeeId
      );

    }

    const { data } = await query;

    if (data) {

      setTasks(data);

    }

  };

  useEffect(() => {

    fetchEmployee();

    fetchEmployees();

  }, []);

  useEffect(() => {

    if (employee) {

      fetchTasks();

    }

  }, [employee]);

  // HANDLE CHANGE
  const handleChange = (e) => {

    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

  };

  // CREATE TASK
  const handleCreateTask = async () => {

    if (
      !form.title ||
      !form.assigned_to
    ) {

      alert("Fill required fields");

      return;

    }

    setLoading(true);

    await supabase
      .from("tasks")
      .insert([
        {
          ...form,
          status: "pending",
        },
      ]);

    setLoading(false);

    alert("Task Created");

    setForm({
      title: "",
      description: "",
      assigned_to: "",
      priority: "medium",
      deadline: "",
    });

    fetchTasks();

  };

  // UPDATE STATUS
  const updateStatus = async (
    taskId,
    status
  ) => {

    await supabase
      .from("tasks")
      .update({
        status,
      })
      .eq("id", taskId);

    fetchTasks();

  };

  return (

    <div>

      {/* TOPBAR */}
      <Topbar title="Tasks" />

      {/* ADMIN CREATE TASK */}
      {employee?.role !== "worker" && (

        <div className="mt-6 rounded-[35px] border border-white/10 bg-white/5 backdrop-blur-3xl p-6 md:p-8">

          <h1 className="text-3xl font-black mb-6">
            Create Task
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Task Title"
              className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
            />

            <input
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Task Description"
              className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
            />

            <select
              name="assigned_to"
              value={form.assigned_to}
              onChange={handleChange}
              className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
            >

              <option value="">
                Assign Employee
              </option>

              {employees.map((emp, index) => (

                <option
                  key={index}
                  value={emp.employee_id}
                >
                  {emp.full_name}
                </option>

              ))}

            </select>

            <select
              name="priority"
              value={form.priority}
              onChange={handleChange}
              className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
            >

              <option value="low">
                Low Priority
              </option>

              <option value="medium">
                Medium Priority
              </option>

              <option value="high">
                High Priority
              </option>

            </select>

            <input
              type="date"
              name="deadline"
              value={form.deadline}
              onChange={handleChange}
              className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
            />

          </div>

          <button
            onClick={handleCreateTask}
            disabled={loading}
            className="mt-6 px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 font-bold text-lg"
          >

            {loading
              ? "Creating..."
              : "Create Task"}

          </button>

        </div>

      )}

      {/* TASK LIST */}
      <div className="mt-6 rounded-[35px] border border-white/10 bg-white/5 backdrop-blur-3xl p-6 md:p-8">

        <h1 className="text-3xl font-black mb-6">
          Task Board
        </h1>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

          {tasks.map((task, index) => (

            <div
              key={index}
              className="rounded-[30px] border border-white/10 bg-white/5 p-6 relative overflow-hidden"
            >

              {/* GLOW */}
              <div className={`absolute top-[-80px] right-[-80px] w-[220px] h-[220px] blur-[140px] rounded-full ${
                task.priority === "high"
                  ? "bg-red-500/20"
                  : task.priority === "medium"
                  ? "bg-orange-500/20"
                  : "bg-green-500/20"
              }`}>
              </div>

              <div className="relative z-10">

                {/* TITLE */}
                <h1 className="text-3xl font-black">
                  {task.title}
                </h1>

                {/* DESCRIPTION */}
                <p className="mt-4 text-white/50 text-lg">
                  {task.description}
                </p>

                {/* INFO */}
                <div className="flex flex-wrap gap-3 mt-6">

                  <div className={`px-4 py-2 rounded-xl text-sm font-bold ${
                    task.priority === "high"
                      ? "bg-red-500/20 text-red-300"
                      : task.priority === "medium"
                      ? "bg-orange-500/20 text-orange-300"
                      : "bg-green-500/20 text-green-300"
                  }`}>

                    {task.priority}

                  </div>

                  <div className={`px-4 py-2 rounded-xl text-sm font-bold ${
                    task.status === "completed"
                      ? "bg-green-500/20 text-green-300"
                      : task.status === "in_progress"
                      ? "bg-blue-500/20 text-blue-300"
                      : "bg-orange-500/20 text-orange-300"
                  }`}>

                    {task.status}

                  </div>

                </div>

                {/* DETAILS */}
                <div className="mt-6 space-y-2 text-white/50">

                  <p>
                    Assigned To:
                    {" "}
                    {task.assigned_to}
                  </p>

                  <p>
                    Deadline:
                    {" "}
                    {task.deadline || "--"}
                  </p>

                </div>

                {/* ACTIONS */}
                {employee?.role === "worker" && (

                  <div className="flex gap-3 mt-6">

                    <button
                      onClick={() =>
                        updateStatus(
                          task.id,
                          "in_progress"
                        )
                      }
                      className="px-5 py-3 rounded-2xl bg-blue-500/20 text-blue-300 font-bold"
                    >
                      Start
                    </button>

                    <button
                      onClick={() =>
                        updateStatus(
                          task.id,
                          "completed"
                        )
                      }
                      className="px-5 py-3 rounded-2xl bg-green-500/20 text-green-300 font-bold"
                    >
                      Complete
                    </button>

                  </div>

                )}

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>

  );
}