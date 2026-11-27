// End-to-end placement flow: job -> eligibility -> screening -> rounds (with placement
// cell approval of results) -> selection -> offer (approval) -> student response.
const request = require("supertest");
const { app } = require("../app");
const Application = require("../models/application");
const Student = require("../models/student");
const StudentProgress = require("../models/StudentProgress");
const ResultApproval = require("../models/resultApproval");
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
const { checkEligibility, expectedGraduationYear } = require("../utils/eligibility");

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(dropTestDb);

const placementCell = () => createUser("placementCell");

const submitAndApprove = async ({ recruiter, cell, job, round, studentId, result }) => {
  const submit = await request(app)
    .post(`/api/company/jobs/${job._id}/rounds/${round._id}/manual-results`)
    .set(bearer(recruiter))
    .send({ results: [{ studentId: String(studentId), result, score: 80 }] });
  expect(submit.status).toBe(200);
  expect(submit.body.status).toBe("Pending Approval");

  const approval = await ResultApproval.findOne({ jobId: job._id, roundId: round._id, status: "Pending Approval" });
  return request(app).post(`/api/placement/result-approvals/${approval._id}/approve`).set(bearer(cell));
};

describe("eligibility", () => {
  test("list, detail and apply agree, and explain why a student is ineligible", async () => {
    const { company } = await createCompany();
    const job = await createJob(company, { eligibility: { cgpa: 9, branches: ["CSE"], years: [4] } });
    const { user } = await createStudent({ cgpa: 7.5 });

    const list = await request(app).get("/api/jobs").set(bearer(user));
    const listed = list.body.jobs.find((j) => j._id === String(job._id));
    expect(listed.eligible).toBe(false);
    expect(listed.ineligibleReasons.join(" ")).toMatch(/Minimum CGPA is 9/);

    const detail = await request(app).get(`/api/jobs/${job._id}`).set(bearer(user));
    expect(detail.body.job.eligible).toBe(false);

    const apply = await request(app).post(`/api/jobs/${job._id}/apply`).set(bearer(user));
    expect(apply.status).toBe(400);
    expect(apply.body.message).toMatch(/CGPA/);
  });

  test("graduation-year jobs match the right academic year, including year 1", () => {
    const now = new Date("2026-11-27");
    const job = (years) => ({ status: "active", deadline: new Date("2027-01-01"), eligibility: { cgpa: 0, branches: [], years } });
    expect(expectedGraduationYear(4, now)).toBe(2027);
    expect(checkEligibility({ cgpa: 8, branch: "CSE", year: 4 }, job([2027]), { now }).eligible).toBe(true);
    expect(checkEligibility({ cgpa: 8, branch: "CSE", year: 1 }, job([2030]), { now }).eligible).toBe(true);
    expect(checkEligibility({ cgpa: 8, branch: "CSE", year: 3 }, job([2027]), { now }).eligible).toBe(false);
  });

  test("a placed student cannot apply again", async () => {
    const { company } = await createCompany();
    const job = await createJob(company);
    const { user } = await createStudent({ isPlaced: true, resumeUrl: "https://res.cloudinary.test/cv.pdf" });
    const res = await request(app).post(`/api/jobs/${job._id}/apply`).set(bearer(user));
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already accepted a placement offer/);
  });
});

describe("job posting", () => {
  test("rejects past deadlines and invalid openings", async () => {
    const { user } = await createCompany();
    const base = {
      title: "SDE",
      description: "Build",
      package: 10,
      eligibility: { cgpa: 6, branches: ["CSE"], years: [4] },
      deadline: new Date(Date.now() + 86400000).toISOString(),
    };
    const past = await request(app).post("/api/company/jobs").set(bearer(user)).send({ ...base, deadline: "2020-01-01" });
    expect(past.status).toBe(400);
    const zero = await request(app).post("/api/company/jobs").set(bearer(user)).send({ ...base, numOpenings: 0 });
    expect(zero.status).toBe(400);
  });

  test("companies only see their own jobs", async () => {
    const a = await createCompany();
    const b = await createCompany();
    await createJob(a.company);
    await createJob(b.company);
    const res = await request(app).get("/api/jobs").set(bearer(a.user));
    expect(res.body.jobs).toHaveLength(1);
  });
});

