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

// Get eligible jobs for students or all jobs for other roles
module.exports.getJobs = ErrorWrapper(async (req, res, next) => {
  if (req.user.role !== "student") {
    // If not a student, return all jobs populated with company info
    const jobs = await Job.find().populate("companyId").sort({ createdAt: -1 });
    return res.status(200).json({ jobs });
  }

  // If a student, find student profile and return only eligible active jobs
  const student = await Student.findOne({ userId: req.user.id });
  if (!student) {
    throw new ErrorHandler(404, "Student profile not found");
  }

  const allActiveJobs = await Job.find({
    status: "active",
    deadline: { $gte: new Date() },
  })
    .populate("companyId")
    .sort({ createdAt: -1 });

  let studentApplications = [];
  studentApplications = await Application.find({ studentId: student._id }).select("jobId status");
  const appliedJobIds = new Set(studentApplications.map((a) => a.jobId.toString()));

  const studentBranch = student.branch ? student.branch.trim().toUpperCase() : "";
  const studentYear = parseInt(student.year);
  const studentCgpa = parseFloat(student.cgpa || 0);

  // Filter only jobs the student is eligible for
  const eligibleJobs = allActiveJobs.filter((job) => {
    // 1. CGPA Check
    const minCgpa = job.eligibility?.cgpa !== undefined ? parseFloat(job.eligibility.cgpa) : 0;
    if (studentCgpa < minCgpa) return false;

    // 2. Branch Check
    const eligibleBranches = (job.eligibility?.branches || []).map((b) => b.trim().toUpperCase());
    if (eligibleBranches.length > 0 && !eligibleBranches.includes("ALL") && !eligibleBranches.includes("ANY")) {
      const cseAliases = ["CSE", "CS", "COMPUTER SCIENCE", "COMPUTER SCIENCE & ENGINEERING", "COMPUTER ENGINEERING"];
      const itAliases = ["IT", "INFORMATION TECHNOLOGY"];
      const eceAliases = ["ECE", "ELECTRONICS", "ELECTRONICS & COMMUNICATION"];
      const eeeAliases = ["EEE", "ELECTRICAL", "ELECTRICAL & ELECTRONICS"];
      const mechAliases = ["MECH", "MECHANICAL", "MECHANICAL ENGINEERING"];
      const civilAliases = ["CIVIL", "CIVIL ENGINEERING"];
      const groups = [cseAliases, itAliases, eceAliases, eeeAliases, mechAliases, civilAliases];

      let branchMatched = eligibleBranches.includes(studentBranch);
      if (!branchMatched) {
        for (const group of groups) {
          if (group.some((alias) => alias === studentBranch || studentBranch.includes(alias))) {
            if (group.some((alias) => eligibleBranches.some((eb) => eb === alias || eb.includes(alias)))) {
              branchMatched = true;
              break;
            }
          }
        }
      }
      if (!branchMatched) return false;
    }

    // 3. Year Check
    const eligibleYears = job.eligibility?.years || [];
    if (eligibleYears.length > 0) {
      let yearMatched = eligibleYears.some((ey) => parseInt(ey) === studentYear);
      if (!yearMatched) {
        if (studentYear === 4 && (eligibleYears.includes(2026) || eligibleYears.includes(2027))) yearMatched = true;
        if (studentYear === 3 && (eligibleYears.includes(2027) || eligibleYears.includes(2028))) yearMatched = true;
        if (studentYear === 2 && (eligibleYears.includes(2028) || eligibleYears.includes(2029))) yearMatched = true;
        if (studentYear === 1 && (eligibleYears.includes(2029) || eligibleYears.includes(2030))) yearMatched = true;
      }
      if (!yearMatched) return false;
    }

    return true;
  });

  const jobs = eligibleJobs.map((job) => {
    const jobObj = job.toObject();
    jobObj.applied = appliedJobIds.has(job._id.toString());
    jobObj.companyInfo = jobObj.companyId || {};
    return jobObj;
  });

  return res.status(200).json({ jobs });
});

// Get job details by ID
module.exports.getJobById = ErrorWrapper(async (req, res, next) => {
  const job = await Job.findById(req.params.id).populate("companyId");
  if (!job) {
    throw new ErrorHandler(404, "Job drive not found");
  }
  return res.status(200).json({ job });
});

// Apply to job drive
module.exports.applyJob = ErrorWrapper(async (req, res, next) => {
  const student = await Student.findOne({ userId: req.user.id });
  if (!student) {
    throw new ErrorHandler(404, "Student profile not found");
  }

  // Check if student has uploaded a resume
  if (!student.resumeUrl) {
    throw new ErrorHandler(400, "Please upload your resume in your profile before applying to placement drives.");
  }

  const job = await Job.findById(req.params.id).populate("companyId");
  if (!job) {
    throw new ErrorHandler(404, "Job drive not found");
  }

  // 1. Check status and deadline
  if (job.status !== "active") {
    throw new ErrorHandler(400, "This placement drive is closed");
  }
  if (new Date() > new Date(job.deadline)) {
    throw new ErrorHandler(400, "Application deadline has passed");
  }

  // 2. Check CGPA eligibility
  if (student.cgpa !== undefined && job.eligibility?.cgpa !== undefined && student.cgpa < job.eligibility.cgpa) {
    throw new ErrorHandler(400, `Ineligible: CGPA requirement is ${job.eligibility.cgpa}`);
  }

  // 3. Check Branch eligibility (smart alias matching)
  const studentBranch = student.branch ? student.branch.trim().toUpperCase() : "";
  const eligibleBranches = (job.eligibility?.branches || []).map((b) => b.trim().toUpperCase());

  const isBranchEligible = () => {
    if (eligibleBranches.length === 0 || eligibleBranches.includes("ALL") || eligibleBranches.includes("ANY")) return true;
    if (eligibleBranches.includes(studentBranch)) return true;
    const cseAliases = ["CSE", "CS", "COMPUTER SCIENCE", "COMPUTER SCIENCE & ENGINEERING", "COMPUTER ENGINEERING"];
    const itAliases = ["IT", "INFORMATION TECHNOLOGY"];
    const eceAliases = ["ECE", "ELECTRONICS", "ELECTRONICS & COMMUNICATION"];
    const eeeAliases = ["EEE", "ELECTRICAL", "ELECTRICAL & ELECTRONICS"];
    const mechAliases = ["MECH", "MECHANICAL", "MECHANICAL ENGINEERING"];
    const civilAliases = ["CIVIL", "CIVIL ENGINEERING"];
    const groups = [cseAliases, itAliases, eceAliases, eeeAliases, mechAliases, civilAliases];
    for (const group of groups) {
      if (group.some((alias) => alias === studentBranch || studentBranch.includes(alias))) {
        if (group.some((alias) => eligibleBranches.some((eb) => eb === alias || eb.includes(alias)))) {
          return true;
        }
      }
    }
    return false;
  };

  if (!isBranchEligible()) {
    throw new ErrorHandler(400, `Ineligible: Open only to branches: ${job.eligibility.branches.join(", ")}`);
  }

  // 4. Check Graduation Year eligibility (supports academic year 3, 4 and calendar graduation years)
  const eligibleYears = job.eligibility?.years || [];
  const isYearEligible = () => {
    if (eligibleYears.length === 0) return true;
    if (eligibleYears.includes(student.year)) return true;
    if (student.year === 4 && (eligibleYears.includes(2026) || eligibleYears.includes(2027))) return true;
    if (student.year === 3 && (eligibleYears.includes(2027) || eligibleYears.includes(2028))) return true;
    if (student.year === 2 && (eligibleYears.includes(2028) || eligibleYears.includes(2029))) return true;
    return false;
  };

  if (!isYearEligible()) {
    throw new ErrorHandler(400, `Ineligible: Open only to year cohorts: ${job.eligibility.years.join(", ")}`);
  }

  // 5. Check if already applied
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
      status: "Rejected",
      rejectionReason: "Resume screening score below threshold."
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
