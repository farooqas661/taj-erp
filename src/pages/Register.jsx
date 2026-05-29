import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Register() {

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    address: "",
    requested_role: "worker",
    password: "",
    selfie: null,
  });

  const handleChange = (e) => {

    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

  };

  const handleRegister = async () => {

    if (
      !form.full_name ||
      !form.phone ||
      !form.password
    ) {

      alert("Please fill all required fields");
      return;

    }

    try {

      setLoading(true);

      let selfieUrl = "";

      if (form.selfie) {

        const fileName =
          Date.now() + "-" + form.selfie.name;

        const { error: uploadError } =
          await supabase.storage
            .from("employee-selfies")
            .upload(fileName, form.selfie);

        if (uploadError) {

          alert(uploadError.message);
          setLoading(false);
          return;

        }

        const { data } =
          supabase.storage
            .from("employee-selfies")
            .getPublicUrl(fileName);

        selfieUrl = data.publicUrl;

      }
      const employeeId =
      "PENDING-" + Date.now();
    
    const { error } = await supabase
      .from("employees")
      .insert([
        {
          employee_id: employeeId,
          full_name: form.full_name,
          phone: form.phone,
          email: form.email,
          address: form.address,
          password: form.password,
          requested_role: form.requested_role,
          selfie_url: selfieUrl,
          registration_status: "pending",
          approval_status: "pending",
          status: "inactive",
        },
      ]);
    
    if (error) {
    
      console.log(error);
    
      alert(error.message);
    
      setLoading(false);
    
      return;
    
    }

      alert(
        "Registration submitted successfully. Waiting for manager/admin approval."
      );

      setForm({
        full_name: "",
        phone: "",
        email: "",
        address: "",
        requested_role: "worker",
        password: "",
        selfie: null,
      });

    } catch (err) {

      alert(err.message);

    }

    setLoading(false);

  };

  return (

    <div className="min-h-screen flex items-center justify-center p-5">

      <div className="w-full max-w-3xl rounded-[35px] border border-white/10 bg-white/5 backdrop-blur-3xl p-8">

        <h1 className="text-5xl font-black mb-8">
          Employee Registration
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          <input
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            placeholder="Full Name"
            className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4"
          />

          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Phone Number"
            className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4"
          />

          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4"
          />

          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Address"
            className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4"
          />

          <select
            name="requested_role"
            value={form.requested_role}
            onChange={handleChange}
            className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4"
          >

            <option value="worker">
              Worker
            </option>

            <option value="manager">
              Manager
            </option>

            <option value="master">
              Master
            </option>

            <option value="supervisor">
              Supervisor
            </option>

            <option value="delivery_boy">
              Delivery Boy
            </option>

            <option value="accountant">
              Accountant
            </option>

          </select>

          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Password"
            className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4"
          />

          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setForm({
                ...form,
                selfie: e.target.files[0],
              })
            }
            className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 md:col-span-2"
          />

        </div>

        <button
          onClick={handleRegister}
          disabled={loading}
          className="mt-8 w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 font-bold"
        >

          {loading
            ? "Submitting..."
            : "Submit For Approval"}

        </button>

      </div>

    </div>

  );
}