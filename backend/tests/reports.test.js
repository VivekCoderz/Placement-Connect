const request = require("supertest");
const { app } = require("../app");
const RoundResult = require("../models/RoundResult");
const StudentProgress = require("../models/StudentProgress");
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

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(dropTestDb);

const setup = async () => {
  const { user: recruiter, company } = await createCompany();
  const job = await createJob(company, { title: "SDE Drive" });
  const round1 = await createRound(job, 1, { name: "Coding Test" });
  await createRound(job, 2, { name: "Interview" });

  const { student: asha } = await createStudent({ name: "Asha Verma", phone: "=HYPERLINK(\"http://evil\")" });
  const { student: ravi } = await createStudent({ name: "Ravi Kumar" });
  const { student: meena } = await createStudent({ name: "Meena Joshi" });

  const appAsha = await createApplication(asha, job, { status: "Round2" });
  const appRavi = await createApplication(ravi, job, { status: "Rejected" });
  const appMeena = await createApplication(meena, job, { status: "Shortlisted" });

  await RoundResult.create({ applicationId: appAsha._id, studentId: asha._id, roundId: round1._id, result: "Selected", score: 88 });
  await RoundResult.create({ applicationId: appRavi._id, studentId: ravi._id, roundId: round1._id, result: "Rejected", score: 30 });
  await StudentProgress.create({ applicationId: appMeena._id, studentId: meena._id, jobId: job._id, currentRoundId: round1._id });

  return { recruiter, job, round1 };
};

test("round list shows results (selected first) and candidates still pending", async () => {
  const { recruiter, job, round1 } = await setup();
  const res = await request(app).get(`/api/reports/jobs/${job._id}/list?stage=${round1._id}`).set(bearer(recruiter));
  expect(res.status).toBe(200);
  expect(res.body.rows.map((r) => [r.name, r.result])).toEqual([
    ["Asha Verma", "Selected"],
    ["Meena Joshi", "Pending"],
    ["Ravi Kumar", "Rejected"],
  ]);
  expect(res.body.rows[0].rollNumber).toBeTruthy();
});

test("overview gives the per-round funnel", async () => {
  const { recruiter, job, round1 } = await setup();
  const res = await request(app).get(`/api/reports/jobs/${job._id}`).set(bearer(recruiter));
  expect(res.status).toBe(200);
  const r1 = res.body.rounds.find((r) => r._id === String(round1._id));
  expect(r1).toMatchObject({ selected: 1, rejected: 1, pending: 1, total: 3 });
  expect(res.body.totals.applicants).toBe(3);
});

test("CSV export is spreadsheet-safe", async () => {
  const { recruiter, job, round1 } = await setup();
  const res = await request(app)
    .get(`/api/reports/jobs/${job._id}/list?stage=${round1._id}&format=csv`)
    .set(bearer(recruiter));
  expect(res.status).toBe(200);
  expect(res.headers["content-type"]).toMatch(/text\/csv/);
  expect(res.headers["content-disposition"]).toMatch(/attachment; filename="SDE-Drive_/);
  expect(res.text).toContain('"S.No","Name","Roll No"');
  expect(res.text).toContain(`"'=HYPERLINK(""http://evil"")"`);
});

test("placement cell can see any drive; other companies and students cannot", async () => {
  const { job } = await setup();
  const cell = await createUser("placementCell");
  expect((await request(app).get(`/api/reports/jobs/${job._id}/list?stage=selected`).set(bearer(cell))).status).toBe(200);

  const other = await createCompany();
  expect((await request(app).get(`/api/reports/jobs/${job._id}`).set(bearer(other.user))).status).toBe(403);

  const { user: studentUser } = await createStudent();
  expect((await request(app).get(`/api/reports/jobs/${job._id}`).set(bearer(studentUser))).status).toBe(403);
});
