import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase env vars. Copy .env.example to .env and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
  );
}

export const SESSION_TOKEN_KEY = "erp_session_token";
export const EMPLOYEE_ID_KEY = "employee_id";

export const getSessionToken = () =>
  localStorage.getItem(SESSION_TOKEN_KEY) || "";

export const setSessionToken = (token) => {
  if (token) {
    localStorage.setItem(SESSION_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(SESSION_TOKEN_KEY);
  }
};

export const clearAppSession = () => {
  localStorage.removeItem(SESSION_TOKEN_KEY);
  localStorage.removeItem(EMPLOYEE_ID_KEY);
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    fetch: (url, options = {}) => {
      const headers = new Headers(options.headers || {});
      const token = getSessionToken();

      if (token) {
        headers.set("x-erp-token", token);
      }

      return fetch(url, {
        ...options,
        headers,
      });
    },
  },
});
