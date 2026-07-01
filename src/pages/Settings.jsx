import { useEffect, useState } from "react";

import Topbar from "../components/Topbar";

import { supabase } from "../lib/supabase";

const STORAGE_KEY = "taj_erp_settings";

const DEFAULT_SETTINGS = {
  company_name: "TAJ ERP",
  company_phone: "",
  company_address: "",
  working_days: "26",
  shift_start: "08:00",
  shift_end: "17:00",
  currency: "INR",
};

const normalizeTime = (value) => {
  if (!value) return "08:00";

  const text = String(value);

  if (text.includes(":")) {
    return text.slice(0, 5);
  }

  return text;
};

const mapRowToSettings = (data) => ({
  company_name:
    data.company_name || DEFAULT_SETTINGS.company_name,
  company_phone: data.company_phone || "",
  company_address: data.company_address || "",
  working_days: String(
    data.working_days || DEFAULT_SETTINGS.working_days
  ),
  shift_start: normalizeTime(
    data.shift_start || DEFAULT_SETTINGS.shift_start
  ),
  shift_end: normalizeTime(
    data.shift_end || DEFAULT_SETTINGS.shift_end
  ),
  currency: data.currency || DEFAULT_SETTINGS.currency,
});

export default function Settings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [usingLocal, setUsingLocal] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadSettings = async () => {
      const { data, error: fetchError } = await supabase
        .from("app_settings")
        .select("*")
        .order("id", { ascending: true })
        .limit(1);

      if (cancelled) return;

      if (fetchError) {
        const local = localStorage.getItem(STORAGE_KEY);

        if (local) {
          try {
            setSettings(mapRowToSettings(JSON.parse(local)));
            setUsingLocal(true);
            setError(
              "Supabase table missing — using saved local settings. Run app_settings SQL in Supabase."
            );
          } catch {
            setSettings(DEFAULT_SETTINGS);
            setError(fetchError.message);
          }
        } else {
          setSettings(DEFAULT_SETTINGS);
          setError(fetchError.message);
        }

        setLoading(false);
        return;
      }

      const row = data?.[0];

      if (row) {
        setSettingsId(row.id);
        setSettings(mapRowToSettings(row));
        setUsingLocal(false);
        setError("");
      } else {
        setSettings(DEFAULT_SETTINGS);
        setSettingsId(null);
      }

      setLoading(false);
    };

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (e) => {
    setSettings({
      ...settings,
      [e.target.name]: e.target.value,
    });
    setSaved(false);
  };

  const saveSettings = async () => {
    setSaving(true);
    setError("");
    setSaved(false);

    const payload = {
      company_name: settings.company_name,
      company_phone: settings.company_phone,
      company_address: settings.company_address,
      working_days: Number(settings.working_days || 26),
      shift_start: normalizeTime(settings.shift_start),
      shift_end: normalizeTime(settings.shift_end),
      currency: settings.currency,
      updated_at: new Date().toISOString(),
    };

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(payload)
    );

    let saveError;

    if (settingsId) {
      ({ error: saveError } = await supabase
        .from("app_settings")
        .update(payload)
        .eq("id", settingsId));
    } else {
      const { data, error: insertError } = await supabase
        .from("app_settings")
        .insert([payload])
        .select()
        .single();

      saveError = insertError;

      if (data) {
        setSettingsId(data.id);
        setUsingLocal(false);
      }
    }

    setSaving(false);

    if (saveError) {
      setUsingLocal(true);
      setError(
        "Saved locally. Supabase error: " + saveError.message
      );
      setSaved(true);
      return;
    }

    setUsingLocal(false);
    setError("");
    setSaved(true);
  };

  return (
    <div>
      <Topbar title="Settings" />

      <div className="mt-6 rounded-[35px] border border-white/10 bg-white/5 backdrop-blur-3xl p-6 md:p-8">
        <h1 className="text-3xl font-black">
          Company Settings
        </h1>
        <p className="mt-2 text-white/50">
          Configure factory details and payroll defaults
        </p>

        {error && (
          <div
            className={`mt-5 rounded-2xl border p-4 ${
              usingLocal
                ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-200"
                : "border-red-500/30 bg-red-500/10 text-red-200"
            }`}
          >
            {error}
          </div>
        )}

        {saved && (
          <div className="mt-5 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-green-200">
            {usingLocal
              ? "Settings saved on this device."
              : "Settings saved successfully."}
          </div>
        )}

        {loading ? (
          <p className="mt-6 text-white/40">
            Loading settings...
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">
              <input
                name="company_name"
                value={settings.company_name}
                onChange={handleChange}
                placeholder="Company Name"
                className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
              />

              <input
                name="company_phone"
                value={settings.company_phone}
                onChange={handleChange}
                placeholder="Company Phone"
                className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
              />

              <input
                name="company_address"
                value={settings.company_address}
                onChange={handleChange}
                placeholder="Company Address"
                className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none md:col-span-2"
              />

              <input
                name="working_days"
                type="number"
                min="1"
                max="31"
                value={settings.working_days}
                onChange={handleChange}
                placeholder="Working Days Per Month"
                className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
              />

              <select
                name="currency"
                value={settings.currency}
                onChange={handleChange}
                className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
              </select>

              <input
                type="time"
                name="shift_start"
                value={settings.shift_start}
                onChange={handleChange}
                className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
              />

              <input
                type="time"
                name="shift_end"
                value={settings.shift_end}
                onChange={handleChange}
                className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none"
              />
            </div>

            <button
              onClick={saveSettings}
              disabled={saving}
              className="mt-8 px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 font-bold text-lg"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
