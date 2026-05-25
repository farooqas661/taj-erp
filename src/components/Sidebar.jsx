export default function Sidebar({ active, setActive }) {

  const menu = [
    ["dashboard", "📊", "Dashboard"],
    ["employees", "👨‍💼", "Employees"],
    ["attendance", "🕒", "Attendance"],
    ["salary", "💰", "Salary"],
    ["stock", "📦", "Stock"],
    ["orders", "🚚", "Orders"],
    ["reports", "📈", "Reports"],
    ["settings", "⚙️", "Settings"],
  ];

  return (
    <div className="w-[300px] p-5">

      <div className="h-full rounded-[40px] border border-white/10 bg-white/5 backdrop-blur-[40px] overflow-hidden relative shadow-2xl">

        {/* Glow */}
        <div className="absolute top-[-100px] left-[-50px] w-[250px] h-[250px] bg-orange-500/20 blur-[100px] rounded-full"></div>

        <div className="relative z-10 p-6 flex flex-col h-full">

          {/* Logo */}
          <div className="flex flex-col items-center">

            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#0f3d1e] to-[#14532d] flex items-center justify-center text-5xl font-black shadow-2xl border border-white/10">
              TAJ
            </div>

            <h1 className="mt-6 text-4xl font-black bg-gradient-to-r from-orange-300 to-yellow-200 bg-clip-text text-transparent">
              TAJ ERP
            </h1>

            <p className="text-white/40 mt-2">
              Factory Management
            </p>

          </div>

          {/* Menu */}
          <div className="mt-10 flex-1 space-y-4">

            {menu.map((item, index) => (

              <button
                key={index}
                onClick={() => setActive(item[0])}
                className={`w-full rounded-2xl px-5 py-4 flex items-center gap-4 transition-all duration-300 ${
                  active === item[0]
                    ? "bg-gradient-to-r from-orange-500 to-red-600 shadow-xl"
                    : "bg-white/5 hover:bg-white/10"
                }`}
              >

                <div className="text-2xl">
                  {item[1]}
                </div>

                <span className="text-lg font-semibold">
                  {item[2]}
                </span>

              </button>

            ))}

          </div>

          {/* Logout */}
          <button className="mt-5 h-14 rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 font-bold text-lg hover:scale-[1.02] transition-all">
            Logout
          </button>

        </div>

      </div>

    </div>
  );
}