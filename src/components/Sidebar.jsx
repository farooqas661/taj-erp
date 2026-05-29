export default function Sidebar({
  active,
  setActive,
  permissions,
}) {

  const employeeId =
    localStorage.getItem("employee_id");

  // LOGOUT
  const handleLogout = () => {

    localStorage.removeItem(
      "employee_id"
    );

    window.location.reload();

  };

  // MENU ITEMS
  const menuItems = [

    {
      id: "dashboard",
      label: "Dashboard",
      icon: "📊",
      permission: "dashboard",
    },

    {
      id: "employees",
      label: "Employees",
      icon: "🧑‍💼",
      permission: "employees",
    },

    {
      id: "attendance",
      label: "Attendance",
      icon: "🕒",
      permission: "attendance",
    },

    {
      id: "tasks",
      label: "Tasks",
      icon: "📋",
      permission: "attendance",
    },

    {
      id: "salary",
      label: "Salary",
      icon: "💰",
      permission: "salary",
    },

    {
      id: "stock",
      label: "Stock",
      icon: "📦",
      permission: "stock",
    },

    {
      id: "orders",
      label: "Orders",
      icon: "🚚",
      permission: "orders",
    },

    {
      id: "reports",
      label: "Reports",
      icon: "📈",
      permission: "reports",
    },

    {
      id: "approvals",
      label: "Approvals",
      icon: "✅",
      permission: "employees",
    },

    {
      id: "settings",
      label: "Settings",
      icon: "⚙️",
      permission: "settings",
    },

    {
      id: "calls",
      label: "Calls",
      icon: "📞",
      permission: "calls",
    },

  ];

  return (

    <div className="w-[280px] h-screen border-r border-white/10 bg-[#0b0b0d]/90 backdrop-blur-3xl p-5 flex flex-col">

      {/* LOGO */}
      <div className="rounded-[35px] border border-white/10 bg-white/5 p-5 text-center">

        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-900 to-green-700 flex items-center justify-center mx-auto text-5xl font-black">

          TAJ

        </div>

        <h1 className="mt-6 text-5xl font-black bg-gradient-to-r from-orange-300 to-yellow-200 bg-clip-text text-transparent">

          TAJ ERP

        </h1>

        <p className="text-white/40 mt-3 text-lg">
          Factory Management
        </p>

      </div>

      {/* MENU */}
      <div className="flex-1 mt-6 space-y-4 overflow-auto">

        {menuItems.map((item, index) => {

          // CHECK PERMISSION
          if (
            item.permission &&
            !permissions?.[item.permission]
          ) {

            return null;

          }

          return (

            <button
              key={index}
              onClick={() =>
                setActive(item.id)
              }
              className={`w-full flex items-center gap-5 px-5 py-5 rounded-[25px] transition-all text-left ${
                active === item.id
                  ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-2xl"
                  : "bg-white/5 border border-white/5 hover:bg-white/10"
              }`}
            >

              <span className="text-3xl">

                {item.icon}

              </span>

              <span className="text-2xl font-bold">

                {item.label}

              </span>

            </button>

          );

        })}

      </div>

      {/* FOOTER */}
      <div className="mt-6">

        <button
          onClick={handleLogout}
          className="w-full py-5 rounded-[25px] bg-gradient-to-r from-red-600 to-orange-500 text-2xl font-black"
        >
          Logout
        </button>

      </div>

    </div>

  );
}