describe("rounds and result approval", () => {
  test("ATS shortlist moves screened candidates into round 1", async () => {
    const { user: recruiter, company } = await createCompany();
    const job = await createJob(company);
    const round1 = await createRound(job, 1);
    const { student } = await createStudent();
    const application = await createApplication(student, job, { status: "Under Review" });
    await StudentProgress.create({ applicationId: application._id, studentId: student._id, jobId: job._id });

    const res = await request(app)
      .post(`/api/company/jobs/${job._id}/ats-shortlist`)
      .set(bearer(recruiter))
      .send({ threshold: 0 });
    expect(res.body.shortlistedCount).toBe(1);

    const progress = await StudentProgress.findOne({ applicationId: application._id });
    expect(String(progress.currentRoundId)).toBe(String(round1._id));
    const fresh = await Application.findById(application._id);
    expect(fresh.status).toBe("Shortlisted");
    expect(fresh.rounds.some((r) => r.name === round1.name && r.result === "Pending")).toBe(true);
  });

  test("results wait for placement cell approval, then advance the candidate", async () => {
    const { user: recruiter, company } = await createCompany();
    const cell = await placementCell();
    const job = await createJob(company);
    const round1 = await createRound(job, 1);
    const round2 = await createRound(job, 2);
    const { student } = await createStudent();
    const application = await createApplication(student, job, { status: "Shortlisted" });

    const approve1 = await submitAndApprove({ recruiter, cell, job, round: round1, studentId: student._id, result: "Selected" });
    expect(approve1.status).toBe(200);
    expect(approve1.body.applied).toBe(1);
    expect((await Application.findById(application._id)).status).toBe("Round2");

    const approve2 = await submitAndApprove({ recruiter, cell, job, round: round2, studentId: student._id, result: "Selected" });
    expect(approve2.body.applied).toBe(1);
    expect((await Application.findById(application._id)).status).toBe("Selected");
    // Selected is not placed: that only happens when the student accepts an offer.
    expect((await Student.findById(student._id)).isPlaced).toBe(false);
  });

  test("a rejected applicant cannot be marked selected in a later round", async () => {
    const { user: recruiter, company } = await createCompany();
    const cell = await placementCell();
    const job = await createJob(company);
    await createRound(job, 1);
    const finalRound = await createRound(job, 2);
    const { student } = await createStudent();
    await createApplication(student, job, { status: "Rejected" });

    const res = await submitAndApprove({ recruiter, cell, job, round: finalRound, studentId: student._id, result: "Selected" });
    expect(res.body.applied).toBe(0);
    expect(res.body.skipped[0]).toMatch(/already Rejected/);
    expect((await Student.findById(student._id)).isPlaced).toBe(false);
  });

  test("a candidate cannot skip straight to the final round", async () => {
    const { user: recruiter, company } = await createCompany();
    const cell = await placementCell();
    const job = await createJob(company);
    await createRound(job, 1);
    const finalRound = await createRound(job, 2);
    const { student } = await createStudent();
    await createApplication(student, job, { status: "Shortlisted" });

    const res = await submitAndApprove({ recruiter, cell, job, round: finalRound, studentId: student._id, result: "Selected" });
    expect(res.body.applied).toBe(0);
    expect(res.body.skipped[0]).toMatch(/not in the/);
  });
});

