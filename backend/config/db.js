const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const connUri = process.env.MONGO_URI || process.env.mongoURI;
    if (!connUri) {
      console.error("Error: mongoURI / MONGO_URI is not defined in environment variables");
      process.exit(1);
    }
    const conn = await mongoose.connect(connUri);
    console.log(`Connected to MongoDB successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
