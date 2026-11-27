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

// Endpoints where a 401 means "wrong credentials", not "session ended".
const AUTH_ENTRY_POINTS = ['/api/auth/login', '/api/auth/google', '/api/auth/register', '/api/auth/me'];

// A 401 elsewhere means the session expired or was revoked (password changed, logged
// out everywhere, account removed): drop the local session and go to the login page.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || '';
    const hadSession = (() => {
      try {
        return Boolean(localStorage.getItem('token') || localStorage.getItem('user'));
      } catch {
        return false;
      }
    })();
    if (status === 401 && hadSession && !AUTH_ENTRY_POINTS.some((path) => url.includes(path))) {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch {
        // ignore
      }
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  },
);

/** Extract a human-readable message from an axios error. */
export const getErrorMessage = (err, fallback = "Something went wrong. Please try again.") =>
  err?.response?.data?.message ||
  err?.response?.data?.error ||
  (err?.request && !err?.response ? "Cannot reach the server. Check your connection and try again." : null) ||
  fallback;

export default api;
