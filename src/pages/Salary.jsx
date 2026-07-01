import { useEffect, useState } from "react";

import Topbar from "../components/Topbar";

import { supabase } from "../lib/supabase";

const WORKING_DAYS = 26;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const formatCurrency = (amount) => {
  const value = Number(amount) || 0;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
};

const countPresentDays = (
  records,
  employeeId,
  year,
  month
) => {
  const seen = new Set();

  records.forEach((record) => {
    if (record.employee_id !== employeeId) return;

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

const calculateNetSalary = (
  baseSalary,
  presentDays,
  deductions = 0,
  bonus = 0
) => {
  const daily =
    Number(baseSalary || 0) / WORKING_DAYS;

  const earned = daily * presentDays;

  return Math.max(
    0,
    earned - Number(deductions || 0) + Number(bonus || 0)
  );
};

export default function Salary() {
  const employeeId =
    localStorage.getItem("employee_id");

  const now = new Date();

  const [employee, setEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [payments, setPayments] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentsError, setPaymentsError] = useState("");

  const [month, setMonth] = useState(
    now.getMonth() + 1
  );
  const [year, setYear] = useState(
    now.getFullYear()
  );

  const [selectedPayroll, setSelectedPayroll] =
    useState(null);

  const [payForm, setPayForm] = useState({
    deductions: "0",
    bonus: "0",
    notes: "",
  });

  const isWorker =
    employee?.role
      ?.trim()
      .toLowerCase() === "worker";

  const fetchEmployee = async () => {
    const { data } = await supabase
      .from("employees")
      .select("*")
      .eq("employee_id", employeeId)
      .single();

    setEmployee(data);
  };

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

  const fetchAttendance = async () => {
    const { data } = await supabase
      .from("attendance")
      .select("*");

    if (data) {
      setAttendance(data);
    }
  };

  const fetchPayments = async () => {
    const { data, error } = await supabase
      .from("salary_payments")
      .select("*")
      .eq("month", month)
      .eq("year", year)
      .order("id", { ascending: false });

    if (error) {
      setPaymentsError(error.message);
      setPayments([]);
      return;
    }

    setPaymentsError("");
    setPayments(data || []);
  };

  const fetchPaymentHistory = async () => {
    const { data, error } = await supabase
      .from("salary_payments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      setPaymentsError(error.message);
      setPaymentHistory([]);
      return;
    }

    setPaymentsError("");
    setPaymentHistory(data || []);
  };

  const loadData = async () => {
    setLoading(true);

    await Promise.all([
      fetchEmployee(),
      fetchEmployees(),
      fetchAttendance(),
      fetchPayments(),
      fetchPaymentHistory(),
    ]);

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [month, year]);

  const getPaymentFor = (empId) =>
    payments.find(
      (payment) =>
        payment.employee_id === empId
    );

  const buildPayrollRow = (emp) => {
    const presentDays = countPresentDays(
      attendance,
      emp.employee_id,
      year,
      month
    );

    const baseSalary = Number(emp.salary || 0);
    const payment = getPaymentFor(emp.employee_id);

    const deductions = payment
      ? Number(payment.deductions || 0)
      : 0;

    const bonus = payment
      ? Number(payment.bonus || 0)
      : 0;

    const netSalary = payment
      ? Number(payment.net_salary || 0)
      : calculateNetSalary(
          baseSalary,
          presentDays,
          deductions,
          bonus
        );

    return {
      ...emp,
      presentDays,
      baseSalary,
      deductions,
      bonus,
      netSalary,
      payment,
      status: payment?.status || "pending",
    };
  };

  const visibleEmployees = isWorker
    ? employees.filter(
        (emp) =>
          emp.employee_id === employeeId
      ).length > 0
      ? employees.filter(
          (emp) =>
            emp.employee_id === employeeId
        )
      : employee
        ? [employee]
        : []
    : employees;

  const payrollRows = visibleEmployees.map(
    buildPayrollRow
  );

  const totalPayroll = payrollRows.reduce(
    (sum, row) => sum + row.netSalary,
    0
  );

  const paidCount = payrollRows.filter(
    (row) => row.status === "paid"
  ).length;

  const pendingCount =
    payrollRows.length - paidCount;

  const openPaymentModal = (row) => {
    setSelectedPayroll(row);
    setPayForm({
      deductions: String(row.deductions || 0),
      bonus: String(row.bonus || 0),
      notes: row.payment?.notes || "",
    });
  };

  const processPayment = async () => {
    if (!selectedPayroll) return;

    if (paymentsError) {
      alert(paymentsError);
      return;
    }

    setProcessing(true);

    const netSalary = calculateNetSalary(
      selectedPayroll.baseSalary,
      selectedPayroll.presentDays,
      payForm.deductions,
      payForm.bonus
    );

    const payload = {
      employee_id:
        selectedPayroll.employee_id,
      month,
      year,
      base_salary: selectedPayroll.baseSalary,
      present_days: selectedPayroll.presentDays,
      deductions: Number(payForm.deductions || 0),
      bonus: Number(payForm.bonus || 0),
      net_salary: netSalary,
      status: "paid",
      notes: payForm.notes,
    };

    let error;

    if (selectedPayroll.payment?.id) {
      ({ error } = await supabase
        .from("salary_payments")
        .update(payload)
        .eq("id", selectedPayroll.payment.id));
    } else {
      ({ error } = await supabase
        .from("salary_payments")
        .insert([payload]));
    }

    setProcessing(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Salary processed successfully");

    setSelectedPayroll(null);
    await Promise.all([
      fetchPayments(),
      fetchPaymentHistory(),
    ]);
  };

  const getEmployeeName = (empId) => {
    const match = employees.find(
      (emp) => emp.employee_id === empId
    );

    return match?.full_name || empId;
  };

  const historyRows = (
    isWorker
      ? paymentHistory.filter(
          (payment) =>
            payment.employee_id === employeeId
        )
      : paymentHistory
  ).slice(0, 12);

  const workerRow = payrollRows[0];

  return (
    <div>
      <Topbar title="Salary" />

      {/* FILTERS */}
      <div className="mt-6 rounded-[35px] border border-white/10 bg-white/5 backdrop-blur-3xl p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>
            <h1 className="text-3xl font-black">
              {isWorker
                ? "My Salary"
                : "Payroll Management"}
            </h1>
            <p className="mt-2 text-white/50">
              Monthly salary based on attendance (
              {WORKING_DAYS} working days)
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={month}
              onChange={(e) =>
                setMonth(Number(e.target.value))
              }
              className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
            >
              {MONTHS.map((label, index) => (
                <option
                  key={label}
                  value={index + 1}
                >
                  {label}
                </option>
              ))}
            </select>

            <select
              value={year}
              onChange={(e) =>
                setYear(Number(e.target.value))
              }
              className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
            >
              {[year - 1, year, year + 1].map(
                (y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {paymentsError && (
          <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            Could not load salary payments: {paymentsError}
          </div>
        )}
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
        <div className="rounded-[35px] border border-white/10 bg-white/5 backdrop-blur-3xl p-6 relative overflow-hidden">
          <div className="absolute top-[-60px] right-[-60px] w-[180px] h-[180px] bg-orange-500/20 blur-[120px] rounded-full"></div>
          <div className="relative z-10">
            <p className="text-white/50">
              {isWorker
                ? "Estimated Pay"
                : "Total Payroll"}
            </p>
            <h1 className="text-4xl font-black mt-4">
              {formatCurrency(
                isWorker
                  ? workerRow?.netSalary || 0
                  : totalPayroll
              )}
            </h1>
          </div>
        </div>

        <div className="rounded-[35px] border border-white/10 bg-white/5 backdrop-blur-3xl p-6 relative overflow-hidden">
          <div className="absolute top-[-60px] right-[-60px] w-[180px] h-[180px] bg-green-500/20 blur-[120px] rounded-full"></div>
          <div className="relative z-10">
            <p className="text-white/50">
              {isWorker
                ? "Present Days"
                : "Paid Employees"}
            </p>
            <h1 className="text-4xl font-black mt-4 text-green-400">
              {isWorker
                ? workerRow?.presentDays || 0
                : paidCount}
            </h1>
          </div>
        </div>

        <div className="rounded-[35px] border border-white/10 bg-white/5 backdrop-blur-3xl p-6 relative overflow-hidden">
          <div className="absolute top-[-60px] right-[-60px] w-[180px] h-[180px] bg-red-500/20 blur-[120px] rounded-full"></div>
          <div className="relative z-10">
            <p className="text-white/50">
              {isWorker
                ? "Base Salary"
                : "Pending Payments"}
            </p>
            <h1 className="text-4xl font-black mt-4 text-red-300">
              {isWorker
                ? formatCurrency(
                    workerRow?.baseSalary || 0
                  )
                : pendingCount}
            </h1>
          </div>
        </div>
      </div>

      {/* PAYROLL LIST */}
      <div className="mt-6 rounded-[35px] border border-white/10 bg-white/5 backdrop-blur-3xl p-6 md:p-8">
        <h1 className="text-3xl font-black mb-6">
          {isWorker
            ? "Salary Breakdown"
            : "Employee Payroll"}
        </h1>

        {loading ? (
          <div className="text-white/40">
            Loading payroll...
          </div>
        ) : payrollRows.length === 0 ? (
          <div className="text-white/40">
            No employees found for payroll.
          </div>
        ) : (
          <div className="space-y-4">
            {payrollRows.map((row) => (
              <div
                key={row.employee_id}
                className="rounded-[30px] border border-white/10 bg-white/5 p-5 md:p-6"
              >
                <div className="grid grid-cols-1 xl:grid-cols-6 gap-5 items-center">
                  <div className="xl:col-span-2">
                    <h2 className="text-2xl font-black">
                      {row.full_name}
                    </h2>
                    <p className="text-white/40 mt-1">
                      {row.employee_id}
                    </p>
                    <p className="text-white/40">
                      {row.department || row.role}
                    </p>
                  </div>

                  <div>
                    <p className="text-white/40 text-sm">
                      Base Salary
                    </p>
                    <p className="text-xl font-bold mt-1">
                      {formatCurrency(
                        row.baseSalary
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-white/40 text-sm">
                      Present Days
                    </p>
                    <p className="text-xl font-bold mt-1">
                      {row.presentDays} /{" "}
                      {WORKING_DAYS}
                    </p>
                  </div>

                  <div>
                    <p className="text-white/40 text-sm">
                      Net Salary
                    </p>
                    <p className="text-xl font-bold mt-1 text-green-300">
                      {formatCurrency(
                        row.netSalary
                      )}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div
                      className={`px-4 py-2 rounded-xl text-center font-bold ${
                        row.status === "paid"
                          ? "bg-green-500/20 text-green-300"
                          : "bg-orange-500/20 text-orange-300"
                      }`}
                    >
                      {row.status === "paid"
                        ? "Paid"
                        : "Pending"}
                    </div>

                    {!isWorker && (
                      <button
                        onClick={() =>
                          openPaymentModal(row)
                        }
                        className="px-4 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 font-bold"
                      >
                        {row.status === "paid"
                          ? "Update"
                          : "Process Pay"}
                      </button>
                    )}
                  </div>
                </div>

                {(row.deductions > 0 ||
                  row.bonus > 0 ||
                  row.payment?.notes) && (
                  <div className="mt-4 pt-4 border-t border-white/10 text-white/50 text-sm flex flex-wrap gap-4">
                    {row.deductions > 0 && (
                      <span>
                        Deductions:{" "}
                        {formatCurrency(
                          row.deductions
                        )}
                      </span>
                    )}
                    {row.bonus > 0 && (
                      <span>
                        Bonus:{" "}
                        {formatCurrency(row.bonus)}
                      </span>
                    )}
                    {row.payment?.notes && (
                      <span>
                        Notes: {row.payment.notes}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PAYMENT HISTORY */}
      <div className="mt-6 rounded-[35px] border border-white/10 bg-white/5 backdrop-blur-3xl p-6 md:p-8">
        <h1 className="text-3xl font-black mb-6">
          Payment History
        </h1>

        {historyRows.length === 0 ? (
          <div className="text-white/40">
            No salary payments recorded yet.
          </div>
        ) : (
          <div className="space-y-4">
            {historyRows.map((payment) => (
              <div
                key={payment.id}
                className="rounded-[30px] border border-white/10 bg-white/5 p-5 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div>
                  <h2 className="text-xl font-black">
                    {getEmployeeName(
                      payment.employee_id
                    )}
                  </h2>
                  <p className="text-white/40 mt-1">
                    {MONTHS[payment.month - 1]}{" "}
                    {payment.year} ·{" "}
                    {payment.employee_id}
                  </p>
                  {payment.notes && (
                    <p className="text-white/50 mt-2 text-sm">
                      {payment.notes}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="text-sm text-white/50">
                    {payment.present_days} days
                  </div>
                  <div className="text-2xl font-black text-green-300">
                    {formatCurrency(
                      payment.net_salary
                    )}
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-green-500/20 text-green-300 font-bold">
                    {payment.status || "paid"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PAYMENT MODAL */}
      {selectedPayroll && (
        <div className="fixed inset-0 bg-black/80 z-[999] flex items-center justify-center p-5 overflow-auto">
          <div className="w-full max-w-xl rounded-[35px] border border-white/10 bg-[#0b0b0d] p-6 md:p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-black">
                  Process Salary
                </h1>
                <p className="text-white/40 mt-2">
                  {selectedPayroll.full_name} ·{" "}
                  {MONTHS[month - 1]} {year}
                </p>
              </div>

              <button
                onClick={() =>
                  setSelectedPayroll(null)
                }
                className="w-14 h-14 rounded-2xl bg-red-500 text-2xl font-black"
              >
                ✕
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
              <div className="flex justify-between">
                <span className="text-white/50">
                  Base Salary
                </span>
                <span className="font-bold">
                  {formatCurrency(
                    selectedPayroll.baseSalary
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">
                  Present Days
                </span>
                <span className="font-bold">
                  {selectedPayroll.presentDays}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">
                  Daily Rate
                </span>
                <span className="font-bold">
                  {formatCurrency(
                    selectedPayroll.baseSalary /
                      WORKING_DAYS
                  )}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
              <input
                type="number"
                min="0"
                placeholder="Deductions"
                value={payForm.deductions}
                onChange={(e) =>
                  setPayForm({
                    ...payForm,
                    deductions: e.target.value,
                  })
                }
                className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
              />

              <input
                type="number"
                min="0"
                placeholder="Bonus"
                value={payForm.bonus}
                onChange={(e) =>
                  setPayForm({
                    ...payForm,
                    bonus: e.target.value,
                  })
                }
                className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
              />
            </div>

            <textarea
              placeholder="Notes (optional)"
              value={payForm.notes}
              onChange={(e) =>
                setPayForm({
                  ...payForm,
                  notes: e.target.value,
                })
              }
              className="mt-5 w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none min-h-[100px]"
            />

            <div className="mt-6 rounded-2xl border border-green-500/20 bg-green-500/10 p-5 flex items-center justify-between">
              <span className="text-green-200 font-bold">
                Net Payable
              </span>
              <span className="text-2xl font-black text-green-300">
                {formatCurrency(
                  calculateNetSalary(
                    selectedPayroll.baseSalary,
                    selectedPayroll.presentDays,
                    payForm.deductions,
                    payForm.bonus
                  )
                )}
              </span>
            </div>

            <button
              onClick={processPayment}
              disabled={processing}
              className="mt-6 w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 font-bold text-lg"
            >
              {processing
                ? "Processing..."
                : "Confirm Payment"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
