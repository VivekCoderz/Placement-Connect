// Central place for reading/validating environment configuration.

const REQUIRED_VARS = ["JWT_SECRET"];

// Fail fast if a required variable is missing. Called when the app module loads.
const assertRequiredEnv = () => {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key] || !String(process.env[key]).trim());
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(", ")}. See backend/.env.example.`,
    );
  }
};

const isProduction = () => process.env.NODE_ENV === "production";

const splitList = (value) =>
  (value || "")
    .split(",")
    .map((item) => item.trim().replace(/\/+$/, ""))
    .filter(Boolean);

const DEV_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

// Exact-match allowlist of browser origins. CLIENT_URL is the canonical variable;
// FRONTEND_URL is still read for backward compatibility with existing deployments.
const getAllowedOrigins = () => {
  const origins = [...splitList(process.env.CLIENT_URL), ...splitList(process.env.FRONTEND_URL)];
  if (!isProduction()) {
    origins.push(...DEV_ORIGINS);
  }
  return [...new Set(origins)];
};

const isOriginAllowed = (origin) => getAllowedOrigins().includes(String(origin).replace(/\/+$/, ""));

// Base URL used to build links in emails (password reset etc.).
const getClientBaseUrl = () => {
  const [first] = [...splitList(process.env.CLIENT_URL), ...splitList(process.env.FRONTEND_URL)];
  return first || "http://localhost:5173";
};

module.exports = {
  assertRequiredEnv,
  isProduction,
  getAllowedOrigins,
  isOriginAllowed,
  getClientBaseUrl,
};
