import { useEffect, useRef, useState } from "react";

import Topbar from "../components/Topbar";

import { supabase } from "../lib/supabase";

export default function Attendance() {

  const employeeId =
    localStorage.getItem("employee_id");

  const [attendance, setAttendance] = useState([]);

  const [loading, setLoading] = useState(false);

  const [photo, setPhoto] = useState(null);

  const [stream, setStream] = useState(null);

  const videoRef = useRef(null);

  const canvasRef = useRef(null);

  // FETCH ATTENDANCE
  const fetchAttendance = async () => {

    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("employee_id", employeeId)
      .order("id", { ascending: false });

    if (!error && data) {
      setAttendance(data);
    }

  };

  useEffect(() => {

    fetchAttendance();

    startCamera();

  }, []);

  // START CAMERA
  const startCamera = async () => {

    try {

      const mediaStream =
        await navigator.mediaDevices.getUserMedia({
          video: true,
        });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

    } catch (error) {

      console.log(error);

      alert("Camera access denied");

    }

  };

  // TAKE PHOTO
  const capturePhoto = () => {

    const canvas = canvasRef.current;

    const video = videoRef.current;

    const context = canvas.getContext("2d");

    canvas.width = video.videoWidth;

    canvas.height = video.videoHeight;

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const image =
      canvas.toDataURL("image/png");

    setPhoto(image);

    // STOP CAMERA
    if (stream) {

      stream.getTracks().forEach(track =>
        track.stop()
      );

    }

  };

  // GET LOCATION
  const getLocation = () => {

    return new Promise((resolve, reject) => {

      navigator.geolocation.getCurrentPosition(

        (position) => {

          resolve({
            latitude:
              position.coords.latitude,

            longitude:
              position.coords.longitude,
          });

        },

        (error) => reject(error)

      );

    });

  };

  // CHECK IN
  const handleCheckIn = async () => {

    if (!photo) {

      alert("Capture selfie first");

      return;

    }

    setLoading(true);

    let location = {
      latitude: "",
      longitude: "",
    };

    try {

      location = await getLocation();

    } catch (error) {

      console.log(error);

    }

    await supabase
      .from("attendance")
      .insert([
        {
          employee_id: employeeId,
          check_in: new Date(),
          status: "present",
          selfie_url: photo,
          latitude: String(location.latitude),
          longitude: String(location.longitude),
        },
      ]);

    setLoading(false);

    fetchAttendance();

    alert("Checked In Successfully");

  };

  // CHECK OUT
  const handleCheckOut = async () => {

    if (!attendance.length) return;

    setLoading(true);

    const latest = attendance[0];

    await supabase
      .from("attendance")
      .update({
        check_out: new Date(),
      })
      .eq("id", latest.id);

    setLoading(false);

    fetchAttendance();

    alert("Checked Out Successfully");

  };

  return (

    <div>

      {/* TOPBAR */}
      <Topbar title="Attendance" />

      {/* CAMERA */}
      <div className="mt-6 rounded-[35px] border border-white/10 bg-white/5 backdrop-blur-3xl p-6 md:p-8 overflow-hidden relative">

        <div className="absolute top-[-80px] right-[-80px] w-[250px] h-[250px] bg-orange-500/20 blur-[140px] rounded-full"></div>

        <div className="relative z-10">

          <h1 className="text-3xl md:text-4xl font-black mb-6">
            Selfie Verification
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* VIDEO */}
            <div>

              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-[30px] border border-white/10"
              ></video>

              <button
                onClick={capturePhoto}
                className="mt-5 w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 font-bold text-lg"
              >
                Capture Selfie
              </button>

            </div>

            {/* PHOTO */}
            <div className="flex items-center justify-center rounded-[30px] border border-white/10 bg-black/20 min-h-[300px] overflow-hidden">

              {photo ? (

                <img
                  src={photo}
                  alt="Selfie"
                  className="w-full h-full object-cover"
                />

              ) : (

                <p className="text-white/40">
                  No selfie captured
                </p>

              )}

            </div>

          </div>

          <canvas
            ref={canvasRef}
            className="hidden"
          ></canvas>

        </div>

      </div>

      {/* ACTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">

        {/* CHECK IN */}
        <div className="rounded-[35px] border border-white/10 bg-white/5 backdrop-blur-3xl p-8 relative overflow-hidden">

          <div className="absolute top-[-80px] right-[-80px] w-[220px] h-[220px] bg-green-500/20 blur-[120px] rounded-full"></div>

          <div className="relative z-10">

            <h1 className="text-4xl font-black">
              Check In
            </h1>

            <p className="mt-3 text-white/50">
              Start your work shift
            </p>

            <button
              onClick={handleCheckIn}
              disabled={loading}
              className="mt-8 w-full py-4 rounded-2xl bg-gradient-to-r from-green-500 to-green-700 font-bold text-lg hover:scale-[1.02] transition-all"
            >

              {loading ? "Processing..." : "Check In"}

            </button>

          </div>

        </div>

        {/* CHECK OUT */}
        <div className="rounded-[35px] border border-white/10 bg-white/5 backdrop-blur-3xl p-8 relative overflow-hidden">

          <div className="absolute top-[-80px] right-[-80px] w-[220px] h-[220px] bg-red-500/20 blur-[120px] rounded-full"></div>

          <div className="relative z-10">

            <h1 className="text-4xl font-black">
              Check Out
            </h1>

            <p className="mt-3 text-white/50">
              End your work shift
            </p>

            <button
              onClick={handleCheckOut}
              disabled={loading}
              className="mt-8 w-full py-4 rounded-2xl bg-gradient-to-r from-red-500 to-orange-600 font-bold text-lg hover:scale-[1.02] transition-all"
            >

              {loading ? "Processing..." : "Check Out"}

            </button>

          </div>

        </div>

      </div>

      {/* HISTORY */}
      <div className="mt-6 rounded-[35px] border border-white/10 bg-white/5 backdrop-blur-3xl p-6 md:p-8">

        <h1 className="text-3xl font-black mb-6">
          Attendance History
        </h1>

        <div className="space-y-4">

          {attendance.map((item, index) => (

            <div
              key={index}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 flex flex-col gap-4"
            >

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                <div>

                  <h1 className="text-xl font-bold">
                    {item.employee_id}
                  </h1>

                  <p className="text-white/40 mt-1">
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>

                </div>

                <div className="flex flex-col md:items-end gap-2">

                  <div className="text-green-400 font-bold">
                    IN:
                    {" "}
                    {item.check_in
                      ? new Date(item.check_in).toLocaleTimeString()
                      : "--"}
                  </div>

                  <div className="text-red-400 font-bold">
                    OUT:
                    {" "}
                    {item.check_out
                      ? new Date(item.check_out).toLocaleTimeString()
                      : "--"}
                  </div>

                </div>

              </div>

              {/* SELFIE */}
              {item.selfie_url && (

                <img
                  src={item.selfie_url}
                  alt="Attendance Selfie"
                  className="w-40 rounded-2xl border border-white/10"
                />

              )}

              {/* LOCATION */}
              <div className="text-sm text-white/50">

                LAT:
                {" "}
                {item.latitude || "--"}

                {" | "}

                LNG:
                {" "}
                {item.longitude || "--"}

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>

  );
}