const request = require("supertest");
const { app } = require("../app");
const Job = require("../models/job");
const { GENERIC_5XX_MESSAGE } = require("../middleware/errorMiddleware");
const { connectTestDb, clearTestDb, dropTestDb, bearer, createUser, createStudent } = require("./helpers");

beforeAll(connectTestDb);
afterEach(async () => {
  jest.restoreAllMocks();
  await clearTestDb();
});
afterAll(dropTestDb);

describe("error responses", () => {
  test("a 5xx does not leak err.message", async () => {
    const admin = await createUser("admin");
    const secret = "MongoServerError: connection to 10.0.0.7:27017 failed (internal detail)";
    jest.spyOn(Job, "find").mockImplementation(() => {
      throw new Error(secret);
    });
    jest.spyOn(console, "error").mockImplementation(() => {});

    const res = await request(app).get("/api/jobs").set(bearer(admin));

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: GENERIC_5XX_MESSAGE });
    expect(JSON.stringify(res.body)).not.toContain("10.0.0.7");
  });

  test("an invalid ObjectId maps to 400 instead of 500", async () => {
    const admin = await createUser("admin");
    const res = await request(app).get("/api/jobs/not-an-object-id").set(bearer(admin));
    expect(res.status).toBe(400);
  });

  test("a mongoose ValidationError maps to 400", async () => {
    const { user } = await createStudent();
    const res = await request(app)
      .post("/api/students/uploadProject")
      .set(bearer(user))
      .send({ title: "x".repeat(10), techStack: { $bad: 1 } });
    expect([400]).toContain(res.status);
  });

  test("malformed JSON gives 400, unknown routes give JSON 404", async () => {
    const bad = await request(app).post("/api/auth/login").set("Content-Type", "application/json").send("{bad json");
    expect(bad.status).toBe(400);
    const missing = await request(app).get("/api/does-not-exist");
    expect(missing.status).toBe(404);
    expect(missing.body.success).toBe(false);
  });
});

describe("access and config hardening", () => {
  test("placement-stats is limited to admin/placementCell", async () => {
    const { user } = await createStudent();
    const res = await request(app).get("/api/analytics/placement-stats").set(bearer(user));
    expect(res.status).toBe(403);
  });

  test("CORS only reflects allowlisted origins", async () => {
    const good = await request(app).get("/api/does-not-exist").set("Origin", "https://app.example.test");
    expect(good.headers["access-control-allow-origin"]).toBe("https://app.example.test");

    const evil = await request(app)
      .get("/api/does-not-exist")
      .set("Origin", "https://placement-connect.evil.example");
    expect(evil.headers["access-control-allow-origin"]).toBeUndefined();
  });

  test("state-changing requests from a non-allowlisted origin are rejected", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Origin", "https://geeta-university.evil.example")
      .send({ email: "a@example.com", password: "x" });
    expect(res.status).toBe(403);
  });

  test("the app refuses to start without JWT_SECRET", () => {
    const saved = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    try {
      jest.isolateModules(() => {
        expect(() => require("../app")).toThrow(/JWT_SECRET/);
      });
    } finally {
      process.env.JWT_SECRET = saved;
    }
  });

  test("helmet security headers are set", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });
});