describe("offer lifecycle", () => {
  const setup = async () => {
    const { user: recruiter, company } = await createCompany();
    const cell = await placementCell();
    const job = await createJob(company);
    const { user: studentUser, student } = await createStudent();
    const application = await createApplication(student, job, { status: "Selected" });
    return { recruiter, cell, company, job, studentUser, student, application };
  };

  const issue = (recruiter, application) =>
    request(app)
      .put(`/api/applications/${application._id}/issue-offer`)
      .set(bearer(recruiter))
      .send({ offerLetterContent: "<p>Offer: 10 LPA</p>" });

  test("offers only go to selected candidates", async () => {
    const { recruiter, application } = await setup();
    await Application.updateOne({ _id: application._id }, { status: "Round2" });
    expect((await issue(recruiter, application)).status).toBe(400);
  });

  test("student sees the offer only after approval, then accepts and is placed", async () => {
    const { recruiter, cell, studentUser, student, application } = await setup();
    expect((await issue(recruiter, application)).status).toBe(200);

    const before = await request(app).get("/api/applications/my-applications").set(bearer(studentUser));
    expect(before.body.applications[0].offerLetterContent).toBeUndefined();
    expect(before.body.applications[0].offerLetterStatus).toBe("Pending Approval");

    // Cannot respond before approval
    const early = await request(app)
      .put(`/api/applications/${application._id}/offer-response`)
      .set(bearer(studentUser))
      .send({ decision: "Accept" });
    expect(early.status).toBe(400);

    const approve = await request(app).put(`/api/applications/${application._id}/approve-offer`).set(bearer(cell));
    expect(approve.status).toBe(200);
    expect(new Date(approve.body.application.offerDeadline) > new Date()).toBe(true);
    // Approving twice is refused
    expect((await request(app).put(`/api/applications/${application._id}/approve-offer`).set(bearer(cell))).status).toBe(400);

    const after = await request(app).get("/api/applications/my-applications").set(bearer(studentUser));
    expect(after.body.applications[0].offerLetterContent).toContain("10 LPA");

    const accept = await request(app)
      .put(`/api/applications/${application._id}/offer-response`)
      .set(bearer(studentUser))
      .send({ decision: "Accept" });
    expect(accept.status).toBe(200);
    const placed = await Student.findById(student._id);
    expect(placed.isPlaced).toBe(true);
    expect(String(placed.placedApplicationId)).toBe(String(application._id));
  });

  test("a student can accept only one offer", async () => {
    const { recruiter, cell, studentUser, student, application } = await setup();
    const other = await createCompany();
    const otherJob = await createJob(other.company);
    const second = await createApplication(student, otherJob, { status: "Selected" });

    for (const [r, a] of [[recruiter, application], [other.user, second]]) {
      expect((await issue(r, a)).status).toBe(200);
      expect((await request(app).put(`/api/applications/${a._id}/approve-offer`).set(bearer(cell))).status).toBe(200);
    }

    const first = await request(app).put(`/api/applications/${application._id}/offer-response`).set(bearer(studentUser)).send({ decision: "Accept" });
    expect(first.status).toBe(200);
    const again = await request(app).put(`/api/applications/${second._id}/offer-response`).set(bearer(studentUser)).send({ decision: "Accept" });
    expect(again.status).toBe(409);
  });

  test("placement cell rejection keeps the reason and the recruiter can resubmit", async () => {
    const { recruiter, cell, application } = await setup();
    await issue(recruiter, application);
    const reject = await request(app)
      .put(`/api/applications/${application._id}/reject-offer`)
      .set(bearer(cell))
      .send({ reason: "Wrong CTC" });
    expect(reject.status).toBe(200);
    expect((await Application.findById(application._id)).offerRejectionReason).toBe("Wrong CTC");
    expect((await issue(recruiter, application)).status).toBe(200);
  });
});

describe("withdrawal", () => {
  test("student can withdraw an in-progress application but not a selected one", async () => {
    const { company } = await createCompany();
    const job = await createJob(company);
    const { user, student } = await createStudent();
    const open = await createApplication(student, job, { status: "Under Review" });

    const res = await request(app).put(`/api/applications/${open._id}/withdraw`).set(bearer(user));
    expect(res.status).toBe(200);
    expect((await Application.findById(open._id)).status).toBe("Withdrawn");

    const otherJob = await createJob(company);
    const selected = await createApplication(student, otherJob, { status: "Selected" });
    expect((await request(app).put(`/api/applications/${selected._id}/withdraw`).set(bearer(user))).status).toBe(400);
  });

  test("students cannot withdraw someone else's application", async () => {
    const { company } = await createCompany();
    const job = await createJob(company);
    const { student } = await createStudent();
    const { user: mallory } = await createStudent();
    const application = await createApplication(student, job);
    const res = await request(app).put(`/api/applications/${application._id}/withdraw`).set(bearer(mallory));
    expect(res.status).toBe(404);
  });
});
