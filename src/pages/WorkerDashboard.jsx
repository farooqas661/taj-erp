import Topbar from "../components/Topbar";

export default function WorkerDashboard() {

  const cards = [
    {
      title: "Attendance",
      value: "26 Days",
      icon: "🕒",
      color: "from-green-500 to-green-700",
    },
    {
      title: "Shift",
      value: "Morning",
      icon: "🏭",
      color: "from-orange-500 to-red-600",
    },
    {
      title: "Tasks",
      value: "8",
      icon: "📋",
      color: "from-blue-500 to-cyan-600",
    },
    {
      title: "Salary",
      value: "₹18K",
      icon: "💰",
      color: "from-pink-500 to-red-600",
    },
  ];

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

          <div className="rounded-2xl bg-white/5 border border-white/10 p-5 flex items-center justify-between">

            <div>

              <h1 className="font-bold text-lg">
                Packing Section
              </h1>

              <p className="text-white/40 text-sm mt-1">
                8:00 AM - 12:00 PM
              </p>

            </div>

            <div className="px-4 py-2 rounded-xl bg-green-500/20 text-green-300 text-sm font-bold">
              Active
            </div>

          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 p-5 flex items-center justify-between">

            <div>

              <h1 className="font-bold text-lg">
                Inventory Check
              </h1>

              <p className="text-white/40 text-sm mt-1">
                1:00 PM - 3:00 PM
              </p>

            </div>

            <div className="px-4 py-2 rounded-xl bg-orange-500/20 text-orange-300 text-sm font-bold">
              Pending
            </div>

          </div>

        </div>

      </div>

    </div>

  );
}