require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();

// CORS configuration - allow credentials and match typical frontend ports
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

const PORT = 5000;

// Import Route Groups
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

// Mount Routes (Backward compatibility + REST API paths)
app.use("/auth", authRoutes); // Compatibility support
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

// Centralized Error Handling Middleware
const errorMiddleware = require("./middleware/errorMiddleware");
app.use(errorMiddleware);

// Socket.io Setup
const http = require("http");
const { Server } = require("socket.io");
const Message = require("./models/message");

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  }
});

io.on("connection", (socket) => {
  socket.on("join", (userId) => {
    socket.join(userId);
  });

  socket.on("sendMessage", async ({ senderId, receiverId, message }) => {
    try {
      const newMsg = new Message({ senderId, receiverId, message });
      await newMsg.save();

      // Emit to rooms
      io.to(senderId).emit("message", newMsg);
      io.to(receiverId).emit("message", newMsg);
    } catch (err) {
      console.error("Socket message error:", err);
    }
  });

  socket.on("typing", ({ senderId, receiverId }) => {
    io.to(receiverId).emit("userTyping", { senderId });
  });
});

// Connect Database & Start Server
const connectDB = require("./config/db");
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});

