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
    const jobs = await Job.find().populate("companyId");
    return res.status(200).json({ jobs });
  }

  // If a student, filter jobs using MongoDB Aggregation
  const student = await Student.findOne({ userId: req.user.id });
  if (!student) {
    throw new ErrorHandler(404, "Student profile not found");
  }

  const eligibleJobs = await Job.aggregate([
    {
      $match: {
        status: "active",
        "eligibility.cgpa": { $lte: student.cgpa },
        "eligibility.branches": student.branch,
        "eligibility.years": student.year,
        deadline: { $gte: new Date() },
      },
    },
    {
      $lookup: {
        from: "companies",
        localField: "companyId",
        foreignField: "_id",
        as: "companyInfo",
      },
    },
    {
      $unwind: "$companyInfo",
    },
    {
      $lookup: {
        from: "applications",
        let: { jobId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$jobId", "$$jobId"] },
                  { $eq: ["$studentId", student._id] },
                ],
              },
            },
          },
        ],
        as: "existingApplication",
      },
    },
    {
      $addFields: {
        applied: { $gt: [{ $size: "$existingApplication" }, 0] },
      },
    },
    {
      $project: {
        existingApplication: 0,
      },
    },
  ]);

  return res.status(200).json({ jobs: eligibleJobs });
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
  if (student.cgpa < job.eligibility.cgpa) {
    throw new ErrorHandler(400, `Ineligible: CGPA requirement is ${job.eligibility.cgpa}`);
  }

  // 3. Check Branch eligibility
  if (job.eligibility.branches.length > 0 && !job.eligibility.branches.includes(student.branch)) {
    throw new ErrorHandler(400, `Ineligible: Open only to branches: ${job.eligibility.branches.join(", ")}`);
  }

  // 4. Check Graduation Year eligibility
  if (job.eligibility.years.length > 0 && !job.eligibility.years.includes(student.year)) {
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

  // Create ResumeAnalysis record
  const analysisDoc = new ResumeAnalysis({
    applicationId: newApplication._id,
    studentId: student._id,
    jobId: job._id,
    atsScore: analysisResult.atsScore,
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

  // Apply decision
  let progressStatus = "AI Screening";
  let roundsList = [...newApplication.rounds];
  let finalStatus = "Applied";

  if (analysisResult.status === "Shortlisted") {
    finalStatus = "Shortlisted";
    // Find the first interview round if any
    const firstRound = await Round.findOne({ jobId: job._id }).sort({ sequence: 1 });
    
    let currentRoundId = null;
    if (firstRound) {
      currentRoundId = firstRound._id;
      progressStatus = `Round 1: ${firstRound.name}`;
      
      // Add first round to application rounds
      roundsList.push({
        name: firstRound.name,
        result: "Pending",
        scheduledAt: firstRound.date,
        roundType: firstRound.mode || "Online",
        testLink: firstRound.meetingLink || "",
        notes: firstRound.instructions || "",
        venue: firstRound.mode === "Physical" ? (firstRound.meetingLink || "TPO Office") : ""
      });
    } else {
      progressStatus = "Shortlisted";
    }

    // Save StudentProgress
    const progress = new StudentProgress({
      applicationId: newApplication._id,
      studentId: student._id,
      jobId: job._id,
      currentRoundIndex: 0,
      currentRoundId,
      status: progressStatus,
    });
    await progress.save();

    newApplication.status = "Shortlisted";
    newApplication.rounds = roundsList;
    await newApplication.save();

    // Send notifications
    const shortNotif = new Notification({
      userId: req.user.id,
      message: `Congratulations! You have been Shortlisted by AI for "${job.title}" at ${job.companyId.name} with an ATS score of ${analysisResult.atsScore}%.`,
      type: "application_status",
    });
    await shortNotif.save();

    await sendEmail({
      to: student.email,
      subject: `Application Shortlisted: ${job.title} at ${job.companyId.name}`,
      html: `
        <h2>Congratulations ${student.name}!</h2>
        <p>Your resume has been successfully screened by our AI system and you have been <strong>Shortlisted</strong>.</p>
        <p><strong>ATS Score:</strong> ${analysisResult.atsScore}%</p>
        <p><strong>Next Step:</strong> ${progressStatus}</p>
        <p>Log in to PlacementConnect to check details and link schedule.</p>
      `
    });
  } else {
    // Rejected
    finalStatus = "Rejected";
    progressStatus = "Rejected";

    // Save StudentProgress
    const progress = new StudentProgress({
      applicationId: newApplication._id,
      studentId: student._id,
      jobId: job._id,
      currentRoundIndex: 0,
      status: progressStatus,
      history: [
        {
          roundName: "AI Screening",
          result: "Rejected",
          remarks: analysisResult.rejectionReason || "Failed to meet ATS threshold score."
        }
      ]
    });
    await progress.save();

    // Add rejection notes to application rounds list
    roundsList.push({
      name: "Resume Screening",
      result: "Failed",
      scheduledAt: new Date(),
      notes: `Rejected because: ${analysisResult.rejectionReason || "Below required score."}`
    });

    newApplication.status = "Rejected";
    newApplication.rounds = roundsList;
    await newApplication.save();

    // Send notifications
    const rejNotif = new Notification({
      userId: req.user.id,
      message: `Application Update: Your application for "${job.title}" at ${job.companyId.name} was not shortlisted.`,
      type: "application_status",
    });
    await rejNotif.save();

    // Send detailed rejection feedback via email
    let suggestionsHtml = "";
    if (analysisResult.recommendedLearning && analysisResult.recommendedLearning.length > 0) {
      suggestionsHtml = `<h4>Suggestions to Improve:</h4><ul>` + 
        analysisResult.recommendedLearning.map(topic => `<li>${topic}</li>`).join("") + `</ul>`;
    }

    await sendEmail({
      to: student.email,
      subject: `Application Status: ${job.title} at ${job.companyId.name}`,
      html: `
        <p>Dear ${student.name},</p>
        <p>Thank you for applying to the <strong>${job.title}</strong> role at <strong>${job.companyId.name}</strong>.</p>
        <p>Unfortunately, your application was not selected for further evaluation as your resume score did not meet our threshold.</p>
        <p><strong>Resume Match Score:</strong> ${analysisResult.atsScore}% (Threshold: ${job.atsThreshold}%)</p>
        <h4>Reason for Rejection:</h4>
        <p>${analysisResult.rejectionReason || "Lacked matching skills or eligibility metrics."}</p>
        ${suggestionsHtml}
        <br/>
        <p>We wish you the very best in your next application!</p>
      `
    });
  }

  // Notify recruiter
  const company = job.companyId;
  const recruiterNotification = new Notification({
    userId: company.recruiterId,
    message: `New applicant ${student.name} screened. Status: ${analysisResult.status} (ATS: ${analysisResult.atsScore}%) for job: ${job.title}`,
    type: "general",
  });
  await recruiterNotification.save();

  return res.status(201).json({
    message: `Applied successfully. AI screening complete: ${analysisResult.status}`,
    application: newApplication,
    analysis: analysisDoc,
  });
});
