const request = require("supertest");
const { app } = require("../app");
const Student = require("../models/student");
const {
  connectTestDb,
  clearTestDb,
  dropTestDb,
  bearer,
  createUser,
  createStudent,
  createCompany,
  createJob,
} = require("./helpers");

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(dropTestDb);

const MB = 1024 * 1024;

describe("resume upload", () => {
  test("rejects a non-PDF file", async () => {
    const { user, student } = await createStudent();
    const res = await request(app)
      .put("/api/students/resume")
      .set(bearer(user))
      .attach("resume", Buffer.from("MZ fake exe"), { filename: "resume.exe", contentType: "application/octet-stream" });
    expect(res.status).toBe(400);
    expect((await Student.findById(student._id)).resumeUrl).toBeUndefined();
  });

  test("rejects a PDF-named file with the wrong mimetype", async () => {
    const { user } = await createStudent();
    const res = await request(app)
      .put("/api/students/resume")
      .set(bearer(user))
      .attach("resume", Buffer.from("<html></html>"), { filename: "resume.pdf", contentType: "text/html" });
    expect(res.status).toBe(400);
  });

  test("rejects an oversized PDF with 413", async () => {
    const { user } = await createStudent();
    const res = await request(app)
      .put("/api/students/resume")
      .set(bearer(user))
      .attach("resume", Buffer.alloc(5 * MB + 10, 0x20), { filename: "resume.pdf", contentType: "application/pdf" });
    expect(res.status).toBe(413);
  });

  test("accepts a small PDF", async () => {
    const { user, student } = await createStudent();
    const res = await request(app)
      .put("/api/students/resume")
      .set(bearer(user))
      .attach("resume", Buffer.from("%PDF-1.4\n%%EOF"), { filename: "resume.pdf", contentType: "application/pdf" });
    expect(res.status).toBe(200);
    expect((await Student.findById(student._id)).resumeUrl).toMatch(/resume\.pdf$/);
  });
});

describe("CSV uploads", () => {
  test("shortlist upload rejects a non-CSV file", async () => {
    const cell = await createUser("placementCell");
    const { company } = await createCompany();
    const job = await createJob(company);
    const res = await request(app)
      .post("/api/placement/shortlist/upload")
      .set(bearer(cell))
      .field("jobId", String(job._id))
      .field("roundName", "Aptitude")
      .attach("file", Buffer.from("%PDF-1.4"), { filename: "list.pdf", contentType: "application/pdf" });
    expect(res.status).toBe(400);
  });

  test("shortlist upload rejects an oversized CSV with 413", async () => {
    const cell = await createUser("placementCell");
    const { company } = await createCompany();
    const job = await createJob(company);
    const res = await request(app)
      .post("/api/placement/shortlist/upload")
      .set(bearer(cell))
      .field("jobId", String(job._id))
      .field("roundName", "Aptitude")
      .attach("file", Buffer.alloc(1 * MB + 10, 0x61), { filename: "list.csv", contentType: "text/csv" });
    expect(res.status).toBe(413);
  });

  test("profile image upload rejects an SVG", async () => {
    const { user } = await createStudent();
    const res = await request(app)
      .post("/api/students/uploadProfilePicture")
      .set(bearer(user))
      .attach("image", Buffer.from("<svg onload=alert(1)>"), { filename: "x.svg", contentType: "image/svg+xml" });
    expect(res.status).toBe(400);
  });
});
