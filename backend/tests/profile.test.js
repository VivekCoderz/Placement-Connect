const request = require("supertest");
const { app } = require("../app");
const Student = require("../models/student");
const User = require("../models/User");
const { connectTestDb, clearTestDb, dropTestDb, bearer, createStudent } = require("./helpers");

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(dropTestDb);

const pdf = () => Buffer.from("%PDF-1.4\n%%EOF");

describe("resume", () => {
  test("upload stores the file name and date, and /me returns them after a reload", async () => {
    const { user, student } = await createStudent();
    const res = await request(app)
      .put("/api/students/resume")
      .set(bearer(user))
      .attach("resume", pdf(), { filename: "Vivek CV.pdf", contentType: "application/pdf" });
    expect(res.status).toBe(200);
    expect(res.body.resumeFileName).toBe("Vivek CV.pdf");

    const fresh = await Student.findById(student._id);
    expect(fresh.resumeUrl).toBeTruthy();
    expect(fresh.resumeUploadedAt).toBeInstanceOf(Date);

    const me = await request(app).get("/api/auth/me").set(bearer(user));
    expect(me.body.data.details.resumeUrl).toBe(fresh.resumeUrl);
    expect(me.body.data.details.resumeFileName).toBe("Vivek CV.pdf");
  });

  test("resume can be removed", async () => {
    const { user, student } = await createStudent();
    await request(app)
      .put("/api/students/resume")
      .set(bearer(user))
      .attach("resume", pdf(), { filename: "cv.pdf", contentType: "application/pdf" });

    const res = await request(app).delete("/api/students/resume").set(bearer(user));
    expect(res.status).toBe(200);
    const fresh = await Student.findById(student._id);
    expect(fresh.resumeUrl).toBeUndefined();
    expect(fresh.resumeFileName).toBeUndefined();
  });
});

describe("profile picture", () => {
  test("can be uploaded and removed", async () => {
    const { user, student } = await createStudent();
    const up = await request(app)
      .post("/api/students/uploadProfilePicture")
      .set(bearer(user))
      .attach("image", Buffer.from([0xff, 0xd8, 0xff, 0xe0]), { filename: "me.png", contentType: "image/png" });
    expect(up.status).toBe(200);

    const del = await request(app).delete("/api/students/profilePicture").set(bearer(user));
    expect(del.status).toBe(200);
    expect((await Student.findById(student._id)).profilePictureUrl).toBeUndefined();
  });
});

describe("profile details", () => {
  test("saves headline, about, phone and links", async () => {
    const { user, student } = await createStudent();
    const body = {
      headline: "MERN developer",
      about: "I build things.",
      phone: "+91 98765 43210",
      linkedinUrl: "https://linkedin.com/in/someone",
      githubUrl: "https://github.com/someone",
      portfolioUrl: "",
    };
    const res = await request(app).put("/api/students/profile").set(bearer(user)).send(body);
    expect(res.status).toBe(200);
    const fresh = await Student.findById(student._id);
    expect(fresh.headline).toBe("MERN developer");
    expect(fresh.githubUrl).toBe("https://github.com/someone");
    expect(fresh.phone).toBe("+91 98765 43210");
  });

  test.each([
    [{ linkedinUrl: "javascript:alert(1)" }],
    [{ githubUrl: "github.com/no-scheme" }],
    [{ phone: "call me maybe" }],
  ])("rejects invalid input %j", async (body) => {
    const { user } = await createStudent();
    const res = await request(app).put("/api/students/profile").set(bearer(user)).send(body);
    expect(res.status).toBe(400);
  });

  test("name can be changed but email cannot", async () => {
    const { user } = await createStudent();
    const ok = await request(app)
      .put("/api/students/updateEmailName")
      .set(bearer(user))
      .send({ name: "New Name", email: user.email });
    expect(ok.status).toBe(200);
    expect((await User.findById(user._id)).name).toBe("New Name");

    const blocked = await request(app)
      .put("/api/students/updateEmailName")
      .set(bearer(user))
      .send({ name: "New Name", email: "someone-else@gmail.com" });
    expect(blocked.status).toBe(403);
    expect((await User.findById(user._id)).email).toBe(user.email);
  });
});

describe("student password change", () => {
  test("uses the strong password policy and revokes old sessions", async () => {
    const { user } = await createStudent();
    const auth = bearer(user);

    const weak = await request(app)
      .put("/api/students/updatePassword")
      .set(auth)
      .send({ oldPassword: "password123", newPassword: "abcdef" });
    expect(weak.status).toBe(400);

    const ok = await request(app)
      .put("/api/students/updatePassword")
      .set(auth)
      .send({ oldPassword: "password123", newPassword: "betterPass9" });
    expect(ok.status).toBe(200);
    expect((await request(app).get("/api/auth/me").set(auth)).status).toBe(401);
  });
});
