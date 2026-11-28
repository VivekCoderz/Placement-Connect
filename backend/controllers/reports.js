// Drive reports: round-wise result lists and the final selection list, for the owning
// recruiter and the placement cell. Each list can be printed (frontend) or downloaded
// as CSV (Excel opens it directly).
const Application = require("../models/application");
const Round = require("../models/Round");
const RoundResult = require("../models/RoundResult");
const StudentProgress = require("../models/StudentProgress");
const ResultApproval = require("../models/resultApproval");
const ResumeAnalysis = require("../models/ResumeAnalysis");
const ErrorWrapper = require("../utils/ErrorWrapper");
const ErrorHandler = require("../utils/ErrorHandle");
const { assertJobOwner, assertValidId } = require("../utils/ownership");

const STUDENT_FIELDS = "name rollNumber branch year cgpa email phone";
const CLOSED = ["Rejected", "Withdrawn", "Selected"];
const RESULT_ORDER = { Selected: 0, Waiting: 1, Pending: 2, Absent: 3, Rejected: 4 };

const studentColumns = (s) => ({
  name: s?.name || "",
  rollNumber: s?.rollNumber || "",
  branch: s?.branch || "",
  year: s?.year ?? "",
  cgpa: s?.cgpa ?? "",
  email: s?.email || "",
  phone: s?.phone || "",
});

const byResultThenName = (a, b) =>
  (RESULT_ORDER[a.result] ?? 9) - (RESULT_ORDER[b.result] ?? 9) || a.name.localeCompare(b.name);

const jobHeader = (job) => ({
  _id: job._id,
  title: job.title,
  company: job.companyId?.name || "",
  package: job.package,
  deadline: job.deadline,
  status: job.status,
  numOpenings: job.numOpenings,
});

const loadJob = async (req) => {
  const job = await assertJobOwner(req, req.params.jobId);
  await job.populate("companyId", "name");
  return job;
};

// ---------- Overview: rounds funnel ----------
module.exports.getDriveOverview = ErrorWrapper(async (req, res) => {
  const job = await loadJob(req);
  const [rounds, applications] = await Promise.all([
    Round.find({ jobId: job._id }).sort({ sequence: 1 }).lean(),
    Application.find({ jobId: job._id }).select("status offerLetterStatus offerResponse").lean(),
  ]);

  const roundIds = rounds.map((r) => r._id);
  const [results, waiting, pendingApprovals] = await Promise.all([
    RoundResult.aggregate([
      { $match: { roundId: { $in: roundIds } } },
      { $group: { _id: { roundId: "$roundId", result: "$result" }, count: { $sum: 1 } } },
    ]),
    StudentProgress.aggregate([
      { $match: { jobId: job._id, currentRoundId: { $in: roundIds }, status: { $nin: ["Rejected", "Withdrawn"] } } },
      { $group: { _id: "$currentRoundId", count: { $sum: 1 } } },
    ]),
    ResultApproval.find({ jobId: job._id, status: "Pending Approval" }).select("roundId results").lean(),
  ]);

  const countFor = (roundId, result) =>
    results.find((r) => String(r._id.roundId) === String(roundId) && r._id.result === result)?.count || 0;

  const roundSummaries = rounds.map((r) => {
    const counts = {
      selected: countFor(r._id, "Selected"),
      rejected: countFor(r._id, "Rejected"),
      absent: countFor(r._id, "Absent"),
      waiting: countFor(r._id, "Waiting"),
    };
    const decided = counts.selected + counts.rejected + counts.absent + counts.waiting;
    const atRound = waiting.find((w) => String(w._id) === String(r._id))?.count || 0;
    return {
      _id: r._id,
      name: r.name,
      sequence: r.sequence,
      date: r.date,
      mode: r.mode,
      ...counts,
      // Candidates currently at this round without a final result yet.
      pending: Math.max(0, atRound - counts.waiting),
      total: decided + Math.max(0, atRound - counts.waiting),
      awaitingApproval: pendingApprovals.filter((p) => String(p.roundId) === String(r._id)).reduce((n, p) => n + p.results.length, 0),
    };
  });

  const statusCount = (pred) => applications.filter(pred).length;
  return res.status(200).json({
    job: jobHeader(job),
    totals: {
      applicants: applications.length,
      inProcess: statusCount((a) => !CLOSED.includes(a.status)),
      rejected: statusCount((a) => a.status === "Rejected"),
      withdrawn: statusCount((a) => a.status === "Withdrawn"),
      selected: statusCount((a) => a.status === "Selected"),
      offersApproved: statusCount((a) => a.offerLetterStatus === "Approved"),
      offersAccepted: statusCount((a) => a.offerResponse === "Accepted"),
    },
    rounds: roundSummaries,
  });
});

