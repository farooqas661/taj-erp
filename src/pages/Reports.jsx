import { useEffect, useState } from "react";

import Topbar from "../components/Topbar";

import { supabase } from "../lib/supabase";

const formatCurrency = (amount) => {
  const value = Number(amount) || 0;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
};

const monthName = (month) =>
  new Date(2000, month - 1, 1).toLocaleString(
    "en-IN",
    { month: "long" }
  );

const daysInMonth = (year, month) =>
  new Date(year, month, 0).getDate();

const getRecordDate = (item) =>
  new Date(item.check_in || item.created_at);

const matchesPeriod = (
  date,
  year,
  month,
  day
) => {
  if (
    date.getFullYear() !== year ||
    date.getMonth() + 1 !== month
  ) {
    return false;
  }

  if (day === 0) return true;

  return date.getDate() === day;
};

const formatPeriodLabel = (year, month, day) => {
  if (day === 0) {
    return `${monthName(month)} ${year}`;
  }

  return `${day} ${monthName(month)} ${year}`;
};

export default function Reports() {
  const now = new Date();

  const [month, setMonth] = useState(
    now.getMonth() + 1
  );
  const [year, setYear] = useState(
    now.getFullYear()
  );
  const [day, setDay] = useState(0);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState({
    employees: 0,
    activeEmployees: 0,
    attendanceRecords: 0,
    uniquePresent: 0,
    tasksTotal: 0,
    tasksCompleted: 0,
    stockItems: 0,
    lowStock: 0,
    stockValue: 0,
    ordersTotal: 0,
    ordersDelivered: 0,
    orderRevenue: 0,
    salaryPaid: 0,
    salaryRecords: 0,
    ordersOnDay: 0,
  });
  const [topWorkers, setTopWorkers] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [dailyAttendance, setDailyAttendance] =
    useState([]);

  const periodLabel = formatPeriodLabel(
    year,
    month,
    day
  );

  const isDailyView = day > 0;

  useEffect(() => {
    if (day > daysInMonth(year, month)) {
      setDay(0);
    }
  }, [month, year, day]);

  useEffect(() => {
    let cancelled = false;

    const loadReports = async () => {
      setLoading(true);

      const [
        employeesRes,
        attendanceRes,
        tasksRes,
        stockRes,
        ordersRes,
        salaryRes,
      ] = await Promise.all([
        supabase.from("employees").select("*"),
        supabase.from("attendance").select("*"),
        supabase.from("tasks").select("*"),
        supabase.from("stock").select("*"),
        supabase.from("orders").select("*"),
        supabase
          .from("salary_payments")
          .select("*")
          .eq("month", month)
          .eq("year", year),
      ]);

      if (cancelled) return;

      const employees = employeesRes.data || [];
      const attendance = attendanceRes.data || [];
      const tasks = tasksRes.data || [];
      const stock = stockRes.data || [];
      const orders = ordersRes.data || [];
      const salaries = salaryRes.data || [];

      const periodAttendance = attendance.filter(
        (item) =>
          matchesPeriod(
            getRecordDate(item),
            year,
            month,
            day
          )
      );

      const presentByEmployee = {};

      periodAttendance.forEach((item) => {
        const dateKey = getRecordDate(
          item
        ).toDateString();

        if (!presentByEmployee[item.employee_id]) {
          presentByEmployee[item.employee_id] =
            {
              days: new Set(),
              records: [],
            };
        }

        presentByEmployee[
          item.employee_id
        ].days.add(dateKey);

        presentByEmployee[
          item.employee_id
        ].records.push(item);
      });

      const workerStats = Object.entries(
        presentByEmployee
      )
        .map(([empId, info]) => {
          const emp = employees.find(
            (e) => e.employee_id === empId
          );

          return {
            id: empId,
            name: emp?.full_name || empId,
            days: info.days.size,
          };
        })
        .sort((a, b) => b.days - a.days)
        .slice(0, 5);

      const dayList = Object.entries(
        presentByEmployee
      )
        .map(([empId, info]) => {
          const emp = employees.find(
            (e) => e.employee_id === empId
          );

          const latest = info.records.sort(
            (a, b) =>
              getRecordDate(b) - getRecordDate(a)
          )[0];

          return {
            id: empId,
            name: emp?.full_name || empId,
            checkIn: latest?.check_in
              ? new Date(
                  latest.check_in
                ).toLocaleTimeString("en-IN")
              : "--",
            checkOut: latest?.check_out
              ? new Date(
                  latest.check_out
                ).toLocaleTimeString("en-IN")
              : "Active",
          };
        })
        .sort((a, b) =>
          a.name.localeCompare(b.name)
        );

      const periodOrders = orders.filter((o) => {
        const date = new Date(
          o.created_at || o.delivery_date
        );

        return matchesPeriod(
          date,
          year,
          month,
          day
        );
      });

      const periodTasks = isDailyView
        ? tasks.filter((t) => {
            if (!t.deadline) return false;

            const date = new Date(t.deadline);

            return matchesPeriod(
              date,
              year,
              month,
              day
            );
          })
        : tasks;

      const lowItems = stock.filter(
        (item) =>
          Number(item.quantity) <=
          Number(item.minimum_stock || 10)
      );

      const deliveredOrders = periodOrders.filter(
        (o) => o.status === "delivered"
      );

      const summary = {
        employees: employees.length,
        activeEmployees: employees.filter(
          (e) => e.status === "active"
        ).length,
        attendanceRecords: periodAttendance.length,
        uniquePresent: Object.keys(
          presentByEmployee
        ).length,
        tasksTotal: periodTasks.length,
        tasksCompleted: periodTasks.filter(
          (t) => t.status === "completed"
        ).length,
        stockItems: stock.length,
        lowStock: lowItems.length,
        stockValue: stock.reduce(
          (sum, item) =>
            sum + Number(item.quantity || 0),
          0
        ),
        ordersTotal: isDailyView
          ? periodOrders.length
          : orders.length,
        ordersDelivered: deliveredOrders.length,
        orderRevenue: deliveredOrders.reduce(
          (sum, o) =>
            sum + Number(o.amount || 0),
          0
        ),
        ordersOnDay: periodOrders.length,
        salaryPaid: salaries.reduce(
          (sum, s) =>
            sum + Number(s.net_salary || 0),
          0
        ),
        salaryRecords: salaries.length,
      };

      setReport(summary);
      setTopWorkers(workerStats);
      setLowStockItems(lowItems.slice(0, 5));
      setDailyAttendance(dayList);
      setLoading(false);
    };

    void loadReports();

    return () => {
      cancelled = true;
    };
  }, [month, year, day, isDailyView]);

  const cards = [
    {
      title: "Active Employees",
      value: report.activeEmployees,
      sub: `${report.employees} total`,
      color: "text-orange-300",
    },
    {
      title: isDailyView
        ? "Present Today"
        : "Present This Month",
      value: report.uniquePresent,
      sub: `${report.attendanceRecords} check-ins`,
      color: "text-green-300",
    },
    {
      title: isDailyView
        ? "Tasks Due"
        : "Tasks Completed",
      value: isDailyView
        ? report.tasksTotal
        : report.tasksCompleted,
      sub: isDailyView
        ? `${report.tasksCompleted} completed`
        : `${report.tasksTotal} total tasks`,
      color: "text-blue-300",
    },
    {
      title: "Salary Paid",
      value: formatCurrency(report.salaryPaid),
      sub: `${report.salaryRecords} payments`,
      color: "text-pink-300",
    },
    {
      title: isDailyView
        ? "Orders Today"
        : "Orders Delivered",
      value: isDailyView
        ? report.ordersOnDay
        : report.ordersDelivered,
      sub: formatCurrency(report.orderRevenue),
      color: "text-purple-300",
    },
    {
      title: "Low Stock Items",
      value: report.lowStock,
      sub: `${report.stockItems} materials`,
      color: "text-red-300",
    },
  ];

  const totalDays = daysInMonth(year, month);

  return (
    <div>
      <Topbar title="Reports" />

      <div className="mt-6 rounded-[35px] border border-white/10 bg-white/5 backdrop-blur-3xl p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>
            <h1 className="text-3xl font-black">
              Factory Reports
            </h1>
            <p className="mt-2 text-white/50">
              {isDailyView
                ? "Daily factory report"
                : "Monthly factory report"}{" "}
              — {periodLabel}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={day}
              onChange={(e) =>
                setDay(Number(e.target.value))
              }
              className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
            >
              <option value={0}>
                All Days
              </option>
              {Array.from(
                { length: totalDays },
                (_, i) => i + 1
              ).map((d) => (
                <option key={d} value={d}>
                  Day {d}
                </option>
              ))}
            </select>

            <select
              value={month}
              onChange={(e) =>
                setMonth(Number(e.target.value))
              }
              className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {monthName(i + 1)}
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
      </div>

      {loading ? (
        <div className="mt-6 text-white/40">
          Loading reports...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mt-6">
            {cards.map((card) => (
              <div
                key={card.title}
                className="rounded-[30px] border border-white/10 bg-white/5 p-6"
              >
                <p className="text-white/50">
                  {card.title}
                </p>
                <h2
                  className={`text-3xl font-black mt-3 ${card.color}`}
                >
                  {card.value}
                </h2>
                <p className="text-white/40 mt-2 text-sm">
                  {card.sub}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-6">
            {isDailyView ? (
              <div className="rounded-[35px] border border-white/10 bg-white/5 p-6 md:p-8">
                <h2 className="text-2xl font-black mb-5">
                  Daily Attendance — {periodLabel}
                </h2>

                {dailyAttendance.length === 0 ? (
                  <p className="text-white/40">
                    No workers checked in on this
                    day.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {dailyAttendance.map(
                      (worker) => (
                        <div
                          key={worker.id}
                          className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4"
                        >
                          <div>
                            <p className="font-bold">
                              {worker.name}
                            </p>
                            <p className="text-white/40 text-sm">
                              {worker.id}
                            </p>
                          </div>
                          <div className="text-right text-sm">
                            <p className="text-green-300 font-bold">
                              IN: {worker.checkIn}
                            </p>
                            <p className="text-red-300 font-bold mt-1">
                              OUT:{" "}
                              {worker.checkOut}
                            </p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-[35px] border border-white/10 bg-white/5 p-6 md:p-8">
                <h2 className="text-2xl font-black mb-5">
                  Top Attendance — {periodLabel}
                </h2>

                {topWorkers.length === 0 ? (
                  <p className="text-white/40">
                    No attendance data for this
                    period.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {topWorkers.map((worker, i) => (
                      <div
                        key={worker.id}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4"
                      >
                        <div className="flex items-center gap-4">
                          <span className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center font-black">
                            {i + 1}
                          </span>
                          <div>
                            <p className="font-bold">
                              {worker.name}
                            </p>
                            <p className="text-white/40 text-sm">
                              {worker.id}
                            </p>
                          </div>
                        </div>
                        <span className="font-black text-green-300">
                          {worker.days} days
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="rounded-[35px] border border-white/10 bg-white/5 p-6 md:p-8">
              <h2 className="text-2xl font-black mb-5">
                Low Stock Alert
              </h2>

              {lowStockItems.length === 0 ? (
                <p className="text-white/40">
                  All stock levels are healthy.
                </p>
              ) : (
                <div className="space-y-3">
                  {lowStockItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-2xl border border-red-500/20 bg-red-500/10 p-4"
                    >
                      <div>
                        <p className="font-bold">
                          {item.item_name}
                        </p>
                        <p className="text-white/40 text-sm">
                          {item.category}
                        </p>
                      </div>
                      <span className="font-black text-red-300">
                        {item.quantity}{" "}
                        {item.unit}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-[35px] border border-white/10 bg-white/5 p-6 md:p-8">
            <h2 className="text-2xl font-black mb-5">
              Summary — {periodLabel}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white/70">
              <p>
                Workers present:{" "}
                <span className="text-white font-bold">
                  {report.uniquePresent}
                </span>
              </p>
              <p>
                Check-ins:{" "}
                <span className="text-white font-bold">
                  {report.attendanceRecords}
                </span>
              </p>
              <p>
                Total stock quantity:{" "}
                <span className="text-white font-bold">
                  {report.stockValue}
                </span>
              </p>
              <p>
                {isDailyView
                  ? "Orders on this day"
                  : "Total orders"}
                :{" "}
                <span className="text-white font-bold">
                  {report.ordersTotal}
                </span>
              </p>
              <p>
                Payroll disbursed (month):{" "}
                <span className="text-white font-bold">
                  {formatCurrency(
                    report.salaryPaid
                  )}
                </span>
              </p>
              <p>
                Order revenue (delivered):{" "}
                <span className="text-white font-bold">
                  {formatCurrency(
                    report.orderRevenue
                  )}
                </span>
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
