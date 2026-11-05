const request = require("supertest");
const { app } = require("../app");
const User = require("../models/User");
const Company = require("../models/company");
const {
  connectTestDb,
  clearTestDb,
  dropTestDb,
  bearer,
  createUser,
  createCompany,
} = require("./helpers");

beforeAll(connectTestDb);
afterEach(async () => {
  await clearTestDb();
  global.__mockSendMail.mockReset();
  global.__mockSendMail.mockResolvedValue({ messageId: "test-message-id" });
});
afterAll(dropTestDb);

const baseUser = (overrides = {}) => ({
  name: "Mallory Example",
  email: `mallory.${Date.now()}@example.com`,
  password: "password123",
  ...overrides,
});

describe("registration", () => {
  test.each(["admin", "placementCell"])("self-registration as %s is rejected with 403", async (role) => {
    const body = baseUser({ role });
    const res = await request(app).post("/api/auth/register").send(body);
    expect(res.status).toBe(403);
    expect(await User.countDocuments({ email: body.email })).toBe(0);
  });

  test("unknown roles are rejected with 400", async () => {
    const res = await request(app).post("/api/auth/register").send(baseUser({ role: "superuser" }));
    expect(res.status).toBe(400);
  });

  test("student registration still works", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(baseUser({ role: "student", branch: "CSE", year: 4, rollNumber: "GU-001", cgpa: 8.1 }));
    expect(res.status).toBe(201);
  });

  test("companies register as pending and cannot log in until approved", async () => {
    const body = baseUser({ role: "company", companyName: "Acme Corp" });
    const res = await request(app).post("/api/auth/register").send(body);
    expect(res.status).toBe(201);
    expect(res.body.data.approvalStatus).toBe("pending");

    const user = await User.findOne({ email: body.email });
    const company = await Company.findOne({ recruiterId: user._id });
    expect(user.isApproved).toBe(false);
    expect(company.approved).toBe(false);

    const login = await request(app).post("/api/auth/login").send({ email: body.email, password: body.password });
    expect(login.status).toBe(403);
  });

  test("an unapproved company cannot post jobs", async () => {
    const { user } = await createCompany({ approved: false });
    const res = await request(app)
      .post("/api/company/jobs")
      .set(bearer(user))
      .send({
        title: "SDE",
        description: "desc",
        package: 10,
        eligibility: { cgpa: 6, branches: ["CSE"], years: [4] },
        deadline: new Date(Date.now() + 86400000).toISOString(),
      });
    expect(res.status).toBe(403);
  });
});

describe("staff account creation", () => {
  test("admin can create a placementCell account; other roles cannot", async () => {
    const admin = await createUser("admin");
    const student = await createUser("student");
    const body = { name: "TPO Officer", email: "tpo@example.com", password: "a-long-password", role: "placementCell" };

    const denied = await request(app).post("/api/admin/users").set(bearer(student)).send(body);
    expect(denied.status).toBe(403);

    const ok = await request(app).post("/api/admin/users").set(bearer(admin)).send(body);
    expect(ok.status).toBe(201);
    expect((await User.findOne({ email: "tpo@example.com" })).role).toBe("placementCell");
  });
});

describe("login", () => {
  test("unknown email and wrong password produce the same 401", async () => {
    const user = await createUser("student");
    const unknown = await request(app).post("/api/auth/login").send({ email: "nobody@example.com", password: "x" });
    const wrong = await request(app).post("/api/auth/login").send({ email: user.email, password: "wrong-password" });
    expect(unknown.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(unknown.body).toEqual(wrong.body);
  });
});

describe("forgot-password", () => {
  test("returns the same response for a known and an unknown email", async () => {
    const user = await createUser("student");

    const known = await request(app).post("/api/auth/forgot-password").send({ email: user.email });
    const unknown = await request(app).post("/api/auth/forgot-password").send({ email: "ghost@example.com" });

    expect(known.status).toBe(200);
    expect(unknown.status).toBe(200);
    expect(known.body).toEqual(unknown.body);
    expect(global.__mockSendMail).toHaveBeenCalledTimes(1);
    expect(global.__mockSendMail.mock.calls[0][0].to).toBe(user.email);

    const refreshed = await User.findById(user._id);
    expect(refreshed.resetPasswordToken).toBeTruthy();
  });

  test("an SMTP failure still returns the same response and clears the reset token", async () => {
    const user = await createUser("student");
    global.__mockSendMail.mockRejectedValueOnce(new Error("SMTP down"));

    const res = await request(app).post("/api/auth/forgot-password").send({ email: user.email });
    const unknown = await request(app).post("/api/auth/forgot-password").send({ email: "ghost@example.com" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(unknown.body);
    const refreshed = await User.findById(user._id);
    expect(refreshed.resetPasswordToken).toBeUndefined();
  });
});

describe("rate limiting", () => {
  test("forgot-password is rate limited (429 after 5 requests)", async () => {
    process.env.RATE_LIMIT_IN_TESTS = "true";
    try {
      const statuses = [];
      for (let i = 0; i < 6; i++) {
        const res = await request(app).post("/api/auth/forgot-password").send({ email: "ghost@example.com" });
        statuses.push(res.status);
      }
      expect(statuses.slice(0, 5)).toEqual([200, 200, 200, 200, 200]);
      expect(statuses[5]).toBe(429);
    } finally {
      process.env.RATE_LIMIT_IN_TESTS = "false";
    }
  });
});
