// Express application (no network listener here, so tests can import it directly).
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");

const { assertRequiredEnv, isOriginAllowed } = require("./config/env");

assertRequiredEnv();

const app = express();

// Number of reverse proxies in front of the app (Render/Vercel use one). Needed so
// rate limiting sees the real client IP. Defaults to 0 (no proxy) for local runs.
app.set("trust proxy", Number(process.env.TRUST_PROXY || 0));

// CORS: exact allowlist only (CLIENT_URL, plus localhost when not in production).
const checkOrigin = (origin, callback) => {
  // Requests without an Origin header (curl, server-to-server, same-origin) are allowed;
  // they cannot carry a victim's browser cookies cross-site.
  if (!origin) return callback(null, true);
  return callback(null, isOriginAllowed(origin));
};

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

app.use(
  cors({
    origin: checkOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// CSRF defence-in-depth: the auth cookie is SameSite=None, so reject state-changing
// requests that come from a browser page on a non-allowlisted origin.
app.use((req, res, next) => {
  const safeMethod = ["GET", "HEAD", "OPTIONS"].includes(req.method);
  const origin = req.headers.origin;
  if (!safeMethod && origin && !isOriginAllowed(origin)) {
    return res.status(403).json({ success: false, message: "Origin not allowed" });
  }
  return next();
});

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// Route groups
const authRoutes = require("./routes/auth");
const studentRoutes = require("./routes/student");
const jobRoutes = require("./routes/job");
const companyRoutes = require("./routes/company");
const placementRoutes = require("./routes/placement");
const applicationsRoutes = require("./routes/applications");
const analyticsRoutes = require("./routes/analytics");
const notificationsRoutes = require("./routes/notifications");
const adminRoutes = require("./routes/admin");
const chatRoutes = require("./routes/chat");

app.use("/auth", authRoutes); // Backward compatibility
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/placement", placementRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chat", chatRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Centralized error handling (must be last)
const errorMiddleware = require("./middleware/errorMiddleware");
app.use(errorMiddleware);

module.exports = { app, checkOrigin };
