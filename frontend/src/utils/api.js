import axios from "axios";

// Backend base URL. Set VITE_API_URL in frontend/.env (see .env.example).
// Falls back to the local dev server when not set.
export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Attach the JWT stored at login so token-based auth works alongside cookies.
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("token");
    if (token && !config.headers?.Authorization) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // localStorage unavailable: rely on the cookie
  }
  return config;
});

/** Extract a human-readable message from an axios error. */
export const getErrorMessage = (err, fallback = "Something went wrong. Please try again.") =>
  err?.response?.data?.message ||
  err?.response?.data?.error ||
  (err?.request && !err?.response ? "Cannot reach the server. Check your connection and try again." : null) ||
  fallback;

export default api;
