require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

const runDiagnosis = async () => {
  const uri = process.env.mongoURI || process.env.MONGO_URI;
  if (!uri) {
    console.error("No MongoDB URI found in environment variables");
    return;
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB successfully.");

  const email = `diag_${Date.now()}@test.com`;
  const rawPassword = "password123";

  try {
    // 1. Create a test user
    console.log(`\nCreating test user with email: ${email} and password: ${rawPassword}...`);
    const user = new User({
      name: "Diagnosis User",
      email,
      password: rawPassword,
      role: "student"
    });

    console.log("Pre-save password (should be plain text):", user.password);
    
    // Save to trigger pre-save hook
    await user.save();
    console.log("Post-save password (should be hashed):", user.password);

    // 2. Fetch the user back from database
    const fetchedUser = await User.findOne({ email });
    console.log("Fetched password hash from DB:", fetchedUser.password);

    // 3. Test comparison
    const isMatch = await fetchedUser.comparePassword(rawPassword);
    console.log(`Comparison result for '${rawPassword}':`, isMatch);

    // 4. Test wrong password
    const isWrongMatch = await fetchedUser.comparePassword("wrong_password");
    console.log("Comparison result for wrong password:", isWrongMatch);

    // Clean up test user
    await User.deleteOne({ _id: fetchedUser._id });
    console.log("Cleaned up diagnosis test user.");
    
  } catch (err) {
    console.error("Diagnosis error:", err);
  } finally {
    await mongoose.disconnect();
  }
};

runDiagnosis();
