const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

const run = async () => {
  const uri = process.env.mongoURI;
  await mongoose.connect(uri);
  console.log("Connected to database...");

  // Check if admin already exists
  const existingAdmin = await User.findOne({ email: "admin@placementconnect.com" });
  if (!existingAdmin) {
    const admin = new User({
      name: "System Administrator",
      email: "admin@placementconnect.com",
      password: "admin123",
      role: "admin",
      isActive: true
    });
    await admin.save();
    console.log("Admin account created: admin@placementconnect.com / admin123");
  } else {
    console.log("Admin account already exists");
  }

  // Check if placement cell already exists
  const existingCell = await User.findOne({ email: "placementcell@placementconnect.com" });
  if (!existingCell) {
    const cell = new User({
      name: "Placement Cell Coordinator",
      email: "placementcell@placementconnect.com",
      password: "cell123",
      role: "placementCell",
      isActive: true
    });
    await cell.save();
    console.log("Placement Cell account created: placementcell@placementconnect.com / cell123");
  } else {
    console.log("Placement Cell already exists");
  }

  await mongoose.disconnect();
};

run().catch(console.error);
