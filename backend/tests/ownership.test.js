const request = require("supertest");
const { app } = require("../app");
const Application = require("../models/application");
const Student = require("../models/student");
const Round = require("../models/Round");
const Job = require("../models/job");
const {
  connectTestDb,
  clearTestDb,
  dropTestDb,
  bearer,
  createUser,
  createStudent,
  createCompany,
  createJob,
  createRound,
  createApplication,
} = require("./helpers");

let ctx;

beforeAll(connectTestDb);
afterAll(dropTestDb);

beforeEach(async () => {
  await clearTestDb();
  global.__mockSendMail.mockClear();
  const a = await createCompany({ name: "Company A" });
  const b = await createCompany({ name: "Company B" });
  const jobA = await createJob(a.company);
  const jobB = await createJob(b.company);
  const roundA1 = await createRound(jobA, 1);
  const roundA2 = await createRound(jobA, 2);
  const roundB1 = await createRound(jobB, 1);
  const { user: studentUser, student } = await createStudent();
  const appA = await createApplication(student, jobA);
  ctx = { a, b, jobA, jobB, roundA1, roundA2, roundB1, student, studentUser, appA };
});

describe("company B cannot touch company A's resources", () => {
  test("PUT /api/applications/:id/status -> 403 and nothing changes", async () => {
    const res = await request(app)
      .put(`/api/applications/${ctx.appA._id}/status`)
      .set(bearer(ctx.b.user))
      .send({ status: "Selected" });
    expect(res.status).toBe(403);
    expect((await Application.findById(ctx.appA._id)).status).toBe("Applied");
    expect((await Student.findById(ctx.student._id)).isPlaced).toBe(false);
  });

  test("issue-offer -> 403", async () => {
    const res = await request(app)
      .put(`/api/applications/${ctx.appA._id}/issue-offer`)
      .set(bearer(ctx.b.user))
      .send({ offerLetterContent: "<p>Offer</p>" });
    expect(res.status).toBe(403);
    expect((await Application.findById(ctx.appA._id)).offerLetterStatus).toBe("None");
  });

  test("override -> 403", async () => {
    const res = await request(app)
      .post(`/api/company/applications/${ctx.appA._id}/override`)
      .set(bearer(ctx.b.user))
      .send({ status: "Rejected", reason: "nope" });
    expect(res.status).toBe(403);
    expect((await Application.findById(ctx.appA._id)).status).toBe("Applied");
  });

  test("create / update / delete round -> 403", async () => {
    const create = await request(app)
      .post(`/api/company/jobs/${ctx.jobA._id}/rounds`)
      .set(bearer(ctx.b.user))
      .send({ name: "Injected Round" });
    expect(create.status).toBe(403);

    const update = await request(app)
      .put(`/api/company/jobs/rounds/${ctx.roundA1._id}`)
      .set(bearer(ctx.b.user))
      .send({ name: "Renamed" });
    expect(update.status).toBe(403);

    const del = await request(app).delete(`/api/company/jobs/rounds/${ctx.roundA1._id}`).set(bearer(ctx.b.user));
    expect(del.status).toBe(403);

    expect(await Round.countDocuments({ jobId: ctx.jobA._id })).toBe(2);
    expect((await Round.findById(ctx.roundA1._id)).name).toBe("Round 1");
  });

  test("manual round results -> 403", async () => {
    const res = await request(app)
      .post(`/api/company/jobs/${ctx.jobA._id}/rounds/${ctx.roundA1._id}/manual-results`)
      .set(bearer(ctx.b.user))
      .send({ results: [{ studentId: String(ctx.student._id), result: "Selected" }] });
    expect(res.status).toBe(403);
  });

  test("submit-shortlist and propose-schedule -> 403", async () => {
    const shortlist = await request(app)
      .post("/api/company/submit-shortlist")
      .set(bearer(ctx.b.user))
      .send({ jobId: String(ctx.jobA._id), roundName: "R1", studentIds: [String(ctx.student._id)] });
    expect(shortlist.status).toBe(403);

    const schedule = await request(app)
      .post("/api/company/propose-schedule")
      .set(bearer(ctx.b.user))
      .send({ jobId: String(ctx.jobA._id), numRounds: 2, scheduleDate: new Date().toISOString(), studentsNeeded: 3 });
    expect(schedule.status).toBe(403);
  });

  test("placement shortlist CSV upload with rejectOthers -> 403", async () => {
    const res = await request(app)
      .post("/api/placement/shortlist/upload")
      .set(bearer(ctx.b.user))
      .field("jobId", String(ctx.jobA._id))
      .field("roundName", "Aptitude")
      .field("rejectOthers", "true")
      .attach("file", Buffer.from("email\nnobody@example.com\n"), { filename: "list.csv", contentType: "text/csv" });
    expect(res.status).toBe(403);
    expect((await Application.findById(ctx.appA._id)).status).toBe("Applied");
  });

  test("bulk action on own job cannot reach another job's application", async () => {
    const res = await request(app)
      .post("/api/company/applications/bulk-action")
      .set(bearer(ctx.b.user))
      .send({ jobId: String(ctx.jobB._id), actionType: "Reject", studentIds: [String(ctx.appA._id)] });
    expect(res.status).toBe(200);
    expect((await Application.findById(ctx.appA._id)).pendingStatus).toBe("None");
  });

  test("a round from another job cannot be used for results", async () => {
    const res = await request(app)
      .post(`/api/company/jobs/${ctx.jobA._id}/rounds/${ctx.roundB1._id}/manual-results`)
      .set(bearer(ctx.a.user))
      .send({ results: [{ studentId: String(ctx.student._id), result: "Selected" }] });
    expect(res.status).toBe(400);
  });
});

describe("owners and staff keep access", () => {
  test("manual override by the owning company succeeds (no more 500) and sends an email", async () => {
    const res = await request(app)
      .post(`/api/company/applications/${ctx.appA._id}/override`)
      .set(bearer(ctx.a.user))
      .send({ status: "Shortlisted", reason: "Strong profile" });
    expect(res.status).toBe(200);
    expect((await Application.findById(ctx.appA._id)).status).toBe("Shortlisted");
    expect(global.__mockSendMail).toHaveBeenCalledTimes(1);
  });

  test("owning company can create a round", async () => {
    const res = await request(app)
      .post(`/api/company/jobs/${ctx.jobA._id}/rounds`)
      .set(bearer(ctx.a.user))
      .send({ name: "System Design" });
    expect(res.status).toBe(201);
    expect((await Job.findById(ctx.jobA._id)).rounds.map((r) => r.name)).toContain("System Design");
  });

  test("placementCell can update any company's application status", async () => {
    const cell = await createUser("placementCell");
    const res = await request(app)
      .put(`/api/applications/${ctx.appA._id}/status`)
      .set(bearer(cell))
      .send({ status: "Shortlisted" });
    expect(res.status).toBe(200);
    expect((await Application.findById(ctx.appA._id)).status).toBe("Shortlisted");
  });
});
