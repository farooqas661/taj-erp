export default function Topbar({ title = "Dashboard" }) {

    return (
  
      <div className="rounded-[30px] border border-white/10 bg-white/5 backdrop-blur-3xl p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 overflow-hidden relative">
  
        {/* Glow */}
        <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-orange-500/20 blur-[120px] rounded-full"></div>
  
        {/* LEFT */}
        <div className="relative z-10">
  
          <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-white via-orange-100 to-orange-300 bg-clip-text text-transparent">
            {title}
          </h1>
  
          <p className="mt-2 text-white/50 text-sm md:text-base">
            Welcome back to TAJ ERP
          </p>
  
        </div>
  
        {/* RIGHT */}
        <div className="relative z-10 flex items-center gap-3 flex-wrap">
  
          {/* Search */}
          <input
            type="text"
            placeholder="Search..."
            className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none text-sm w-full md:w-[220px]"
          />
  
          {/* Notification */}
          <button className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl hover:bg-white/10 transition-all">
            🔔
          </button>
  
          {/* Online */}
          <div className="px-4 py-3 rounded-2xl bg-green-500/20 border border-green-500/20 text-green-300 text-sm font-semibold">
            Online
          </div>
  
          {/* Profile */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/10">
  
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-xl font-bold">
              A
            </div>
  
            <div>
  
              <h1 className="font-bold text-sm md:text-base">
                Admin
              </h1>
  
              <p className="text-white/40 text-xs md:text-sm">
                Super Admin
              </p>
  
            </div>
  
          </div>
  
        </div>
  
      </div>
  
    );
  }