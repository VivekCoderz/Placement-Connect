require("dotenv").config();
const http = require("http");

const { app, checkOrigin } = require("./app");
const { attachSocket } = require("./socket");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = attachSocket(server, { checkOrigin });
app.set("socketio", io);

const start = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

if (require.main === module) {
  start();
}

module.exports = { app, server, io, start };
