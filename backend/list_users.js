// Development helper: list users (name, email, role) from a LOCAL database.
// Guarded like the seed script: requires NODE_ENV=development + localhost URI, or --force.
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const { assertSafeTarget } = require("./scripts/guard");

const run = async () => {
  const uri = assertSafeTarget({ scriptName: "list_users", destructive: true });
  await mongoose.connect(uri);

  const users = await User.find({}, "name email role isActive isApproved").lean();
  console.table(users.map(({ _id, ...rest }) => ({ id: String(_id), ...rest })));

  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error("list_users failed:", err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
