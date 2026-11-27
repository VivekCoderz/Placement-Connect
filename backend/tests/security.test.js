const request = require("supertest");
const { app } = require("../app");
const User = require("../models/User");
const Student = require("../models/student");
const { __setGoogleClient } = require("../utils/google");
const { connectTestDb, clearTestDb, dropTestDb, bearer, createUser, createStudent } = require("./helpers");

beforeAll(connectTestDb);
afterEach(async () => {
  await clearTestDb();
  delete process.env.GOOGLE_CLIENT_ID;
  __setGoogleClient(null);
});
afterAll(dropTestDb);

const login = (email, password) => request(app).post("/api/auth/login").send({ email, password });

describe("password policy", () => {
  test.each([
    ["short1", "at least 8 characters"],
    ["onlyletters", "letter and one number"],
    ["12345678", "letter and one number"],
  ])("register rejects weak password %s", async (password, message) => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Weak Password",
      email: "weak@example.com",
      password,
      role: "student",
      branch: "CSE",
      year: 4,
      rollNumber: "WEAK1",
      cgpa: 8,
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain(message);
  });
});

describe("account lockout", () => {
  test("locks after 5 wrong passwords, even for the right password, then unlocks", async () => {
    const user = await createUser("student");

    for (let i = 0; i < 4; i += 1) {
      expect((await login(user.email, "wrong-pass-1")).status).toBe(401);
    }
    expect((await login(user.email, "wrong-pass-1")).status).toBe(429);
    expect((await login(user.email, "password123")).status).toBe(429);

    // Lock expires
    await User.updateOne({ _id: user._id }, { lockUntil: new Date(Date.now() - 1000) });
    expect((await login(user.email, "password123")).status).toBe(200);
  });

  test("a successful login resets the failure counter", async () => {
    const user = await createUser("student");
    for (let i = 0; i < 3; i += 1) await login(user.email, "wrong-pass-1");
    expect((await login(user.email, "password123")).status).toBe(200);
    const fresh = await User.findById(user._id);
    expect(fresh.failedLoginAttempts).toBe(0);
  });
});

describe("session revocation", () => {
  test("changing the password revokes older tokens and returns a working new one", async () => {
    const user = await createUser("student");
    const oldAuth = bearer(user);

    const res = await request(app)
      .put("/api/auth/change-password")
      .set(oldAuth)
      .send({ oldPassword: "password123", newPassword: "newPassword456" });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeTruthy();

    expect((await request(app).get("/api/auth/me").set(oldAuth)).status).toBe(401);
    const withNew = await request(app).get("/api/auth/me").set({ Authorization: `Bearer ${res.body.data.token}` });
    expect(withNew.status).toBe(200);
    expect(withNew.body.data.user.password).toBeUndefined();
    expect(withNew.body.data.user.tokenVersion).toBeUndefined();
  });

  test("logout-all revokes every token", async () => {
    const user = await createUser("student");
    const auth = bearer(user);
    expect((await request(app).post("/api/auth/logout-all").set(auth)).status).toBe(200);
    expect((await request(app).get("/api/auth/me").set(auth)).status).toBe(401);
  });

  test("tokens signed with another algorithm are rejected", async () => {
    const jwt = require("jsonwebtoken");
    const user = await createUser("student");
    const token = jwt.sign({ id: user._id, role: user.role, tv: 0 }, process.env.JWT_SECRET, { algorithm: "HS512" });
    expect((await request(app).get("/api/auth/me").set({ Authorization: `Bearer ${token}` })).status).toBe(401);
  });
});

describe("NoSQL operator injection", () => {
  test("operator objects in the body are stripped before reaching queries", async () => {
    await createUser("student");
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: { $ne: null } });
    expect(res.status).toBe(400);
  });
});

describe("continue with Google", () => {
  const stubGoogle = (payload) => {
    process.env.GOOGLE_CLIENT_ID = "test-client.apps.googleusercontent.com";
    __setGoogleClient({
      verifyIdToken: async ({ idToken, audience }) => {
        if (idToken !== "valid-google-credential-xxxxxxxx" || audience !== process.env.GOOGLE_CLIENT_ID) {
          throw new Error("bad token");
        }
        return { getPayload: () => payload };
      },
    });
  };
  const CREDENTIAL = "valid-google-credential-xxxxxxxx";
  const googlePayload = (overrides = {}) => ({
    sub: "google-sub-123",
    email: "Google.User@Example.com",
    email_verified: true,
    name: "Google User",
    ...overrides,
  });

  test("returns 503 when Google sign-in is not configured", async () => {
    const res = await request(app).post("/api/auth/google").send({ credential: CREDENTIAL });
    expect(res.status).toBe(503);
  });

  test("rejects an invalid credential", async () => {
    stubGoogle(googlePayload());
    const res = await request(app).post("/api/auth/google").send({ credential: "forged-credential-xxxxxxxxxxxx" });
    expect(res.status).toBe(401);
  });

  test("rejects unverified Google emails", async () => {
    stubGoogle(googlePayload({ email_verified: false }));
    const res = await request(app).post("/api/auth/google").send({ credential: CREDENTIAL });
    expect(res.status).toBe(401);
  });

  test("unknown email asks the client to finish registration and creates nothing", async () => {
    stubGoogle(googlePayload());
    const res = await request(app).post("/api/auth/google").send({ credential: CREDENTIAL });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ needsRegistration: true, email: "google.user@example.com" });
    expect(await User.countDocuments()).toBe(0);
  });

  test("register with Google uses the Google email, then Google login works", async () => {
    stubGoogle(googlePayload());
    const reg = await request(app).post("/api/auth/register").send({
      name: "Google User",
      email: "attacker-chosen@example.com",
      googleCredential: CREDENTIAL,
      role: "student",
      branch: "CSE",
      year: 4,
      rollNumber: "G123",
      cgpa: 8.2,
    });
    expect(reg.status).toBe(201);

    const user = await User.findOne({ googleId: "google-sub-123" });
    expect(user.email).toBe("google.user@example.com");
    expect(user.password).toBeUndefined();
    expect(await Student.countDocuments({ email: "google.user@example.com" })).toBe(1);

    const res = await request(app).post("/api/auth/google").send({ credential: CREDENTIAL });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeTruthy();
    expect(res.headers["set-cookie"].join(";")).toMatch(/HttpOnly/i);

    // A Google-only account cannot be used with an empty / guessed password.
    expect((await login("google.user@example.com", "anything123")).status).toBe(401);
  });

  test("links Google to an existing account with the same verified email", async () => {
    const { user } = await createStudent();
    stubGoogle(googlePayload({ email: user.email, sub: "google-sub-link" }));
    const res = await request(app).post("/api/auth/google").send({ credential: CREDENTIAL });
    expect(res.status).toBe(200);
    expect((await User.findById(user._id)).googleId).toBe("google-sub-link");
  });

  test("refuses an account already linked to a different Google identity", async () => {
    const user = await createUser("student", { googleId: "someone-else" });
    stubGoogle(googlePayload({ email: user.email }));
    const res = await request(app).post("/api/auth/google").send({ credential: CREDENTIAL });
    expect(res.status).toBe(401);
  });

  test("pending companies still cannot sign in with Google", async () => {
    const user = await createUser("company", { isApproved: false });
    stubGoogle(googlePayload({ email: user.email }));
    const res = await request(app).post("/api/auth/google").send({ credential: CREDENTIAL });
    expect(res.status).toBe(403);
  });
});
