import { useEffect, useState } from "react";

import Topbar from "../components/Topbar";

import { supabase } from "../lib/supabase";

const STATUSES = [
  "open",
  "follow_up",
  "closed",
];

const STATUS_LABELS = {
  open: "Open",
  follow_up: "Follow Up",
  closed: "Resolved",
};

const STATUS_COLORS = {
  open: "bg-orange-500/20 text-orange-300",
  follow_up: "bg-blue-500/20 text-blue-300",
  closed: "bg-green-500/20 text-green-300",
};

const TOPICS = [
  "production",
  "stock",
  "delivery",
  "shift",
  "maintenance",
  "attendance",
  "general",
];

const CALL_TYPES = [
  { value: "phone", label: "Factory Phone" },
  { value: "walkie", label: "Walkie / Intercom" },
  { value: "in_person", label: "In Person" },
];

export default function Calls() {
  const employeeId =
    localStorage.getItem("employee_id");

  const [employees, setEmployees] = useState([]);
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const [form, setForm] = useState({
    called_to: "",
    topic: "general",
    call_type: "phone",
    purpose: "",
    status: "open",
    follow_up_date: "",
    notes: "",
  });

  const fetchEmployees = async () => {
    const { data } = await supabase
      .from("employees")
      .select("*")
      .eq("status", "active")
      .order("full_name", { ascending: true });

    if (data) {
      setEmployees(data);
    }
  };

  const fetchCalls = async () => {
    const { data, error: fetchError } =
      await supabase
        .from("calls")
        .select("*")
        .order("id", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setCalls([]);
    } else {
      setError("");
      setCalls(data || []);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      await Promise.all([
        fetchEmployees(),
        fetchCalls(),
      ]);
      if (!cancelled) setLoading(false);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const getEmployeeName = (empId) => {
    if (!empId) return "Unknown";

    const match = employees.find(
      (emp) => emp.employee_id === empId
    );

    return match?.full_name || empId;
  };

  const getContactedId = (call) =>
    call.called_to ||
    call.customer_name ||
    "";

  const getTopic = (call) =>
    call.topic || call.call_type || "general";

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const filteredCalls =
    statusFilter === "all"
      ? calls
      : calls.filter(
          (call) => call.status === statusFilter
        );

  const openCount = calls.filter(
    (c) => c.status === "open"
  ).length;

  const followUpCount = calls.filter(
    (c) => c.status === "follow_up"
  ).length;

  const resolvedCount = calls.filter(
    (c) => c.status === "closed"
  ).length;

  const createCall = async () => {
    if (!form.called_to || !form.purpose) {
      alert(
        "Select staff member and enter subject"
      );
      return;
    }

    setSaving(true);

    const contacted = employees.find(
      (emp) =>
        emp.employee_id === form.called_to
    );

    const { error: insertError } = await supabase
      .from("calls")
      .insert([
        {
          called_by: employeeId,
          called_to: form.called_to,
          topic: form.topic,
          call_type: form.call_type,
          purpose: form.purpose,
          status: form.status,
          follow_up_date:
            form.follow_up_date || null,
          notes: form.notes,
          customer_name:
            contacted?.full_name || form.called_to,
          customer_phone:
            contacted?.phone || "",
        },
      ]);

    setSaving(false);

    if (insertError) {
      alert(insertError.message);
      return;
    }

    setForm({
      called_to: "",
      topic: "general",
      call_type: "phone",
      purpose: "",
      status: "open",
      follow_up_date: "",
      notes: "",
    });

    setShowForm(false);
    await fetchCalls();
  };

  const updateStatus = async (call, status) => {
    const { error: updateError } = await supabase
      .from("calls")
      .update({ status })
      .eq("id", call.id);

    if (updateError) {
      alert(updateError.message);
      return;
    }

    await fetchCalls();
  };

  const deleteCall = async (call) => {
    const confirmed = confirm(
      "Delete this internal call log?"
    );

    if (!confirmed) return;

    const { error: deleteError } = await supabase
      .from("calls")
      .delete()
      .eq("id", call.id);

    if (deleteError) {
      alert(deleteError.message);
      return;
    }

    await fetchCalls();
  };

  return (
    <div>
      <Topbar title="Internal Calls" />

      <div className="mt-6 rounded-[35px] border border-white/10 bg-white/5 backdrop-blur-3xl p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <h1 className="text-3xl font-black">
              Factory Staff Communication
            </h1>
            <p className="mt-2 text-white/50">
              Log calls and messages between factory
              team members only
            </p>
          </div>

          <button
            onClick={() =>
              setShowForm(!showForm)
            }
            className="px-6 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 font-bold"
          >
            {showForm
              ? "Close Form"
              : "+ Log Communication"}
          </button>
        </div>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
        <div className="rounded-[30px] border border-white/10 bg-white/5 p-5">
          <p className="text-white/50">Open</p>
          <h2 className="text-3xl font-black mt-2 text-orange-300">
            {openCount}
          </h2>
        </div>
        <div className="rounded-[30px] border border-white/10 bg-white/5 p-5">
          <p className="text-white/50">
            Follow Up
          </p>
          <h2 className="text-3xl font-black mt-2 text-blue-300">
            {followUpCount}
          </h2>
        </div>
        <div className="rounded-[30px] border border-white/10 bg-white/5 p-5">
          <p className="text-white/50">
            Resolved
          </p>
          <h2 className="text-3xl font-black mt-2 text-green-300">
            {resolvedCount}
          </h2>
        </div>
      </div>

      {showForm && (
        <div className="mt-6 rounded-[35px] border border-white/10 bg-white/5 backdrop-blur-3xl p-6 md:p-8">
          <h2 className="text-2xl font-black mb-6">
            Log Staff Communication
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <select
              name="called_to"
              value={form.called_to}
              onChange={handleChange}
              className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
            >
              <option value="">
                Contacted Staff Member *
              </option>

              {employees
                .filter(
                  (emp) =>
                    emp.employee_id !==
                    employeeId
                )
                .map((emp) => (
                  <option
                    key={emp.employee_id}
                    value={emp.employee_id}
                  >
                    {emp.full_name} —{" "}
                    {emp.role}
                  </option>
                ))}
            </select>

            <select
              name="call_type"
              value={form.call_type}
              onChange={handleChange}
              className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
            >
              {CALL_TYPES.map((type) => (
                <option
                  key={type.value}
                  value={type.value}
                >
                  {type.label}
                </option>
              ))}
            </select>

            <select
              name="topic"
              value={form.topic}
              onChange={handleChange}
              className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
            >
              {TOPICS.map((topic) => (
                <option
                  key={topic}
                  value={topic}
                >
                  {topic.charAt(0).toUpperCase() +
                    topic.slice(1)}
                </option>
              ))}
            </select>

            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
            >
              {STATUSES.map((status) => (
                <option
                  key={status}
                  value={status}
                >
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>

            <input
              name="purpose"
              value={form.purpose}
              onChange={handleChange}
              placeholder="Subject (e.g. shift handover, stock issue) *"
              className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none md:col-span-2"
            />

            <input
              type="date"
              name="follow_up_date"
              value={form.follow_up_date}
              onChange={handleChange}
              className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
            />

            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Details discussed..."
              className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none md:col-span-2 min-h-[90px]"
            />
          </div>

          <button
            onClick={createCall}
            disabled={saving}
            className="mt-6 px-8 py-4 rounded-2xl bg-gradient-to-r from-green-500 to-green-700 font-bold"
          >
            {saving ? "Saving..." : "Save Log"}
          </button>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        {["all", ...STATUSES].map((status) => (
          <button
            key={status}
            onClick={() =>
              setStatusFilter(status)
            }
            className={`px-5 py-3 rounded-2xl font-bold capitalize ${
              statusFilter === status
                ? "bg-gradient-to-r from-orange-500 to-red-600"
                : "bg-white/5 border border-white/10"
            }`}
          >
            {status === "all"
              ? "All"
              : STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-[35px] border border-white/10 bg-white/5 backdrop-blur-3xl p-6 md:p-8">
        <h2 className="text-2xl font-black mb-6">
          Communication Log
        </h2>

        {loading ? (
          <p className="text-white/40">
            Loading...
          </p>
        ) : filteredCalls.length === 0 ? (
          <p className="text-white/40">
            No internal communications logged yet.
          </p>
        ) : (
          <div className="space-y-4">
            {filteredCalls.map((call) => (
              <div
                key={call.id}
                className="rounded-[30px] border border-white/10 bg-white/5 p-5 md:p-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-black">
                        {call.purpose}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-xl text-sm font-bold ${
                          STATUS_COLORS[
                            call.status
                          ] || "bg-white/10"
                        }`}
                      >
                        {STATUS_LABELS[
                          call.status
                        ] || call.status}
                      </span>
                      <span className="px-3 py-1 rounded-xl text-sm font-bold bg-white/10 capitalize">
                        {getTopic(call)}
                      </span>
                    </div>

                    <p className="text-white/60 mt-3">
                      <span className="text-orange-300 font-bold">
                        {getEmployeeName(
                          call.called_by
                        )}
                      </span>
                      {" → "}
                      <span className="text-green-300 font-bold">
                        {getEmployeeName(
                          getContactedId(call)
                        )}
                      </span>
                    </p>

                    <p className="text-white/40 mt-2 text-sm capitalize">
                      Via{" "}
                      {call.call_type?.replace(
                        "_",
                        " "
                      ) || "phone"}
                    </p>

                    {call.notes && (
                      <p className="text-white/50 mt-3 text-sm">
                        {call.notes}
                      </p>
                    )}

                    {call.follow_up_date && (
                      <p className="text-blue-300 mt-2 text-sm font-bold">
                        Follow up:{" "}
                        {new Date(
                          call.follow_up_date
                        ).toLocaleDateString(
                          "en-IN"
                        )}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {call.status !==
                      "follow_up" && (
                      <button
                        onClick={() =>
                          updateStatus(
                            call,
                            "follow_up"
                          )
                        }
                        className="px-4 py-2 rounded-xl bg-blue-500/20 text-blue-300 font-bold"
                      >
                        Follow Up
                      </button>
                    )}

                    {call.status !== "closed" && (
                      <button
                        onClick={() =>
                          updateStatus(
                            call,
                            "closed"
                          )
                        }
                        className="px-4 py-2 rounded-xl bg-green-500/20 text-green-300 font-bold"
                      >
                        Resolve
                      </button>
                    )}

                    {call.status === "closed" && (
                      <button
                        onClick={() =>
                          updateStatus(
                            call,
                            "open"
                          )
                        }
                        className="px-4 py-2 rounded-xl bg-orange-500/20 text-orange-300 font-bold"
                      >
                        Reopen
                      </button>
                    )}

                    <button
                      onClick={() =>
                        deleteCall(call)
                      }
                      className="px-4 py-2 rounded-xl bg-red-500/20 text-red-300 font-bold"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