// ---------- Lists ----------
const roundList = async (job, roundId) => {
  assertValidId(roundId, "round");
  const round = await Round.findOne({ _id: roundId, jobId: job._id }).lean();
  if (!round) throw new ErrorHandler(404, "Round not found for this drive");

  const results = await RoundResult.find({ roundId: round._id })
    .populate({ path: "applicationId", select: "studentId", populate: { path: "studentId", select: STUDENT_FIELDS } })
    .lean();
  const withResult = new Set(results.map((r) => String(r.applicationId?._id)));

  // Candidates at this round who have no result yet
  const progress = await StudentProgress.find({ jobId: job._id, currentRoundId: round._id, status: { $nin: ["Rejected", "Withdrawn"] } })
    .select("applicationId")
    .lean();
  const pendingApps = await Application.find({
    _id: { $in: progress.map((p) => p.applicationId).filter((id) => !withResult.has(String(id))) },
    status: { $nin: CLOSED },
  })
    .populate("studentId", STUDENT_FIELDS)
    .lean();

  const rows = [
    ...results.map((r) => ({
      ...studentColumns(r.applicationId?.studentId),
      result: r.result,
      score: r.score ?? "",
      remarks: r.remarks || "",
    })),
    ...pendingApps.map((a) => ({ ...studentColumns(a.studentId), result: "Pending", score: "", remarks: "" })),
  ].sort(byResultThenName);

  return {
    title: `${round.name} – Round ${round.sequence} Result`,
    round: { _id: round._id, name: round.name, sequence: round.sequence, date: round.date, mode: round.mode },
    columns: ["name", "rollNumber", "branch", "year", "cgpa", "email", "phone", "result", "score", "remarks"],
    rows,
  };
};

const selectedList = async (job) => {
  const apps = await Application.find({ jobId: job._id, status: "Selected" }).populate("studentId", STUDENT_FIELDS).lean();
  const rows = apps
    .map((a) => ({
      ...studentColumns(a.studentId),
      package: job.package,
      offer: a.offerLetterStatus === "None" ? "Not issued" : a.offerLetterStatus,
      response: a.offerResponse && a.offerResponse !== "None" ? a.offerResponse : a.offerLetterStatus === "Approved" ? "Awaiting" : "",
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return {
    title: "Final Selection List",
    columns: ["name", "rollNumber", "branch", "year", "cgpa", "email", "phone", "package", "offer", "response"],
    rows,
  };
};

const applicantList = async (job) => {
  const apps = await Application.find({ jobId: job._id }).populate("studentId", STUDENT_FIELDS).lean();
  const analyses = await ResumeAnalysis.find({ applicationId: { $in: apps.map((a) => a._id) } }).select("applicationId atsScore").lean();
  const score = new Map(analyses.map((a) => [String(a.applicationId), a.atsScore]));
  const rows = apps
    .map((a) => ({ ...studentColumns(a.studentId), status: a.status, atsScore: score.get(String(a._id)) ?? "", appliedOn: a.createdAt }))
    .sort((a, b) => (Number(b.atsScore) || 0) - (Number(a.atsScore) || 0) || a.name.localeCompare(b.name));
  return {
    title: "All Applicants",
    columns: ["name", "rollNumber", "branch", "year", "cgpa", "email", "phone", "status", "atsScore", "appliedOn"],
    rows,
  };
};

const HEADERS = {
  name: "Name",
  rollNumber: "Roll No",
  branch: "Branch",
  year: "Year",
  cgpa: "CGPA",
  email: "Email",
  phone: "Phone",
  result: "Result",
  score: "Score",
  remarks: "Remarks",
  package: "Package (LPA)",
  offer: "Offer Letter",
  response: "Student Response",
  status: "Status",
  atsScore: "ATS Score",
  appliedOn: "Applied On",
};

// Cells are quoted, and values starting with = + - @ are prefixed so spreadsheet
// programs never treat student-entered text as a formula.
const csvCell = (value) => {
  let text = value instanceof Date ? value.toISOString().slice(0, 10) : String(value ?? "");
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

const toCsv = (list) => {
  const lines = [["S.No", ...list.columns.map((c) => HEADERS[c] || c)].map(csvCell).join(",")];
  list.rows.forEach((row, i) => lines.push([i + 1, ...list.columns.map((c) => row[c])].map(csvCell).join(",")));
  return `﻿${lines.join("\r\n")}\r\n`; // BOM so Excel reads UTF-8 names correctly
};

module.exports.getDriveList = ErrorWrapper(async (req, res) => {
  const job = await loadJob(req);
  const stage = String(req.query.stage || "selected");

  let list;
  if (stage === "selected") list = await selectedList(job);
  else if (stage === "applicants") list = await applicantList(job);
  else list = await roundList(job, stage);

  const payload = { job: jobHeader(job), generatedAt: new Date(), ...list, headers: HEADERS };

  if (req.query.format === "csv") {
    const safe = (t) => String(t).replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 60);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${safe(job.title)}_${safe(list.title)}.csv"`);
    return res.status(200).send(toCsv(list));
  }
  return res.status(200).json(payload);
});
