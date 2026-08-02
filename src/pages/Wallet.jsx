import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

import Topbar from "../components/Topbar";
import QrScanner from "../components/QrScanner";

import { supabase } from "../lib/supabase";
import { hashPassword } from "../lib/password";

const formatPoints = (amount) => {
  const value = Number(amount) || 0;

  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(value);
};

const makeQrToken = (code) => `TAJ-${code}`;

export default function Wallet() {
  const employeeId =
    localStorage.getItem("employee_id");

  const [employee, setEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [shopkeepers, setShopkeepers] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [myWallet, setMyWallet] = useState(null);
  const [myShop, setMyShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("overview");
  const [showScanner, setShowScanner] = useState(false);

  const [creditForm, setCreditForm] = useState({
    employee_id: "",
    amount: "",
    notes: "",
  });

  const [shopForm, setShopForm] = useState({
    shop_name: "",
    owner_name: "",
    phone: "",
    employee_id: "",
    password: "",
  });

  const [payForm, setPayForm] = useState({
    qr_code: "",
    amount: "",
    notes: "",
  });

  const [settleForm, setSettleForm] = useState({
    shopkeeper_code: "",
    amount: "",
    notes: "",
  });

  const role =
    employee?.role?.trim().toLowerCase() || "";

  const isAdmin = [
    "admin",
    "manager",
    "accountant",
  ].includes(role);

  const isShopkeeper = role === "shopkeeper";

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

    if (data) setEmployees(data);
  };

  const fetchWallets = async () => {
    const { data } = await supabase
      .from("wallets")
      .select("*");

    if (data) setWallets(data);
  };

  const fetchShopkeepers = async () => {
    const { data, error: fetchError } =
      await supabase
        .from("shopkeepers")
        .select("*")
        .order("shop_name", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      setShopkeepers([]);
      return;
    }

    setShopkeepers(data || []);
  };

  const fetchTransactions = async () => {
    const { data } = await supabase
      .from("wallet_transactions")
      .select("*")
      .order("id", { ascending: false })
      .limit(50);

    if (data) setTransactions(data);
  };

  const loadData = async () => {
    setLoading(true);
    setError("");

    await fetchEmployee();
    await fetchEmployees();
    await fetchWallets();
    await fetchShopkeepers();
    await fetchTransactions();

    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    const wallet = wallets.find(
      (w) => w.employee_id === employeeId
    );

    setMyWallet(wallet || { balance: 0 });

    const shop = shopkeepers.find(
      (s) => s.employee_id === employeeId
    );

    setMyShop(shop || null);
  }, [wallets, shopkeepers, employeeId]);

  const getEmployeeName = (id) => {
    const match = employees.find(
      (e) => e.employee_id === id
    );

    return match?.full_name || id || "--";
  };

  const getShopName = (code) => {
    const match = shopkeepers.find(
      (s) => s.shopkeeper_code === code
    );

    return match?.shop_name || code || "--";
  };

  const findShopByQr = (input) => {
    const value = input.trim().toUpperCase();

    return shopkeepers.find(
      (s) =>
        s.qr_token?.toUpperCase() === value ||
        s.shopkeeper_code?.toUpperCase() === value ||
        makeQrToken(s.shopkeeper_code).toUpperCase() ===
          value
    );
  };

  const addWalletCredit = async () => {
    if (
      !creditForm.employee_id ||
      !creditForm.amount
    ) {
      alert("Select employee and amount");
      return;
    }

    const amount = Number(creditForm.amount);

    if (amount <= 0) {
      alert("Enter valid amount");
      return;
    }

    setSaving(true);

    const existing = wallets.find(
      (w) =>
        w.employee_id === creditForm.employee_id
    );

    const newBalance =
      Number(existing?.balance || 0) + amount;

    let walletError;

    if (existing?.id) {
      ({ error: walletError } = await supabase
        .from("wallets")
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id));
    } else {
      ({ error: walletError } = await supabase
        .from("wallets")
        .insert([
          {
            employee_id: creditForm.employee_id,
            balance: newBalance,
          },
        ]));
    }

    if (walletError) {
      setSaving(false);
      alert(walletError.message);
      return;
    }

    const { error: txError } = await supabase
      .from("wallet_transactions")
      .insert([
        {
          transaction_type: "admin_credit",
          from_employee_id: creditForm.employee_id,
          amount,
          employee_balance_after: newBalance,
          notes: creditForm.notes,
          created_by: employeeId,
        },
      ]);

    if (txError) {
      setSaving(false);
      alert(
        "Balance updated, but ledger write failed: " +
          txError.message
      );
      await fetchWallets();
      await fetchTransactions();
      return;
    }

    setSaving(false);
    alert("Points added to wallet");

    setCreditForm({
      employee_id: "",
      amount: "",
      notes: "",
    });

    await fetchWallets();
    await fetchTransactions();
  };

  const createShopkeeper = async () => {
    if (
      !shopForm.shop_name ||
      !shopForm.employee_id ||
      !shopForm.password
    ) {
      alert("Fill shop name, login ID and password");
      return;
    }

    setSaving(true);

    const shopkeeperCode =
      "SHOP" + Date.now().toString().slice(-6);

    const qrToken = makeQrToken(shopkeeperCode);

    const hashedPassword = await hashPassword(shopForm.password);

    const { error: empError } = await supabase
      .from("employees")
      .insert([
        {
          employee_id: shopForm.employee_id,
          full_name:
            shopForm.owner_name ||
            shopForm.shop_name,
          phone: shopForm.phone,
          password: hashedPassword,
          role: "shopkeeper",
          department: "Shop",
          approval_status: "approved",
          status: "active",
        },
      ]);

    if (empError) {
      setSaving(false);
      alert(empError.message);
      return;
    }

    await supabase
      .from("employee_permissions")
      .insert([
        {
          employee_id: shopForm.employee_id,
          dashboard: true,
          wallet: true,
        },
      ]);

    const { error: shopError } = await supabase
      .from("shopkeepers")
      .insert([
        {
          shopkeeper_code: shopkeeperCode,
          shop_name: shopForm.shop_name,
          owner_name: shopForm.owner_name,
          phone: shopForm.phone,
          employee_id: shopForm.employee_id,
          qr_token: qrToken,
        },
      ]);

    setSaving(false);

    if (shopError) {
      alert(shopError.message);
      return;
    }

    alert(
      "Shopkeeper created. QR Code: " + qrToken
    );

    setShopForm({
      shop_name: "",
      owner_name: "",
      phone: "",
      employee_id: "",
      password: "",
    });

    await loadData();
  };

  const scannedShop = findShopByQr(payForm.qr_code);

  const handleQrScan = (code) => {
    setPayForm({
      ...payForm,
      qr_code: code.trim(),
    });
    setShowScanner(false);
  };

  const payShopkeeper = async () => {
    const shop = findShopByQr(payForm.qr_code);
    const amount = Number(payForm.amount);

    if (!shop) {
      alert("Invalid shopkeeper QR or code");
      return;
    }

    if (!amount || amount <= 0) {
      alert("Enter valid amount");
      return;
    }

    const balance = Number(myWallet?.balance || 0);

    if (amount > balance) {
      alert("Not enough points in wallet");
      return;
    }

    setSaving(true);

    const newEmployeeBalance = balance - amount;
    const newShopBalance =
      Number(shop.balance || 0) + amount;
    const newTotalReceived =
      Number(shop.total_received || 0) + amount;

    const walletRow = wallets.find(
      (w) => w.employee_id === employeeId
    );

    let walletError;

    if (walletRow?.id) {
      ({ error: walletError } = await supabase
        .from("wallets")
        .update({
          balance: newEmployeeBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", walletRow.id));
    } else {
      ({ error: walletError } = await supabase
        .from("wallets")
        .insert([
          {
            employee_id: employeeId,
            balance: newEmployeeBalance,
          },
        ]));
    }

    if (walletError) {
      setSaving(false);
      alert(walletError.message);
      return;
    }

    const { error: shopError } = await supabase
      .from("shopkeepers")
      .update({
        balance: newShopBalance,
        total_received: newTotalReceived,
      })
      .eq("id", shop.id);

    if (shopError) {
      setSaving(false);
      alert(shopError.message);
      return;
    }

    const { error: txError } = await supabase
      .from("wallet_transactions")
      .insert([
        {
          transaction_type: "payment",
          from_employee_id: employeeId,
          to_shopkeeper_id: shop.shopkeeper_code,
          amount,
          employee_balance_after:
            newEmployeeBalance,
          shopkeeper_balance_after: newShopBalance,
          notes: payForm.notes,
          created_by: employeeId,
        },
      ]);

    if (txError) {
      setSaving(false);
      alert(
        "Balances updated, but ledger write failed: " +
          txError.message
      );
      await loadData();
      return;
    }

    setSaving(false);
    alert("Payment successful");

    setPayForm({
      qr_code: "",
      amount: "",
      notes: "",
    });

    await loadData();
  };

  const settleShopkeeper = async () => {
    const shop = shopkeepers.find(
      (s) =>
        s.shopkeeper_code ===
        settleForm.shopkeeper_code
    );

    const amount = Number(settleForm.amount);

    if (!shop) {
      alert("Select shopkeeper");
      return;
    }

    if (!amount || amount <= 0) {
      alert("Enter valid amount");
      return;
    }

    if (amount > Number(shop.balance || 0)) {
      alert("Amount exceeds shopkeeper pending balance");
      return;
    }

    setSaving(true);

    const newBalance =
      Number(shop.balance || 0) - amount;
    const newSettled =
      Number(shop.total_settled || 0) + amount;

    const { error: shopError } = await supabase
      .from("shopkeepers")
      .update({
        balance: newBalance,
        total_settled: newSettled,
      })
      .eq("id", shop.id);

    if (shopError) {
      setSaving(false);
      alert(shopError.message);
      return;
    }

    const { error: txError } = await supabase
      .from("wallet_transactions")
      .insert([
        {
          transaction_type: "settlement",
          to_shopkeeper_id: shop.shopkeeper_code,
          amount,
          shopkeeper_balance_after: newBalance,
          notes: settleForm.notes,
          created_by: employeeId,
        },
      ]);

    if (txError) {
      setSaving(false);
      alert(
        "Settlement balance updated, but ledger write failed: " +
          txError.message
      );
      await loadData();
      return;
    }

    setSaving(false);
    alert("Settlement recorded");

    setSettleForm({
      shopkeeper_code: "",
      amount: "",
      notes: "",
    });

    await loadData();
  };

  const workerEmployees = employees.filter((emp) => {
    const empRole =
      emp.role?.trim().toLowerCase() || "";

    return (
      empRole !== "shopkeeper" &&
      empRole !== "admin"
    );
  });

  const visibleTransactions = isShopkeeper
    ? transactions.filter(
        (t) =>
          t.to_shopkeeper_id ===
          myShop?.shopkeeper_code
      )
    : isAdmin
      ? transactions
      : transactions.filter(
          (t) =>
            t.from_employee_id === employeeId ||
            t.created_by === employeeId
        );

  const adminTabs = [
    { id: "overview", label: "Overview" },
    { id: "credit", label: "Add Points" },
    { id: "shops", label: "Shopkeepers" },
    { id: "settle", label: "Pay Shopkeeper" },
    { id: "history", label: "Transactions" },
  ];

  if (loading) {
    return (
      <div>
        <Topbar title="Wallet / UPI" />
        <p className="mt-6 text-white/40">
          Loading wallet...
        </p>
      </div>
    );
  }

  return (
    <div>
      <Topbar title="Wallet / UPI" />

      {error && (
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
          {error} — Run wallet SQL in Supabase.
        </div>
      )}

      {/* SHOPKEEPER VIEW */}
      {isShopkeeper && myShop && (
        <>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-[30px] border border-white/10 bg-white/5 p-6">
              <p className="text-white/50">
                Pending Settlement
              </p>
              <h2 className="text-3xl font-black mt-2 text-orange-300">
                {formatPoints(myShop.balance)} pts
              </h2>
            </div>
            <div className="rounded-[30px] border border-white/10 bg-white/5 p-6">
              <p className="text-white/50">
                Total Received
              </p>
              <h2 className="text-3xl font-black mt-2 text-green-300">
                {formatPoints(
                  myShop.total_received
                )}{" "}
                pts
              </h2>
            </div>
            <div className="rounded-[30px] border border-white/10 bg-white/5 p-6">
              <p className="text-white/50">
                Paid By Factory
              </p>
              <h2 className="text-3xl font-black mt-2 text-blue-300">
                {formatPoints(
                  myShop.total_settled
                )}{" "}
                pts
              </h2>
            </div>
          </div>

          <div className="mt-6 rounded-[35px] border border-white/10 bg-white/5 p-8 text-center">
            <h2 className="text-2xl font-black mb-2">
              {myShop.shop_name}
            </h2>
            <p className="text-white/50 mb-6">
              Show this QR to workers for payment
            </p>

            <div className="inline-block p-6 rounded-3xl bg-white">
              <QRCodeSVG
                value={myShop.qr_token}
                size={220}
              />
            </div>

            <p className="mt-6 text-xl font-black text-orange-300">
              {myShop.qr_token}
            </p>
            <p className="text-white/40 mt-2 text-sm">
              Code: {myShop.shopkeeper_code}
            </p>
          </div>

          <div className="mt-6 rounded-[35px] border border-white/10 bg-white/5 p-6 md:p-8">
            <h2 className="text-2xl font-black mb-5">
              Received Payments
            </h2>

            {visibleTransactions.length === 0 ? (
              <p className="text-white/40">
                No payments yet.
              </p>
            ) : (
              <div className="space-y-3">
                {visibleTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-bold">
                        {getEmployeeName(
                          tx.from_employee_id
                        )}
                      </p>
                      <p className="text-white/40 text-sm">
                        {new Date(
                          tx.created_at
                        ).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <span className="text-green-300 font-black text-xl">
                      +{formatPoints(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* WORKER VIEW */}
      {!isAdmin && !isShopkeeper && (
        <>
          <div className="mt-6 rounded-[35px] border border-white/10 bg-white/5 p-8">
            <p className="text-white/50">
              My Wallet Balance
            </p>
            <h1 className="text-5xl font-black mt-3 text-green-300">
              {formatPoints(myWallet?.balance || 0)}{" "}
              <span className="text-2xl text-white/50">
                points
              </span>
            </h1>
            <p className="text-white/40 mt-3">
              Use points to buy from factory
              shopkeepers. Admin adds points to your
              wallet.
            </p>
          </div>

          <div className="mt-6 rounded-[35px] border border-white/10 bg-white/5 p-6 md:p-8">
            <h2 className="text-2xl font-black mb-6">
              Pay Shopkeeper
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2 flex flex-col sm:flex-row gap-3">
                <input
                  placeholder="Shopkeeper QR code or SHOP code *"
                  value={payForm.qr_code}
                  onChange={(e) =>
                    setPayForm({
                      ...payForm,
                      qr_code: e.target.value,
                    })
                  }
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
                />

                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="px-6 py-4 rounded-2xl bg-blue-600 font-bold whitespace-nowrap"
                >
                  📷 Scan QR
                </button>
              </div>

              {scannedShop && (
                <div className="md:col-span-2 rounded-2xl border border-green-500/30 bg-green-500/10 p-4">
                  <p className="text-green-300 font-bold">
                    Shop found: {scannedShop.shop_name}
                  </p>
                  <p className="text-white/50 text-sm mt-1">
                    {scannedShop.qr_token}
                  </p>
                </div>
              )}

              <input
                type="number"
                min="1"
                placeholder="Amount (points) *"
                value={payForm.amount}
                onChange={(e) =>
                  setPayForm({
                    ...payForm,
                    amount: e.target.value,
                  })
                }
                className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
              />

              <input
                placeholder="Note (optional)"
                value={payForm.notes}
                onChange={(e) =>
                  setPayForm({
                    ...payForm,
                    notes: e.target.value,
                  })
                }
                className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
              />
            </div>

            <button
              onClick={payShopkeeper}
              disabled={saving}
              className="mt-6 px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 font-bold"
            >
              {saving
                ? "Processing..."
                : "Pay Points"}
            </button>
          </div>

          <div className="mt-6 rounded-[35px] border border-white/10 bg-white/5 p-6 md:p-8">
            <h2 className="text-2xl font-black mb-5">
              My Transactions
            </h2>

            {visibleTransactions.length === 0 ? (
              <p className="text-white/40">
                No transactions yet.
              </p>
            ) : (
              <div className="space-y-3">
                {visibleTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 flex justify-between"
                  >
                    <div>
                      <p className="font-bold capitalize">
                        {tx.transaction_type?.replace(
                          "_",
                          " "
                        )}
                      </p>
                      <p className="text-white/50 text-sm">
                        {tx.transaction_type ===
                        "payment"
                          ? getShopName(
                              tx.to_shopkeeper_id
                            )
                          : tx.notes || "--"}
                      </p>
                      <p className="text-white/40 text-xs mt-1">
                        {new Date(
                          tx.created_at
                        ).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <span
                      className={`font-black text-xl ${
                        tx.transaction_type ===
                        "admin_credit"
                          ? "text-green-300"
                          : "text-red-300"
                      }`}
                    >
                      {tx.transaction_type ===
                      "admin_credit"
                        ? "+"
                        : "-"}
                      {formatPoints(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ADMIN VIEW */}
      {isAdmin && (
        <>
          <div className="mt-6 flex flex-wrap gap-3">
            {adminTabs.map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`px-5 py-3 rounded-2xl font-bold ${
                  tab === item.id
                    ? "bg-gradient-to-r from-orange-500 to-red-600"
                    : "bg-white/5 border border-white/10"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {tab === "overview" && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="rounded-[30px] border border-white/10 bg-white/5 p-6">
                <p className="text-white/50">
                  Active Wallets
                </p>
                <h2 className="text-3xl font-black mt-2">
                  {wallets.length}
                </h2>
              </div>
              <div className="rounded-[30px] border border-white/10 bg-white/5 p-6">
                <p className="text-white/50">
                  Shopkeepers
                </p>
                <h2 className="text-3xl font-black mt-2">
                  {shopkeepers.length}
                </h2>
              </div>
              <div className="rounded-[30px] border border-white/10 bg-white/5 p-6">
                <p className="text-white/50">
                  Pending to Shops
                </p>
                <h2 className="text-3xl font-black mt-2 text-orange-300">
                  {formatPoints(
                    shopkeepers.reduce(
                      (sum, s) =>
                        sum + Number(s.balance || 0),
                      0
                    )
                  )}
                </h2>
              </div>
            </div>
          )}

          {tab === "credit" && (
            <div className="mt-6 rounded-[35px] border border-white/10 bg-white/5 p-6 md:p-8">
              <h2 className="text-2xl font-black mb-6">
                Add Points to Employee Wallet
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <select
                  value={creditForm.employee_id}
                  onChange={(e) =>
                    setCreditForm({
                      ...creditForm,
                      employee_id: e.target.value,
                    })
                  }
                  className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
                >
                  <option value="">
                    Select Employee
                  </option>
                  {workerEmployees.map((emp) => (
                    <option
                      key={emp.employee_id}
                      value={emp.employee_id}
                    >
                      {emp.full_name} ({emp.employee_id})
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  placeholder="Points to add *"
                  value={creditForm.amount}
                  onChange={(e) =>
                    setCreditForm({
                      ...creditForm,
                      amount: e.target.value,
                    })
                  }
                  className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
                />

                <input
                  placeholder="Note (salary advance, bonus...)"
                  value={creditForm.notes}
                  onChange={(e) =>
                    setCreditForm({
                      ...creditForm,
                      notes: e.target.value,
                    })
                  }
                  className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none md:col-span-2"
                />
              </div>

              <button
                onClick={addWalletCredit}
                disabled={saving}
                className="mt-6 px-8 py-4 rounded-2xl bg-gradient-to-r from-green-500 to-green-700 font-bold"
              >
                {saving ? "Adding..." : "Add Points"}
              </button>
            </div>
          )}

          {tab === "shops" && (
            <div className="mt-6 space-y-6">
              <div className="rounded-[35px] border border-white/10 bg-white/5 p-6 md:p-8">
                <h2 className="text-2xl font-black mb-6">
                  Register Shopkeeper
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <input
                    placeholder="Shop Name *"
                    value={shopForm.shop_name}
                    onChange={(e) =>
                      setShopForm({
                        ...shopForm,
                        shop_name: e.target.value,
                      })
                    }
                    className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
                  />
                  <input
                    placeholder="Owner Name"
                    value={shopForm.owner_name}
                    onChange={(e) =>
                      setShopForm({
                        ...shopForm,
                        owner_name: e.target.value,
                      })
                    }
                    className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
                  />
                  <input
                    placeholder="Phone"
                    value={shopForm.phone}
                    onChange={(e) =>
                      setShopForm({
                        ...shopForm,
                        phone: e.target.value,
                      })
                    }
                    className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
                  />
                  <input
                    placeholder="Login ID (e.g. SHOP001) *"
                    value={shopForm.employee_id}
                    onChange={(e) =>
                      setShopForm({
                        ...shopForm,
                        employee_id: e.target.value,
                      })
                    }
                    className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
                  />
                  <input
                    type="password"
                    placeholder="Password *"
                    value={shopForm.password}
                    onChange={(e) =>
                      setShopForm({
                        ...shopForm,
                        password: e.target.value,
                      })
                    }
                    className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none md:col-span-2"
                  />
                </div>

                <button
                  onClick={createShopkeeper}
                  disabled={saving}
                  className="mt-6 px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 font-bold"
                >
                  {saving
                    ? "Creating..."
                    : "Create Shopkeeper + QR"}
                </button>
              </div>

              <div className="rounded-[35px] border border-white/10 bg-white/5 p-6 md:p-8">
                <h2 className="text-2xl font-black mb-5">
                  All Shopkeepers
                </h2>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  {shopkeepers.map((shop) => (
                    <div
                      key={shop.id}
                      className="rounded-[30px] border border-white/10 bg-white/5 p-5"
                    >
                      <div className="flex gap-5 items-start">
                        <div className="p-3 rounded-2xl bg-white shrink-0">
                          <QRCodeSVG
                            value={shop.qr_token}
                            size={100}
                          />
                        </div>
                        <div>
                          <h3 className="text-xl font-black">
                            {shop.shop_name}
                          </h3>
                          <p className="text-white/50 text-sm mt-1">
                            {shop.qr_token}
                          </p>
                          <p className="text-orange-300 font-bold mt-2">
                            Pending:{" "}
                            {formatPoints(
                              shop.balance
                            )}{" "}
                            pts
                          </p>
                          <p className="text-white/40 text-sm">
                            Login: {shop.employee_id}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "settle" && (
            <div className="mt-6 rounded-[35px] border border-white/10 bg-white/5 p-6 md:p-8">
              <h2 className="text-2xl font-black mb-2">
                Pay Shopkeeper (Settlement)
              </h2>
              <p className="text-white/50 mb-6">
                Record when you pay real money/UPI to
                shopkeeper for collected points
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <select
                  value={settleForm.shopkeeper_code}
                  onChange={(e) =>
                    setSettleForm({
                      ...settleForm,
                      shopkeeper_code:
                        e.target.value,
                    })
                  }
                  className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
                >
                  <option value="">
                    Select Shopkeeper
                  </option>
                  {shopkeepers.map((shop) => (
                    <option
                      key={shop.shopkeeper_code}
                      value={shop.shopkeeper_code}
                    >
                      {shop.shop_name} — pending{" "}
                      {formatPoints(shop.balance)}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  placeholder="Amount paid (points) *"
                  value={settleForm.amount}
                  onChange={(e) =>
                    setSettleForm({
                      ...settleForm,
                      amount: e.target.value,
                    })
                  }
                  className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
                />

                <input
                  placeholder="UPI reference / note"
                  value={settleForm.notes}
                  onChange={(e) =>
                    setSettleForm({
                      ...settleForm,
                      notes: e.target.value,
                    })
                  }
                  className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none md:col-span-2"
                />
              </div>

              <button
                onClick={settleShopkeeper}
                disabled={saving}
                className="mt-6 px-8 py-4 rounded-2xl bg-gradient-to-r from-green-500 to-green-700 font-bold"
              >
                {saving
                  ? "Saving..."
                  : "Record Settlement"}
              </button>
            </div>
          )}

          {tab === "history" && (
            <div className="mt-6 rounded-[35px] border border-white/10 bg-white/5 p-6 md:p-8">
              <h2 className="text-2xl font-black mb-5">
                All Transactions
              </h2>

              <div className="space-y-3">
                {visibleTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 grid grid-cols-1 md:grid-cols-4 gap-3"
                  >
                    <p className="font-bold capitalize">
                      {tx.transaction_type?.replace(
                        "_",
                        " "
                      )}
                    </p>
                    <p className="text-white/60">
                      {tx.from_employee_id
                        ? getEmployeeName(
                            tx.from_employee_id
                          )
                        : "--"}{" "}
                      →{" "}
                      {tx.to_shopkeeper_id
                        ? getShopName(
                            tx.to_shopkeeper_id
                          )
                        : "--"}
                    </p>
                    <p className="text-white/40 text-sm">
                      {new Date(
                        tx.created_at
                      ).toLocaleString("en-IN")}
                    </p>
                    <p className="font-black text-green-300 text-right">
                      {formatPoints(tx.amount)} pts
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {showScanner && (
        <QrScanner
          onScan={handleQrScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
