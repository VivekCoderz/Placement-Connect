// Ownership checks for company-scoped resources (jobs, applications, rounds).
//
// Rules:
// - admin and placementCell (staff) may act on any company's resources.
// - a company user may only act on jobs whose companyId is their own company.
// - every other role is denied.
const mongoose = require("mongoose");
const Job = require("../models/job");
const Company = require("../models/company");
const Application = require("../models/application");
const Round = require("../models/Round");
const ErrorHandler = require("./ErrorHandle");

const STAFF_ROLES = ["admin", "placementCell"];
const COMPANY_ROLES = ["company", "recruiter"];

const isStaff = (user) => Boolean(user && STAFF_ROLES.includes(user.role));

const getRequestCompany = async (req) => {
  if (req.company) return req.company;
  if (!req.user) return null;
  const company = await Company.findOne({
    $or: [{ recruiterId: req.user._id || req.user.id }, { userId: req.user._id || req.user.id }],
  });
  if (company) req.company = company;
  return company;
};

const assertValidId = (id, label) => {
  if (!id || !mongoose.isValidObjectId(id)) {
    throw new ErrorHandler(400, `Invalid ${label} id`);
  }
};

// Throws 403 unless the requester may act on a job with this companyId.
const assertCompanyAccess = async (req, companyId) => {
  if (isStaff(req.user)) return;
  if (!req.user || !COMPANY_ROLES.includes(req.user.role)) {
    throw new ErrorHandler(403, "Access Denied");
  }
  const company = await getRequestCompany(req);
  if (!company) {
    throw new ErrorHandler(403, "Access Denied: No company profile linked to this account");
  }
  const ownerId = companyId && companyId._id ? companyId._id : companyId;
  if (!ownerId || ownerId.toString() !== company._id.toString()) {
    throw new ErrorHandler(403, "Access Denied: You do not own this job posting");
  }
};

/** Load a job and verify the requester owns it (or is staff). Returns the job. */
const assertJobOwner = async (req, jobId) => {
  assertValidId(jobId, "job");
  const job = await Job.findById(jobId);
  if (!job) {
    throw new ErrorHandler(404, "Job drive not found");
  }
  await assertCompanyAccess(req, job.companyId);
  return job;
};

/**
 * Load an application and verify the requester owns its job (or is staff).
 * `query` lets callers chain populate(); it receives the mongoose query.
 */
const assertApplicationOwner = async (req, applicationId, query = (q) => q) => {
  assertValidId(applicationId, "application");
  const application = await query(Application.findById(applicationId));
  if (!application) {
    throw new ErrorHandler(404, "Application not found");
  }
  const jobRef = application.jobId;
  const jobId = jobRef && jobRef._id ? jobRef._id : jobRef;
  const job = jobRef && jobRef.companyId ? jobRef : await Job.findById(jobId).select("companyId");
  if (!job) {
    throw new ErrorHandler(404, "Job drive not found");
  }
  await assertCompanyAccess(req, job.companyId);
  return application;
};

/** Load a round and verify the requester owns its job. Optionally require it to belong to `jobId`. */
const assertRoundOwner = async (req, roundId, jobId) => {
  assertValidId(roundId, "round");
  const round = await Round.findById(roundId);
  if (!round) {
    throw new ErrorHandler(404, "Round details not found");
  }
  if (jobId && round.jobId.toString() !== jobId.toString()) {
    throw new ErrorHandler(400, "Round does not belong to this job");
  }
  const job = await assertJobOwner(req, round.jobId);
  return { round, job };
};

// Route-level guards, so ownership is checked before any file upload is processed.
const requireJobOwner = (param = "jobId") => async (req, res, next) => {
  try {
    await assertJobOwner(req, req.params[param]);
    next();
  } catch (err) {
    next(err);
  }
};

const requireApplicationOwner = (param = "id") => async (req, res, next) => {
  try {
    await assertApplicationOwner(req, req.params[param]);
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  requireJobOwner,
  requireApplicationOwner,
  isStaff,
  getRequestCompany,
  assertCompanyAccess,
  assertJobOwner,
  assertApplicationOwner,
  assertRoundOwner,
};
