const { rateLimit } = require("express-rate-limit");

// Rate limiting is disabled under NODE_ENV=test unless explicitly enabled,
// so the integration suite can create many accounts quickly.
const skipInTests = () => process.env.NODE_ENV === "test" && process.env.RATE_LIMIT_IN_TESTS !== "true";

const build = ({ windowMs, limit, message }) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skip: skipInTests,
    message: { success: false, message },
  });

// Login / register: 20 attempts per 15 minutes per IP.
const authLimiter = build({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT || 20),
  message: "Too many attempts. Please try again in a few minutes.",
});

// Forgot / reset password: 5 per 15 minutes per IP.
const passwordResetLimiter = build({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.PASSWORD_RESET_RATE_LIMIT || 5),
  message: "Too many password reset requests. Please try again later.",
});

module.exports = { authLimiter, passwordResetLimiter };
