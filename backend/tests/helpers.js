const mongoose = require("mongoose");
const User = require("../models/User");
const Student = require("../models/student");
const Company = require("../models/company");
const Job = require("../models/job");
const Application = require("../models/application");
const Round = require("../models/Round");

const connectTestDb = async () => {
  global.__assertTestDatabase(process.env.MONGO_URI);
  await mongoose.connect(process.env.MONGO_URI);
  // Build unique indexes so duplicate-key behaviour matches production.
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
};

const clearTestDb = async () => {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
};

const dropTestDb = async () => {
  global.__assertTestDatabase(process.env.MONGO_URI);
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
  }
  await mongoose.disconnect();
};

let counter = 0;
const uniq = () => `${Date.now().toString(36)}${(counter++).toString(36)}`;

const bearer = (user) => ({ Authorization: `Bearer ${user.generateToken()}` });

const createUser = async (role, overrides = {}) =>
  User.create({
    name: `Test ${role} ${uniq()}`,
    email: `${role.toLowerCase()}.${uniq()}@example.com`,
    password: "password123",
    role,
    ...overrides,
  });

const createStudent = async (overrides = {}) => {
  const user = await createUser("student");
  const student = await Student.create({
    userId: user._id,
    name: user.name,
    email: user.email,
    branch: "CSE",
    year: 4,
    rollNumber: `ROLL${uniq()}`,
    cgpa: 7.5,
    ...overrides,
  });
  user.profileRef = student._id;
  user.profileModel = "Student";
  await user.save();
  return { user, student };
};

const createCompany = async ({ approved = true, name } = {}) => {
  const user = await createUser("company", { isApproved: approved });
  const company = await Company.create({
    name: name || `Company ${uniq()}`,
    recruiterId: user._id,
    recruiterEmail: user.email,
    approved,
  });
  user.profileRef = company._id;
  user.profileModel = "Company";
  await user.save();
  return { user, company };
};

const createJob = async (company, overrides = {}) =>
  Job.create({
    title: `Engineer ${uniq()}`,
    companyId: company._id,
    description: "Build things",
    package: 10,
    eligibility: { cgpa: 6, branches: ["CSE"], years: [4] },
    deadline: new Date(Date.now() + 7 * 24 * 3600 * 1000),
    ...overrides,
  });

const createRound = async (job, sequence = 1, overrides = {}) =>
  Round.create({ jobId: job._id, name: `Round ${sequence}`, sequence, ...overrides });

const createApplication = async (student, job, overrides = {}) =>
  Application.create({
    studentId: student._id,
    jobId: job._id,
    rounds: [{ name: "Applied", result: "Passed" }],
    ...overrides,
  });

module.exports = {
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
};
