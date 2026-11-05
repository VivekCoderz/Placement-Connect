const request = require("supertest");
const { app } = require("../app");
const Student = require("../models/student");
const { connectTestDb, clearTestDb, dropTestDb, bearer, createUser, createStudent } = require("./helpers");

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(dropTestDb);

describe("academic fields are locked for students", () => {
  test("a student cannot change their own CGPA", async () => {
    const { user, student } = await createStudent({ cgpa: 6.2 });
    const res = await request(app).put("/api/students/updateCgpa").set(bearer(user)).send({ cgpa: 9.9 });
    expect(res.status).toBe(403);
    expect((await Student.findById(student._id)).cgpa).toBe(6.2);
  });

  test("re-sending the unchanged CGPA is a harmless no-op (current profile form)", async () => {
    const { user } = await createStudent({ cgpa: 6.2 });
    const res = await request(app).put("/api/students/updateCgpa").set(bearer(user)).send({ cgpa: 6.2 });
    expect(res.status).toBe(200);
  });

  test("a student cannot change their own branch, year or roll number", async () => {
    const { user, student } = await createStudent({ branch: "ME", year: 3 });
    for (const body of [{ branch: "CSE" }, { year: 4 }, { rollNumber: "NEW-ROLL" }]) {
      const res = await request(app).put("/api/students/updateBranchYearRollNumber").set(bearer(user)).send(body);
      expect(res.status).toBe(403);
    }
    const fresh = await Student.findById(student._id);
    expect(fresh.branch).toBe("ME");
    expect(fresh.year).toBe(3);
    expect(fresh.rollNumber).toBe(student.rollNumber);

    const same = await request(app)
      .put("/api/students/updateBranchYearRollNumber")
      .set(bearer(user))
      .send({ branch: "ME", year: 3, rollNumber: student.rollNumber });
    expect(same.status).toBe(200);
  });

  test("placementCell can update a student's academic record; students cannot use that endpoint", async () => {
    const { user, student } = await createStudent({ cgpa: 6.2 });
    const cell = await createUser("placementCell");

    const denied = await request(app)
      .put(`/api/admin/students/${student._id}/academic`)
      .set(bearer(user))
      .send({ cgpa: 9.9 });
    expect(denied.status).toBe(403);

    const ok = await request(app)
      .put(`/api/admin/students/${student._id}/academic`)
      .set(bearer(cell))
      .send({ cgpa: 8.4, branch: "IT" });
    expect(ok.status).toBe(200);
    const fresh = await Student.findById(student._id);
    expect(fresh.cgpa).toBe(8.4);
    expect(fresh.branch).toBe("IT");
  });
});

describe("profile updates", () => {
  test("certifications sent as strings are accepted and stored as objects", async () => {
    const { user, student } = await createStudent();
    const res = await request(app)
      .put("/api/students/profile")
      .set(bearer(user))
      .send({ skills: ["React"], projects: [], certifications: ["AWS Cloud Practitioner", "  CCNA  "] });
    expect(res.status).toBe(200);
    const fresh = await Student.findById(student._id);
    expect(fresh.certifications.map((c) => c.title)).toEqual(["AWS Cloud Practitioner", "CCNA"]);
  });

  test("certifications sent as objects are still accepted", async () => {
    const { user, student } = await createStudent();
    const res = await request(app)
      .put("/api/students/profile")
      .set(bearer(user))
      .send({ certifications: [{ title: "GCP ACE", issuedBy: "Google" }, { name: "OCI Foundations" }] });
    expect(res.status).toBe(200);
    const fresh = await Student.findById(student._id);
    expect(fresh.certifications.map((c) => c.title)).toEqual(["GCP ACE", "OCI Foundations"]);
    expect(fresh.certifications[0].issuedBy).toBe("Google");
  });

  test("profile picture upload is saved on the student", async () => {
    const { user, student } = await createStudent();
    const res = await request(app)
      .post("/api/students/uploadProfilePicture")
      .set(bearer(user))
      .attach("image", Buffer.from([0xff, 0xd8, 0xff, 0xe0]), { filename: "me.jpg", contentType: "image/jpeg" });
    expect(res.status).toBe(200);
    const fresh = await Student.findById(student._id);
    expect(fresh.profilePictureUrl).toBe(res.body.imageUrl);
    expect(fresh.profilePictureUrl).toMatch(/me\.jpg$/);
  });
});
