const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

const run = async () => {
  const uri = process.env.mongoURI;
  if (!uri) {
    console.error("mongoURI environment variable not found in .env");
    return;
  }
  await mongoose.connect(uri);
  console.log("Connected. Fetching users...");
  
  const users = await User.find({}, "name email role");
  console.log("USERS_LIST_START");
  console.log(JSON.stringify(users, null, 2));
  console.log("USERS_LIST_END");
  
  await mongoose.disconnect();
};

run().catch(console.error);
