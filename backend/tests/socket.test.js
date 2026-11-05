const http = require("http");
const { io: ioClient } = require("socket.io-client");
const { app, checkOrigin } = require("../app");
const { attachSocket } = require("../socket");
const Message = require("../models/message");
const { connectTestDb, clearTestDb, dropTestDb, createUser } = require("./helpers");

let server;
let io;
let url;
const clients = [];

beforeAll(async () => {
  await connectTestDb();
  server = http.createServer(app);
  io = attachSocket(server, { checkOrigin });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  url = `http://127.0.0.1:${server.address().port}`;
});

afterEach(async () => {
  while (clients.length) clients.pop().close();
  await clearTestDb();
});

afterAll(async () => {
  io.close();
  await new Promise((resolve) => server.close(resolve));
  await dropTestDb();
});

const connect = (opts = {}) => {
  const socket = ioClient(url, { transports: ["websocket"], reconnection: false, forceNew: true, ...opts });
  clients.push(socket);
  return socket;
};

const waitFor = (socket, event, ms = 3000) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout waiting for ${event}`)), ms);
    socket.once(event, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });

test("an unauthenticated socket connection is refused", async () => {
  const socket = connect();
  const err = await waitFor(socket, "connect_error");
  expect(err.message).toBe("Unauthorized");
  expect(socket.connected).toBe(false);
});

test("a socket with an invalid token is refused", async () => {
  const socket = connect({ auth: { token: "not-a-jwt" } });
  const err = await waitFor(socket, "connect_error");
  expect(err.message).toBe("Unauthorized");
});

test("authenticated sockets use the token identity, not client-sent ids", async () => {
  const alice = await createUser("student");
  const bob = await createUser("company");
  const mallory = await createUser("student");

  const aliceSocket = connect({ auth: { token: alice.generateToken() } });
  const bobSocket = connect({ extraHeaders: { Authorization: `Bearer ${bob.generateToken()}` } });
  const mallorySocket = connect({ auth: { token: mallory.generateToken() } });
  await Promise.all([waitFor(aliceSocket, "connect"), waitFor(bobSocket, "connect"), waitFor(mallorySocket, "connect")]);

  // Mallory tries to join Bob's room; it must be ignored.
  mallorySocket.emit("join", String(bob._id));
  let malloryReceived = false;
  mallorySocket.on("message", () => {
    malloryReceived = true;
  });

  // Alice spoofs senderId as Mallory; the server must use Alice's real id.
  const received = waitFor(bobSocket, "message");
  aliceSocket.emit("sendMessage", { senderId: String(mallory._id), receiverId: String(bob._id), message: "hello" });
  const msg = await received;

  expect(String(msg.senderId)).toBe(String(alice._id));
  expect(String(msg.receiverId)).toBe(String(bob._id));
  const stored = await Message.findOne({ message: "hello" });
  expect(String(stored.senderId)).toBe(String(alice._id));

  await new Promise((r) => setTimeout(r, 200));
  expect(malloryReceived).toBe(false);
});
