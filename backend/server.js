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


// Connect Database & Start Server
mongoose
  .connect(process.env.mongoURI)
  .then(() => {
    console.log("Connected to MongoDB successfully");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });
