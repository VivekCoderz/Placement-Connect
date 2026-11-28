const Job = require("../models/job");
const Student = require("../models/student");
const Company = require("../models/company");
const Application = require("../models/application");
const Notification = require("../models/notification");
const ErrorWrapper = require("../utils/ErrorWrapper");
const ErrorHandler = require("../utils/ErrorHandle");
const { sendEmail } = require("../utils/email");
const ResumeAnalysis = require("../models/ResumeAnalysis");
const Round = require("../models/Round");
const StudentProgress = require("../models/StudentProgress");
const { analyzeResume } = require("../services/aiService");
const { checkEligibility } = require("../utils/eligibility");

// List jobs.
// - Students: every open drive (active, deadline not passed) plus drives they already
//   applied to, each with "eligible" + "ineligibleReasons" so the UI can explain why.
// - Companies: only their own drives.
// - Placement cell / admin: all drives.
module.exports.getJobs = ErrorWrapper(async (req, res, next) => {
  if (req.user.role === "company") {
    const company = await Company.findOne({ recruiterId: req.user.id });
    const jobs = company
      ? await Job.find({ companyId: company._id }).populate("companyId").sort({ createdAt: -1 })
      : [];
    return res.status(200).json({ jobs });
  }

  if (req.user.role !== "student") {
    const jobs = await Job.find().populate("companyId").sort({ createdAt: -1 });
    return res.status(200).json({ jobs });
  }

  const student = await Student.findOne({ userId: req.user.id });
  if (!student) {
    throw new ErrorHandler(404, "Student profile not found");
  }

  const studentApplications = await Application.find({ studentId: student._id }).select("jobId status");
  const appliedJobIds = studentApplications.map((a) => a.jobId);
  const appliedSet = new Set(appliedJobIds.map(String));

  const jobs = await Job.find({
    $or: [{ status: "active", deadline: { $gte: new Date() } }, { _id: { $in: appliedJobIds } }],
  })
    .populate("companyId")
    .sort({ createdAt: -1 });

  return res.status(200).json({
    jobs: jobs.map((job) => {
      const { eligible, reasons } = checkEligibility(student, job);
      const jobObj = job.toObject();
      jobObj.applied = appliedSet.has(job._id.toString());
      jobObj.eligible = eligible;
      jobObj.ineligibleReasons = reasons;
      jobObj.companyInfo = jobObj.companyId || {};
      return jobObj;
    }),
  });
});

// Get job details by ID (students also get their eligibility and applied state)
module.exports.getJobById = ErrorWrapper(async (req, res, next) => {
  const job = await Job.findById(req.params.id).populate("companyId");
  if (!job) {
    throw new ErrorHandler(404, "Job drive not found");
  }

  if (req.user.role !== "student") {
    return res.status(200).json({ job });
  }

  const student = await Student.findOne({ userId: req.user.id });
  if (!student) {
    throw new ErrorHandler(404, "Student profile not found");
  }
  const applied = await Application.exists({ studentId: student._id, jobId: job._id });
  const { eligible, reasons } = checkEligibility(student, job);
  const jobObj = job.toObject();
  jobObj.applied = Boolean(applied);
  jobObj.eligible = eligible;
  jobObj.ineligibleReasons = reasons;
  return res.status(200).json({ job: jobObj });
});

// Apply to job drive
module.exports.applyJob = ErrorWrapper(async (req, res, next) => {
  const student = await Student.findOne({ userId: req.user.id });
  if (!student) {
    throw new ErrorHandler(404, "Student profile not found");
  }

  const job = await Job.findById(req.params.id).populate("companyId");
  if (!job) {
    throw new ErrorHandler(404, "Job drive not found");
  }

  // 1. Eligibility: open drive, deadline, not already placed, CGPA, branch, batch
  const { eligible, reasons } = checkEligibility(student, job);
  if (!eligible) {
    throw new ErrorHandler(400, `Ineligible: ${reasons.join(" ")}`);
  }

  if (!student.resumeUrl) {
    throw new ErrorHandler(400, "Please upload your resume in your profile before applying to placement drives.");
  }

  // 2. Check if already applied (a concurrent double-submit is caught by the unique index)
  const existingApp = await Application.findOne({ studentId: student._id, jobId: job._id });
  if (existingApp) {
    throw new ErrorHandler(400, "You have already applied to this placement drive");
  }

  // Create Application
  const newApplication = new Application({
    studentId: student._id,
    jobId: job._id,
    status: "AI Screening",
    rounds: [
      {
        name: "Applied",
        result: "Passed",
        scheduledAt: new Date(),
        notes: "Application submitted.",
      },
    ],
  });
  await newApplication.save();

  // Run AI Resume Screening
  let analysisResult;
  try {
    analysisResult = await analyzeResume(student, job);
  } catch (err) {
    console.error("AI resume parsing failed, using rules fallback:", err);
    // basic mock parsing fallback
    analysisResult = {
      atsScore: 55,
      matchPercentage: 55,
      skillsMatch: student.skills || [],
      missingSkills: [],
      experienceMatch: "Candidate project history.",
      educationMatch: "Eligible.",
      aiSummary: "AI Screening failed. Basic eligibility passed.",
      aiCandidateSummary: "Screening completed.",
      aiRecruiterSummary: "ATS: 55%",
      strengths: ["Academic eligibility"],
      weaknesses: ["AI service error"],
      recommendedLearning: ["Technical preparation"],
      status: "Borderline",
      rejectionReason: "Automatic screening was unavailable; needs manual review."
    };
  }

  // Create ResumeAnalysis record with extended Ollama fields
  const analysisDoc = new ResumeAnalysis({
    applicationId: newApplication._id,
    studentId: student._id,
    jobId: job._id,
    atsScore: analysisResult.atsScore,
    overallScore: analysisResult.overallScore !== undefined ? analysisResult.overallScore : analysisResult.atsScore,
    recommendation: analysisResult.recommendation || "Consider",
    educationScore: analysisResult.educationScore !== undefined ? analysisResult.educationScore : 0,
    projectScore: analysisResult.projectScore !== undefined ? analysisResult.projectScore : 0,
    experienceScore: analysisResult.experienceScore !== undefined ? analysisResult.experienceScore : 0,
    skillScore: analysisResult.skillScore !== undefined ? analysisResult.skillScore : 0,
    finalRankScore: analysisResult.finalRankScore !== undefined ? analysisResult.finalRankScore : analysisResult.atsScore,
    reason: analysisResult.reason || "",
    matchPercentage: analysisResult.matchPercentage,
    skillsMatch: analysisResult.skillsMatch,
    missingSkills: analysisResult.missingSkills,
    experienceMatch: analysisResult.experienceMatch,
    educationMatch: analysisResult.educationMatch,
    aiSummary: analysisResult.aiSummary,
    aiCandidateSummary: analysisResult.aiCandidateSummary,
    aiRecruiterSummary: analysisResult.aiRecruiterSummary,
    strengths: analysisResult.strengths,
    weaknesses: analysisResult.weaknesses,
    recommendedLearning: analysisResult.recommendedLearning,
    rejectionReason: analysisResult.rejectionReason,
    selectionReason: analysisResult.selectionReason,
    status: analysisResult.status,
    aiProvider: analysisResult.aiProvider || "rules",
  });
  await analysisDoc.save();

  // Set initial status to Under Review
  newApplication.status = "Under Review";
  newApplication.rounds = [
    {
      name: "Applied",
      result: "Passed",
      scheduledAt: new Date(),
      notes: "Application submitted and resume screened by AI.",
    },
    {
      name: "Resume Screening",
      result: "Pending",
      scheduledAt: new Date(),
      notes: `AI Screened with score: ${analysisResult.atsScore}%. Pending recruiter approval.`,
    }
  ];
  await newApplication.save();

  // Create StudentProgress record set to Under Review
  const progress = new StudentProgress({
    applicationId: newApplication._id,
    studentId: student._id,
    jobId: job._id,
    currentRoundIndex: 0,
    status: "Under Review",
    history: [
      {
        roundName: "Applied",
        result: "Passed",
        remarks: "Resume uploaded and screened by AI."
      },
      {
        roundName: "Resume Screening",
        result: "Pending",
        remarks: `ATS Screening Score: ${analysisResult.atsScore}%. Staged for recruiter approval.`
      }
    ]
  });
  await progress.save();

  return res.status(201).json({
    message: "Applied successfully. Your application has been screened and is under manual review.",
    application: newApplication,
    analysis: analysisDoc,
  });
});
