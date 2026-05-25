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

      {/* Header */}
      <div className="rounded-[40px] border border-white/10 bg-white/5 backdrop-blur-[40px] p-8">

        <h1 className="text-6xl font-black bg-gradient-to-r from-white via-orange-100 to-orange-300 bg-clip-text text-transparent">
          TAJ Factory ERP
        </h1>

        <p className="mt-4 text-white/50 text-xl">
          Premium futuristic management dashboard
        </p>

      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-8">

        {cards.map((card, index) => (

          <div
            key={index}
            className="relative overflow-hidden rounded-[35px] border border-white/10 bg-white/5 backdrop-blur-[40px] p-6 hover:scale-[1.03] transition-all duration-300"
          >

            <div className={`absolute top-[-70px] right-[-70px] w-[180px] h-[180px] rounded-full bg-gradient-to-r ${card.color} opacity-30 blur-[100px]`}></div>

            <div className="relative z-10">

              <div className={`w-24 h-24 rounded-[30px] bg-gradient-to-br ${card.color} flex items-center justify-center text-5xl shadow-2xl`}>
                {card.icon}
              </div>

              <p className="mt-8 text-white/50 text-xl">
                {card.title}
              </p>

              <h1 className="mt-2 text-6xl font-black">
                {card.value}
              </h1>

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}