import { useEffect, useState } from "react";

import Topbar from "../components/Topbar";

import { supabase } from "../lib/supabase";

export default function AdminAttendance() {

  const [attendance, setAttendance] = useState([]);

  const [loading, setLoading] = useState(true);

  const [selectedImage, setSelectedImage] = useState(null);

  // FETCH ALL ATTENDANCE
  const fetchAttendance = async () => {

    setLoading(true);

    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .order("id", { ascending: false });

    if (!error && data) {

      setAttendance(data);

    }

    setLoading(false);

  };

  useEffect(() => {

    fetchAttendance();

  }, []);

  // TOTALS
  const totalEmployees = attendance.length;

  const checkedOut = attendance.filter(
    item => item.check_out
  ).length;

  const activeNow =
    totalEmployees - checkedOut;

  return (

    <div>

      {/* TOPBAR */}
      <Topbar title="Admin Attendance Monitor" />

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">

        {/* TOTAL */}
        <div className="rounded-[35px] border border-white/10 bg-white/5 backdrop-blur-3xl p-6 relative overflow-hidden">

          <div className="absolute top-[-60px] right-[-60px] w-[180px] h-[180px] bg-orange-500/20 blur-[120px] rounded-full"></div>

          <div className="relative z-10">

            <p className="text-white/50 text-lg">
              Total Records
            </p>

            <h1 className="text-5xl font-black mt-4">
              {totalEmployees}
            </h1>

          </div>

        </div>

        {/* ACTIVE */}
        <div className="rounded-[35px] border border-white/10 bg-white/5 backdrop-blur-3xl p-6 relative overflow-hidden">

          <div className="absolute top-[-60px] right-[-60px] w-[180px] h-[180px] bg-green-500/20 blur-[120px] rounded-full"></div>

          <div className="relative z-10">

            <p className="text-white/50 text-lg">
              Active Workers
            </p>

            <h1 className="text-5xl font-black mt-4 text-green-400">
              {activeNow}
            </h1>

          </div>

        </div>

        {/* CHECKED OUT */}
        <div className="rounded-[35px] border border-white/10 bg-white/5 backdrop-blur-3xl p-6 relative overflow-hidden">

          <div className="absolute top-[-60px] right-[-60px] w-[180px] h-[180px] bg-red-500/20 blur-[120px] rounded-full"></div>

          <div className="relative z-10">

            <p className="text-white/50 text-lg">
              Checked Out
            </p>

            <h1 className="text-5xl font-black mt-4 text-red-400">
              {checkedOut}
            </h1>

          </div>

        </div>

      </div>

      {/* ATTENDANCE LIST */}
      <div className="mt-6 rounded-[35px] border border-white/10 bg-white/5 backdrop-blur-3xl p-6 md:p-8">

        <div className="flex items-center justify-between mb-6">

          <h1 className="text-3xl font-black">
            Live Attendance
          </h1>

          <button
            onClick={fetchAttendance}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 font-bold"
          >
            Refresh
          </button>

        </div>

        {loading ? (

          <div className="text-white/40">
            Loading attendance...
          </div>

        ) : (

          <div className="space-y-5">

            {attendance.map((item, index) => (

              <div
                key={index}
                className="rounded-[30px] border border-white/10 bg-white/5 p-5 md:p-6"
              >

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">

                  {/* EMPLOYEE */}
                  <div>

                    <h1 className="text-2xl font-black">
                      {item.employee_id}
                    </h1>

                    <p className="text-white/40 mt-2">
                      {new Date(
                        item.created_at
                      ).toLocaleDateString()}
                    </p>

                  </div>

                  {/* TIMES */}
                  <div>

                    <div className="text-green-400 font-bold">
                      IN:
                      {" "}
                      {item.check_in
                        ? new Date(
                            item.check_in
                          ).toLocaleTimeString()
                        : "--"}
                    </div>

                    <div className="text-red-400 font-bold mt-2">
                      OUT:
                      {" "}
                      {item.check_out
                        ? new Date(
                            item.check_out
                          ).toLocaleTimeString()
                        : "ACTIVE"}
                    </div>

                  </div>

                  {/* SELFIE */}
                  <div>

                    {item.selfie_url ? (

                      <img
                        src={item.selfie_url}
                        alt="Attendance"
                        onClick={() =>
                          setSelectedImage(item.selfie_url)
                        }
                        className="w-32 h-32 object-cover rounded-3xl border border-white/10 cursor-pointer hover:scale-105 transition-all"
                      />

                    ) : (

                      <div className="w-32 h-32 rounded-3xl border border-white/10 bg-white/5 flex items-center justify-center text-white/40">
                        No Selfie
                      </div>

                    )}

                  </div>

                  {/* GPS */}
                  <div>

                    <h1 className="text-xl font-bold">
                      GPS Location
                    </h1>

                    <p className="text-white/50 mt-3 break-all">

                      LAT:
                      {" "}
                      {item.latitude || "--"}

                      <br />

                      LNG:
                      {" "}
                      {item.longitude || "--"}

                    </p>

                    <div className={`mt-4 px-4 py-2 rounded-xl inline-block font-bold text-sm ${
                      item.check_out
                        ? "bg-red-500/20 text-red-300"
                        : "bg-green-500/20 text-green-300"
                    }`}>

                      {item.check_out
                        ? "Checked Out"
                        : "Active Now"}

                    </div>

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

      {/* FULL IMAGE VIEWER */}
      {selectedImage && (

        <div className="fixed inset-0 bg-black/90 z-[999] flex items-center justify-center p-5">

          {/* CLOSE */}
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-5 right-5 w-14 h-14 rounded-2xl bg-red-500 text-2xl font-black"
          >
            ✕
          </button>

          {/* IMAGE */}
          <img
            src={selectedImage}
            alt="Full Attendance"
            className="max-w-full max-h-full rounded-[30px] border border-white/10"
          />

        </div>

      )}

    </div>

  );
}