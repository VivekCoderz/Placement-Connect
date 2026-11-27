// Holds the Socket.IO server once it is attached, so models/controllers can push live
// events without importing server.js (which would create a require cycle).
let io = null;

const setIO = (server) => {
  io = server;
};

// Every authenticated socket joins a room named after its user id (see socket.js).
const emitToUser = (userId, event, payload) => {
  if (!io || !userId) return;
  try {
    io.to(String(userId)).emit(event, payload);
  } catch (err) {
    console.warn("[realtime] emit failed:", err.message);
  }
};

module.exports = { setIO, emitToUser };
