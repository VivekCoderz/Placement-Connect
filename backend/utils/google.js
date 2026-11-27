// Verifies Google Identity Services ID tokens ("Sign in with Google").
const { OAuth2Client } = require("google-auth-library");
const ErrorHandler = require("./ErrorHandle");

let client = null;

const getClientId = () => (process.env.GOOGLE_CLIENT_ID || "").trim();

const isGoogleAuthEnabled = () => Boolean(getClientId());

/**
 * Check a Google ID token (the `credential` returned by the Google button) and return
 * the verified identity. Only tokens issued for our own client id, by Google, with a
 * verified email address are accepted.
 */
const verifyGoogleCredential = async (credential) => {
  const clientId = getClientId();
  if (!clientId) {
    throw new ErrorHandler(503, "Google sign-in is not configured on the server");
  }
  if (typeof credential !== "string" || credential.length < 20 || credential.length > 4096) {
    throw new ErrorHandler(400, "Invalid Google credential");
  }

  if (!client) client = new OAuth2Client(clientId);

  let payload;
  try {
    const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
    payload = ticket.getPayload();
  } catch {
    throw new ErrorHandler(401, "Google sign-in failed. Please try again.");
  }

  if (!payload || !payload.sub || !payload.email) {
    throw new ErrorHandler(401, "Google sign-in failed. Please try again.");
  }
  if (payload.email_verified !== true) {
    throw new ErrorHandler(401, "Your Google account email is not verified");
  }

  return {
    googleId: payload.sub,
    email: String(payload.email).trim().toLowerCase(),
    name: payload.name || "",
  };
};

// Test hook: lets tests replace the Google client with a stub.
const __setGoogleClient = (stub) => {
  client = stub;
};

module.exports = { verifyGoogleCredential, isGoogleAuthEnabled, __setGoogleClient };
