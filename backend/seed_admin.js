// Create the first admin account safely.
//
// Usage (credentials come from the environment, never from this file):
//   ADMIN_EMAIL=you@geetauniversity.edu.in ADMIN_PASSWORD='a-long-unique-password' \
//   ADMIN_NAME="System Administrator" npm run seed:admin
//
// The script only creates the account if no user with that email exists; it never
// overwrites or deletes data. Further staff accounts (admin / placementCell) are created
// from the app by an admin via POST /api/admin/users.
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const { assertSafeTarget } = require("./scripts/guard");

const run = async () => {
  const uri = assertSafeTarget({ scriptName: "seed_admin", destructive: false });

  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  const name = (process.env.ADMIN_NAME || "System Administrator").trim();

  if (!email || !password) {
    console.error("ADMIN_EMAIL and ADMIN_PASSWORD must be set (see README).");
    process.exit(1);
  }
  if (password.length < 12) {
    console.error("ADMIN_PASSWORD must be at least 12 characters.");
    process.exit(1);
  }

  await mongoose.connect(uri);

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`A user with email ${email} already exists (role: ${existing.role}). Nothing changed.`);
  } else {
    await User.create({ name, email, password, role: "admin", isActive: true, isApproved: true });
    console.log(`Admin account created for ${email}.`);
  }

  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error("seed_admin failed:", err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
