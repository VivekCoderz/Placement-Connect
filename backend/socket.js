// Socket.io setup with JWT authentication.
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("./models/User");
const Message = require("./models/message");

const MAX_MESSAGE_LENGTH = 2000;

// Read the JWT from (in order): handshake auth payload, Authorization header, `token` cookie.
const extractToken = (handshake) => {
  if (handshake.auth && typeof handshake.auth.token === "string" && handshake.auth.token) {
    return handshake.auth.token;
  }
  const authHeader = handshake.headers?.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  const cookieHeader = handshake.headers?.cookie;
  if (cookieHeader) {
    for (const part of cookieHeader.split(";")) {
      const [name, ...rest] = part.trim().split("=");
      if (name === "token") return decodeURIComponent(rest.join("="));
    }
  }
  return null;
};

const socketAuth = async (socket, next) => {
  try {
    const token = extractToken(socket.handshake);
    if (!token) return next(new Error("Unauthorized"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("_id role isActive");
    if (!user || !user.isActive) return next(new Error("Unauthorized"));

    socket.user = { id: user._id.toString(), role: user.role };
    return next();
  } catch (err) {
    return next(new Error("Unauthorized"));
  }
};

const attachSocket = (server, { checkOrigin } = {}) => {
  const io = new Server(server, {
    cors: { origin: checkOrigin, credentials: true },
  });

  io.use(socketAuth);

  io.on("connection", (socket) => {
    const userId = socket.user.id;
    // Every user is placed in their own room automatically.
    socket.join(userId);

    // Kept for compatibility with existing clients: only the caller's own room may be joined.
    socket.on("join", (requestedId) => {
      if (requestedId && String(requestedId) === userId) {
        socket.join(userId);
      }
    });

    socket.on("sendMessage", async (payload = {}) => {
      try {
        const { receiverId, message } = payload; // client-sent senderId is ignored
        if (!receiverId || !mongoose.isValidObjectId(receiverId)) return;
        if (typeof message !== "string" || !message.trim()) return;
        if (message.length > MAX_MESSAGE_LENGTH) return;

        const receiverExists = await User.exists({ _id: receiverId });
        if (!receiverExists) return;

        const newMsg = await Message.create({ senderId: userId, receiverId, message: message.trim() });
        io.to(userId).emit("message", newMsg);
        io.to(String(receiverId)).emit("message", newMsg);
      } catch (err) {
        console.error("Socket message error:", err.message);
      }
    });

    socket.on("typing", (payload = {}) => {
      const { receiverId } = payload;
      if (!receiverId || !mongoose.isValidObjectId(receiverId)) return;
      io.to(String(receiverId)).emit("userTyping", { senderId: userId });
    });
  });

  return io;
};

module.exports = { attachSocket, socketAuth, extractToken };
