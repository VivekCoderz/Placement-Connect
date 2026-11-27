// Shared helpers for issuing and checking session JWTs (used by HTTP routes and Socket.IO).
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const COOKIE_NAME = "token";
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// The frontend and API live on different origins in production, so the cookie must be
// SameSite=None (which browsers only accept together with Secure). localhost counts as a
// secure context, so this also works in local development over http.
const cookieOptions = () => ({
  httpOnly: true,
  secure: true,
  sameSite: "None",
  path: "/",
});

const setAuthCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, { ...cookieOptions(), maxAge: COOKIE_MAX_AGE_MS });
};

// clearCookie only works when the attributes match the ones used to set it.
const clearAuthCookie = (res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions());
};

class AuthTokenError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/**
 * Verify a session JWT and return the (password-less) user it belongs to.
 * Throws AuthTokenError(401/403) when the token is invalid, revoked or the account is
 * no longer allowed to sign in.
 */
const verifyAuthToken = async (token, { select = "-password" } = {}) => {
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
  } catch {
    throw new AuthTokenError(401, "Unauthorized: Invalid or expired token");
  }

  const user = await User.findById(decoded.id).select(select);
  if (!user) {
    throw new AuthTokenError(401, "Unauthorized: User no longer exists");
  }

  // Tokens issued before the last password change / "log out everywhere" are revoked.
  // Tokens created before this field existed carry no `tv` and count as version 0.
  if ((decoded.tv || 0) !== (user.tokenVersion || 0)) {
    throw new AuthTokenError(401, "Unauthorized: Session has expired, please sign in again");
  }

  if (!user.isActive) {
    throw new AuthTokenError(403, "Access Denied: Account is deactivated");
  }

  return user;
};

module.exports = {
  COOKIE_NAME,
  setAuthCookie,
  clearAuthCookie,
  verifyAuthToken,
  AuthTokenError,
};
