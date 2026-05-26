import Topbar from "../components/Topbar";

export default function Dashboard() {

  const cards = [
    {
      title: "Employees",
      value: "124",
      icon: "👨‍💼",
      color: "from-orange-500 to-red-600",
    },
    {
      title: "Production",
      value: "89%",
      icon: "🏭",
      color: "from-green-500 to-green-700",
    },
    {
      title: "Orders",
      value: "56",
      icon: "🚚",
      color: "from-yellow-500 to-orange-500",
    },
    {
      title: "Revenue",
      value: "₹4.8L",
      icon: "💰",
      color: "from-pink-500 to-red-600",
    },
  ];

  return (

    <div>

      {/* TOPBAR */}
      <Topbar title="Dashboard" />

      {/* CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mt-6">

        {cards.map((card, index) => (

          <div
            key={index}
            className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/5 backdrop-blur-3xl p-4 md:p-5 hover:scale-[1.02] transition-all duration-300 min-h-[220px]"
          >

            {/* Glow */}
            <div className={`absolute top-[-60px] right-[-60px] w-[180px] h-[180px] rounded-full bg-gradient-to-r ${card.color} opacity-20 blur-[120px]`}></div>

            <div className="relative z-10">

              {/* Icon */}
              <div className={`w-16 h-16 md:w-20 md:h-20 rounded-[25px] bg-gradient-to-br ${card.color} flex items-center justify-center text-3xl md:text-4xl shadow-2xl`}>

                {card.icon}

              </div>

              {/* Title */}
              <p className="mt-6 text-white/50 text-base md:text-lg">
                {card.title}
              </p>

              {/* Value */}
              <h1 className="mt-2 text-4xl md:text-5xl font-black">
                {card.value}
              </h1>

            </div>

          </div>

        ))}

      </div>

    </div>

  );
}