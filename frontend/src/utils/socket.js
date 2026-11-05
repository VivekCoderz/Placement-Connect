import { io } from "socket.io-client";
import { API_BASE_URL } from "./api";

/**
 * Create an authenticated socket connection to the backend.
 * The server derives the user's identity from the JWT (cookie or
 * handshake.auth.token), so callers must not send their own user id.
 *
 * Returns the socket; call socket.disconnect() on cleanup.
 */
export const createSocket = ({ onConnectError } = {}) => {
  let token = null;
  try {
    token = localStorage.getItem("token");
  } catch {
    token = null;
  }

  const socket = io(API_BASE_URL, {
    withCredentials: true,
    auth: token ? { token } : {},
    transports: ["websocket", "polling"],
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  // Ask the server to (re)join this user's personal room. No id is sent:
  // the server resolves the user from the verified token.
  socket.on("connect", () => socket.emit("join"));

  socket.on("connect_error", (err) => {
    // Real-time updates are a nice-to-have; never crash the page over them.
    console.warn("Live updates unavailable:", err?.message || err);
    if (onConnectError) onConnectError(err);
  });

  return socket;
};

export default createSocket;
