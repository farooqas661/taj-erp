import { useEffect, useState } from "react";

import Topbar from "../components/Topbar";

import { supabase } from "../lib/supabase";

const STATUSES = [
  "pending",
  "processing",
  "dispatched",
  "delivered",
  "cancelled",
];

const STATUS_LABELS = {
  pending: "Pending",
  processing: "Processing",
  dispatched: "Dispatched",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_COLORS = {
  pending: "bg-orange-500/20 text-orange-300",
  processing: "bg-blue-500/20 text-blue-300",
  dispatched: "bg-purple-500/20 text-purple-300",
  delivered: "bg-green-500/20 text-green-300",
  cancelled: "bg-red-500/20 text-red-300",
};

const formatCurrency = (amount) => {
  const value = Number(amount) || 0;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (value) => {
  if (!value) return "--";

  return new Date(value).toLocaleDateString("en-IN");
};

export default function Orders() {
  const employeeId =
    localStorage.getItem("employee_id");

  const [employee, setEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    product_name: "",
    quantity: "",
    unit: "KG",
    amount: "",
    delivery_address: "",
    delivery_date: "",
    assigned_to: "",
    notes: "",
  });

  const role =
    employee?.role?.trim().toLowerCase() || "";

  const isDeliveryBoy =
    role === "delivery_boy";

  const canManage = !isDeliveryBoy;

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

  const fetchOrders = async () => {
    setLoading(true);

    let query = supabase
      .from("orders")
      .select("*")
      .order("id", { ascending: false });

    if (isDeliveryBoy) {
      query = query.eq("assigned_to", employeeId);
    }

    const { data, error } = await query;

    if (error) {
      setOrdersError(error.message);
      setOrders([]);
    } else {
      setOrdersError("");
      setOrders(data || []);
    }

    setLoading(false);
  };

  const loadData = async () => {
    await fetchEmployee();
    await fetchEmployees();
    await fetchOrders();
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (employee) {
      fetchOrders();
    }
  }, [employee]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const getEmployeeName = (empId) => {
    const match = employees.find(
      (emp) => emp.employee_id === empId
    );

    return match?.full_name || empId || "Unassigned";
  };

  const deliveryStaff = employees.filter((emp) => {
    const empRole =
      emp.role?.trim().toLowerCase() || "";

    return (
      empRole === "delivery_boy" ||
      empRole === "worker" ||
      empRole === "supervisor"
    );
  });

  const filteredOrders =
    statusFilter === "all"
      ? orders
      : orders.filter(
          (order) => order.status === statusFilter
        );

  const pendingCount = orders.filter(
    (o) => o.status === "pending"
  ).length;

  const processingCount = orders.filter(
    (o) => o.status === "processing"
  ).length;

  const dispatchedCount = orders.filter(
    (o) => o.status === "dispatched"
  ).length;

  const deliveredCount = orders.filter(
    (o) => o.status === "delivered"
  ).length;

  const totalRevenue = orders
    .filter((o) => o.status === "delivered")
    .reduce(
      (sum, o) => sum + Number(o.amount || 0),
      0
    );

  const createOrder = async () => {
    if (
      !form.customer_name ||
      !form.product_name ||
      !form.quantity
    ) {
      alert("Fill customer name, product, and quantity");
      return;
    }

    setSaving(true);

    const orderNumber =
      "ORD-" + Date.now();

    const { error } = await supabase
      .from("orders")
      .insert([
        {
          order_number: orderNumber,
          customer_name: form.customer_name,
          customer_phone: form.customer_phone,
          product_name: form.product_name,
          quantity: Number(form.quantity),
          unit: form.unit,
          amount: Number(form.amount || 0),
          delivery_address: form.delivery_address,
          delivery_date: form.delivery_date || null,
          assigned_to: form.assigned_to || null,
          notes: form.notes,
          status: "pending",
          created_by: employeeId,
        },
      ]);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Order created: " + orderNumber);

    setForm({
      customer_name: "",
      customer_phone: "",
      product_name: "",
      quantity: "",
      unit: "KG",
      amount: "",
      delivery_address: "",
      delivery_date: "",
      assigned_to: "",
      notes: "",
    });

    setShowForm(false);
    fetchOrders();
  };

  const updateOrderStatus = async (
    order,
    status
  ) => {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", order.id);

    if (error) {
      alert(error.message);
      return;
    }

    fetchOrders();
  };

  const deleteOrder = async (order) => {
    const confirmed = confirm(
      "Delete order " +
        (order.order_number || order.id) +
        "?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("orders")
      .delete()
      .eq("id", order.id);

    if (error) {
      alert(error.message);
      return;
    }

    fetchOrders();
  };

  const getNextActions = (order) => {
    if (isDeliveryBoy) {
      if (order.status === "pending") {
        return ["processing"];
      }

      if (order.status === "processing") {
        return ["dispatched"];
      }

      if (order.status === "dispatched") {
        return ["delivered"];
      }

      return [];
    }

    const flow = {
      pending: ["processing", "cancelled"],
      processing: ["dispatched", "cancelled"],
      dispatched: ["delivered", "cancelled"],
      delivered: [],
      cancelled: ["pending"],
    };

    return flow[order.status] || [];
  };

  return (
    <div>
      <Topbar title="Orders" />

      {/* HEADER */}
      <div className="mt-6 rounded-[35px] border border-white/10 bg-white/5 backdrop-blur-3xl p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <h1 className="text-3xl font-black">
              {isDeliveryBoy
                ? "My Deliveries"
                : "Order Management"}
            </h1>
            <p className="mt-2 text-white/50">
              {isDeliveryBoy
                ? "View and update your assigned delivery orders"
                : "Create and track customer orders & dispatches"}
            </p>
          </div>

          {canManage && (
            <button
              onClick={() =>
                setShowForm(!showForm)
              }
              className="px-6 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 font-bold"
            >
              {showForm
                ? "Close Form"
                : "+ New Order"}
            </button>
          )}
        </div>

        {ordersError && (
          <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            Could not load orders: {ordersError}
          </div>
        )}
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mt-6">
        <div className="rounded-[30px] border border-white/10 bg-white/5 p-5">
          <p className="text-white/50 text-sm">
            Total Orders
          </p>
          <h2 className="text-3xl font-black mt-2">
            {orders.length}
          </h2>
        </div>

        <div className="rounded-[30px] border border-white/10 bg-white/5 p-5">
          <p className="text-white/50 text-sm">
            Pending
          </p>
          <h2 className="text-3xl font-black mt-2 text-orange-300">
            {pendingCount}
          </h2>
        </div>

        <div className="rounded-[30px] border border-white/10 bg-white/5 p-5">
          <p className="text-white/50 text-sm">
            Processing
          </p>
          <h2 className="text-3xl font-black mt-2 text-blue-300">
            {processingCount}
          </h2>
        </div>

        <div className="rounded-[30px] border border-white/10 bg-white/5 p-5">
          <p className="text-white/50 text-sm">
            Dispatched
          </p>
          <h2 className="text-3xl font-black mt-2 text-purple-300">
            {dispatchedCount}
          </h2>
        </div>

        <div className="rounded-[30px] border border-white/10 bg-white/5 p-5 col-span-2 lg:col-span-1">
          <p className="text-white/50 text-sm">
            {canManage
              ? "Revenue"
              : "Delivered"}
          </p>
          <h2 className="text-2xl font-black mt-2 text-green-300">
            {canManage
              ? formatCurrency(totalRevenue)
              : deliveredCount}
          </h2>
        </div>
      </div>

      {/* CREATE FORM */}
      {showForm && canManage && (
        <div className="mt-6 rounded-[35px] border border-white/10 bg-white/5 backdrop-blur-3xl p-6 md:p-8">
          <h1 className="text-3xl font-black mb-6">
            Create New Order
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            <input
              name="customer_name"
              value={form.customer_name}
              onChange={handleChange}
              placeholder="Customer Name *"
              className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
            />

            <input
              name="customer_phone"
              value={form.customer_phone}
              onChange={handleChange}
              placeholder="Customer Phone"
              className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
            />

            <input
              name="product_name"
              value={form.product_name}
              onChange={handleChange}
              placeholder="Product Name *"
              className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
            />

            <input
              name="quantity"
              type="number"
              min="0"
              value={form.quantity}
              onChange={handleChange}
              placeholder="Quantity *"
              className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
            />

            <select
              name="unit"
              value={form.unit}
              onChange={handleChange}
              className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
            >
              <option value="KG">KG</option>
              <option value="PCS">PCS</option>
              <option value="BOX">BOX</option>
              <option value="LTR">LTR</option>
            </select>

            <input
              name="amount"
              type="number"
              min="0"
              value={form.amount}
              onChange={handleChange}
              placeholder="Order Amount (₹)"
              className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
            />

            <input
              name="delivery_address"
              value={form.delivery_address}
              onChange={handleChange}
              placeholder="Delivery Address"
              className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none md:col-span-2"
            />

            <input
              type="date"
              name="delivery_date"
              value={form.delivery_date}
              onChange={handleChange}
              className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
            />

            <select
              name="assigned_to"
              value={form.assigned_to}
              onChange={handleChange}
              className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
            >
              <option value="">
                Assign Delivery Staff
              </option>

              {deliveryStaff.map((emp) => (
                <option
                  key={emp.employee_id}
                  value={emp.employee_id}
                >
                  {emp.full_name} ({emp.role})
                </option>
              ))}
            </select>

            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Notes (optional)"
              className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none md:col-span-2 xl:col-span-3 min-h-[90px]"
            />
          </div>

          <button
            onClick={createOrder}
            disabled={saving}
            className="mt-6 px-8 py-4 rounded-2xl bg-gradient-to-r from-green-500 to-green-700 font-bold text-lg"
          >
            {saving
              ? "Creating..."
              : "Create Order"}
          </button>
        </div>
      )}

      {/* FILTER */}
      <div className="mt-6 flex flex-wrap gap-3">
        {["all", ...STATUSES].map((status) => (
          <button
            key={status}
            onClick={() =>
              setStatusFilter(status)
            }
            className={`px-5 py-3 rounded-2xl font-bold capitalize transition-all ${
              statusFilter === status
                ? "bg-gradient-to-r from-orange-500 to-red-600"
                : "bg-white/5 border border-white/10 hover:bg-white/10"
            }`}
          >
            {status === "all"
              ? "All"
              : STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      {/* ORDER LIST */}
      <div className="mt-6 rounded-[35px] border border-white/10 bg-white/5 backdrop-blur-3xl p-6 md:p-8">
        <h1 className="text-3xl font-black mb-6">
          {statusFilter === "all"
            ? "All Orders"
            : STATUS_LABELS[statusFilter] +
              " Orders"}
        </h1>

        {loading ? (
          <div className="text-white/40">
            Loading orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-white/40">
            No orders found.
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-[30px] border border-white/10 bg-white/5 p-6 relative overflow-hidden"
              >
                <div
                  className={`absolute top-[-60px] right-[-60px] w-[180px] h-[180px] blur-[120px] rounded-full opacity-20 ${
                    order.status === "delivered"
                      ? "bg-green-500"
                      : order.status === "cancelled"
                        ? "bg-red-500"
                        : "bg-orange-500"
                  }`}
                ></div>

                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-white/40 text-sm font-bold">
                        {order.order_number ||
                          "ORD-" + order.id}
                      </p>
                      <h2 className="text-2xl font-black mt-1">
                        {order.customer_name}
                      </h2>
                      <p className="text-white/50 mt-1">
                        {order.product_name}
                      </p>
                    </div>

                    <div
                      className={`px-4 py-2 rounded-xl text-sm font-bold capitalize ${
                        STATUS_COLORS[
                          order.status
                        ] ||
                        "bg-white/10 text-white"
                      }`}
                    >
                      {STATUS_LABELS[
                        order.status
                      ] || order.status}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-5 text-sm">
                    <div>
                      <p className="text-white/40">
                        Quantity
                      </p>
                      <p className="font-bold mt-1">
                        {order.quantity}{" "}
                        {order.unit}
                      </p>
                    </div>

                    <div>
                      <p className="text-white/40">
                        Amount
                      </p>
                      <p className="font-bold mt-1 text-green-300">
                        {formatCurrency(
                          order.amount
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-white/40">
                        Delivery Date
                      </p>
                      <p className="font-bold mt-1">
                        {formatDate(
                          order.delivery_date
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-white/40">
                        Assigned To
                      </p>
                      <p className="font-bold mt-1">
                        {getEmployeeName(
                          order.assigned_to
                        )}
                      </p>
                    </div>
                  </div>

                  {order.customer_phone && (
                    <p className="mt-4 text-white/50 text-sm">
                      📞 {order.customer_phone}
                    </p>
                  )}

                  {order.delivery_address && (
                    <p className="mt-2 text-white/50 text-sm">
                      📍 {order.delivery_address}
                    </p>
                  )}

                  {order.notes && (
                    <p className="mt-2 text-white/50 text-sm">
                      📝 {order.notes}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 mt-5">
                    {getNextActions(order).map(
                      (status) => (
                        <button
                          key={status}
                          onClick={() =>
                            updateOrderStatus(
                              order,
                              status
                            )
                          }
                          className={`px-4 py-2 rounded-xl font-bold capitalize ${
                            status ===
                            "cancelled"
                              ? "bg-red-500/20 text-red-300"
                              : "bg-blue-500/20 text-blue-300"
                          }`}
                        >
                          Mark{" "}
                          {STATUS_LABELS[status]}
                        </button>
                      )
                    )}

                    {canManage &&
                      order.status !==
                        "delivered" && (
                        <button
                          onClick={() =>
                            deleteOrder(order)
                          }
                          className="px-4 py-2 rounded-xl bg-red-500/20 text-red-300 font-bold"
                        >
                          Delete
                        </button>
                      )}
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
