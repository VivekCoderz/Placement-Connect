const Job = require("../models/job");
const Company = require("../models/company");
const Student = require("../models/student");
const Application = require("../models/application");
const Shortlist = require("../models/shortlist");
const Notification = require("../models/notification");
const ResultApproval = require("../models/resultApproval");
const ErrorWrapper = require("../utils/ErrorWrapper");
const ErrorHandler = require("../utils/ErrorHandle");
const ResumeAnalysis = require("../models/ResumeAnalysis");
const Round = require("../models/Round");
const RoundResult = require("../models/RoundResult");
const StudentProgress = require("../models/StudentProgress");
const { processCandidateResult } = require("../services/roundEngine");

function calculateATSScore(student, job) {
  if (!student || !job) return 0;

  const studentSkills = (student.skills || []).map(s => s.toLowerCase());
  const studentProjects = student.projects || [];
  const studentCgpa = student.cgpa || 0;
  const studentBranch = student.branch || "";

  const reqSkills = (job.requiredSkills || []).map(s => s.toLowerCase());
  const prefSkills = (job.preferredSkills || []).map(s => s.toLowerCase());
  
  const jobText = `${job.title} ${job.description}`.toLowerCase();
  
  // Extract skills from JD dynamically if requiredSkills array is empty
  const jdSkills = [];
  const skillsDictFlattened = [
    "react", "angular", "vue", "next.js", "nextjs", "express", "django", "flask", "spring boot", "springboot", "laravel", "fastapi", "html", "css", "bootstrap", "tailwind",
    "node.js", "nodejs", "python", "java", "c++", "c#", "ruby", "golang", "go", "rust", "kotlin", "swift", "php", "sql",
    "mongodb", "mysql", "postgresql", "sqlite", "redis", "oracle", "docker", "kubernetes", "aws", "azure", "gcp", "git", "github", "jenkins",
    "data structures", "algorithms", "dsa", "system design", "oops", "operating systems", "computer networks", "dbms",
    "embedded c", "arduino", "raspberry pi", "iot", "vlsi", "verilog", "vhdl", "matlab", "solidworks", "autocad", "catia", "ansys", "revit", "staad pro"
  ];
  skillsDictFlattened.forEach(skill => {
    const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(jobText)) {
      jdSkills.push(skill);
    }
  });

  const finalReqSkills = reqSkills.length > 0 ? reqSkills : jdSkills.slice(0, 5);

  const skillsMatch = [];
  finalReqSkills.forEach(req => {
    if (studentSkills.some(s => s.includes(req) || req.includes(s))) {
      skillsMatch.push(req);
    }
  });

  const matchedPref = [];
  prefSkills.forEach(pref => {
    if (studentSkills.some(s => s.includes(pref) || pref.includes(s))) {
      matchedPref.push(pref);
    }
  });

  // Calculate weights
  let skillPoints = 0;
  if (finalReqSkills.length > 0) {
    skillPoints += (skillsMatch.length / finalReqSkills.length) * 30;
  } else {
    skillPoints += 25;
  }
  if (prefSkills.length > 0) {
    skillPoints += (matchedPref.length / prefSkills.length) * 10;
  } else {
    skillPoints += Math.min(10, skillsMatch.length * 2);
  }

  // Keyword Match (15 points)
  const commonKeywords = ["development", "design", "testing", "deployment", "analysis", "agile", "database", "cloud", "system", "scrum", "teamwork", "communication", "leadership"];
  let matchedKeywordsCount = 0;
  commonKeywords.forEach(kw => {
    if (jobText.includes(kw) && studentSkills.some(s => s.includes(kw))) {
      matchedKeywordsCount++;
    }
  });
  const keywordPoints = Math.min(15, (matchedKeywordsCount / Math.max(1, commonKeywords.filter(k => jobText.includes(k)).length)) * 15);

  // Project Relevance (15 points)
  let projectPoints = 0;
  if (studentProjects.length > 0) {
    let relevantCount = 0;
    studentProjects.forEach(proj => {
      const projText = `${proj.title} ${proj.description || ""} ${JSON.stringify(proj.techStack || [])}`.toLowerCase();
      const isRelevant = finalReqSkills.some(req => projText.includes(req)) || jdSkills.some(jd => projText.includes(jd));
      if (isRelevant) relevantCount++;
    });
    projectPoints = relevantCount >= 2 ? 15 : relevantCount === 1 ? 10 : 7;
  }

  // Experience Match (10 points)
  let experiencePoints = 3;
  if (studentProjects.length > 0 || studentSkills.some(s => s.includes("intern") || s.includes("trainee"))) {
    experiencePoints = 10;
  }

  // Education Match (10 points)
  let educationPoints = 0;
  const eligibleBranches = (job.eligibility?.branches || []).map(b => b.toLowerCase());
  const isBranchEligible = eligibleBranches.length === 0 || eligibleBranches.includes(studentBranch.toLowerCase());
  if (isBranchEligible) {
    educationPoints += 10;
  } else {
    educationPoints += 4;
  }

  // CGPA Match (10 points)
  let cgpaPoints = 0;
  const minCgpa = job.eligibility?.cgpa || 0;
  if (studentCgpa >= minCgpa) {
    cgpaPoints = 10;
  } else if (minCgpa > 0) {
    cgpaPoints = Math.max(0, Math.round((studentCgpa / minCgpa) * 8));
  } else {
    cgpaPoints = 10;
  }

  const atsScore = Math.min(100, Math.round(skillPoints + keywordPoints + projectPoints + experiencePoints + educationPoints + cgpaPoints));
  return atsScore;
}

// Post a new job drive
module.exports.postJob = ErrorWrapper(async (req, res, next) => {
  const { 
    title, 
    description, 
    package, 
    eligibility, 
    deadline, 
    rounds,
    requiredSkills,
    preferredSkills,
    experienceRequired,
    numOpenings,
    atsThreshold
  } = req.body;

  if (!title || !description || !package || !eligibility || !deadline) {
    throw new ErrorHandler(400, "All fields (title, description, package, eligibility, deadline) are required");
  }

  const { cgpa, branches, years } = eligibility;
  if (cgpa === undefined || !branches || !years) {
    throw new ErrorHandler(400, "Eligibility criteria (cgpa, branches, years) are required");
  }

  // Ensure recruiter has a company associated and it is approved
  const company = req.company;
  if (!company) {
    throw new ErrorHandler(404, "No registered company found for this recruiter profile");
  }

  if (!company.approved) {
    throw new ErrorHandler(403, "Access Denied: Recruiter company has not been approved by the Placement Cell yet");
  }

  // Create Job
  const newJob = new Job({
    title,
    companyId: company._id,
    description,
    package,
    requiredSkills: requiredSkills || [],
    preferredSkills: preferredSkills || [],
    experienceRequired: experienceRequired || "0 years",
    numOpenings: numOpenings || 5,
    atsThreshold: atsThreshold || 60,
    eligibility: {
      cgpa,
      branches,
      years,
    },
    deadline: new Date(deadline),
    rounds: [], // Will populate with Round structures
  });

  const savedJob = await newJob.save();

  // Create Round documents
  const jobRoundsPayload = (rounds && rounds.length > 0) ? rounds : [
    { number: 1, name: 'Aptitude Test', description: 'Online coding and aptitude test' },
    { number: 2, name: 'Technical Interview', description: 'In-depth coding and systems discussion' },
    { number: 3, name: 'HR Round', description: 'Cultural fit and salary negotiation' }
  ];

  const createdRounds = [];
  for (let i = 0; i < jobRoundsPayload.length; i++) {
    const roundDoc = new Round({
      jobId: savedJob._id,
      name: jobRoundsPayload[i].name,
      description: jobRoundsPayload[i].description || "",
      sequence: i + 1,
      mode: jobRoundsPayload[i].mode || "Online",
      meetingLink: jobRoundsPayload[i].meetingLink || "",
      platform: jobRoundsPayload[i].platform || "Google Meet",
      instructions: jobRoundsPayload[i].instructions || ""
    });
    await roundDoc.save();
    
    createdRounds.push({
      number: roundDoc.sequence,
      name: roundDoc.name,
      description: roundDoc.description,
      mode: roundDoc.mode,
      platform: roundDoc.platform,
      meetingLink: roundDoc.meetingLink,
      instructions: roundDoc.instructions
    });
  }

  // Update Job rounds details
  savedJob.rounds = createdRounds;
  await savedJob.save();

  // Link job to company postings
  company.jobPostings.push(savedJob._id);
  await company.save();

  // Find all eligible students and send notification
  const eligibleStudents = await Student.find({
    cgpa: { $gte: cgpa },
    branch: { $in: branches },
    year: { $in: years },
  });

  for (const student of eligibleStudents) {
    const jobAlert = new Notification({
      userId: student.userId,
      message: `Placement Cell: ${company.name} has uploaded a new job drive for "${title}" (Package: ${package} LPA). Eligible students are requested to apply now! Deadline: ${new Date(deadline).toLocaleDateString()}.`,
      type: "job_post",
    });
    await jobAlert.save();
  }

  return res.status(201).json({
    message: "Placement drive job posted successfully",
    job: savedJob,
  });
});

// View all applications for a posted job
module.exports.getApplications = ErrorWrapper(async (req, res, next) => {
  const { jobId } = req.params;

  const company = req.company;
  if (!company) {
    throw new ErrorHandler(404, "Recruiter company details not found");
  }

  // Find job and verify ownership
  const job = await Job.findById(jobId);
  if (!job) {
    throw new ErrorHandler(404, "Placement drive not found");
  }

  if (job.companyId.toString() !== company._id.toString()) {
    throw new ErrorHandler(403, "Access Denied: You do not own this job posting");
  }

  // Fetch applications
  const applications = await Application.find({ jobId })
    .populate({
      path: "studentId",
      select: "name email rollNumber branch year cgpa skills resumeUrl phone isPlaced projects",
    });

  const analyses = await ResumeAnalysis.find({ jobId });
  const progressList = await StudentProgress.find({ jobId });

  const applicationsWithAts = applications.map(app => {
    if (!app.studentId) return app.toObject();
    
    const analysis = analyses.find(a => a.applicationId.toString() === app._id.toString());
    const progress = progressList.find(p => p.applicationId.toString() === app._id.toString());
    const appObj = app.toObject();

    if (analysis) {
      appObj.atsScore = analysis.atsScore;
      appObj.matchPercentage = analysis.matchPercentage;
      appObj.matchedSkills = analysis.skillsMatch || [];
      appObj.skillsMatch = analysis.skillsMatch || [];
      appObj.missingSkills = analysis.missingSkills || [];
      appObj.matchedKeywords = analysis.matchedKeywords || analysis.skillsMatch || [];
      appObj.missingKeywords = analysis.missingKeywords || analysis.missingSkills || [];
      appObj.resumeSummary = analysis.aiSummary || "";
      appObj.aiSummary = analysis.aiSummary || "";
      appObj.strengths = analysis.strengths || [];
      appObj.weaknesses = analysis.weaknesses || [];
      appObj.decision = analysis.status;
      appObj.reason = analysis.status === "Shortlisted" ? analysis.selectionReason : (analysis.rejectionReason || analysis.selectionReason);
      appObj.aiAnalysis = analysis;
    } else {
      // Calculate dynamic preview if database analysis record doesn't exist
      const score = calculateATSScore(app.studentId, job);
      appObj.atsScore = score;
      appObj.matchPercentage = score;
      appObj.matchedSkills = app.studentId.skills || [];
      appObj.skillsMatch = app.studentId.skills || [];
      appObj.missingSkills = [];
      appObj.matchedKeywords = app.studentId.skills || [];
      appObj.missingKeywords = [];
      appObj.resumeSummary = "AI Screening record missing. Showing profile preview match score.";
      appObj.aiSummary = "AI Screening record missing. Showing profile preview match score.";
      appObj.strengths = ["Database profile preview matched"];
      appObj.weaknesses = [];
      appObj.decision = score >= 80 ? "Shortlisted" : score >= (job.atsThreshold || 60) ? "Borderline" : "Rejected";
      appObj.reason = "Profile evaluation preview.";
    }

    if (progress) {
      appObj.progress = progress;
    }

    return appObj;
  });

  return res.status(200).json({
    jobTitle: job.title,
    job: job,
    applications: applicationsWithAts,
  });
});

// Propose evaluation round schedule to Placement Cell
module.exports.proposeSchedule = ErrorWrapper(async (req, res, next) => {
  const { jobId, numRounds, scheduleDate, studentsNeeded, message } = req.body;

  if (!jobId || !numRounds || !scheduleDate || !studentsNeeded) {
    throw new ErrorHandler(400, "jobId, numRounds, scheduleDate, and studentsNeeded are required");
  }

  const company = req.company;
  if (!company) {
    throw new ErrorHandler(404, "Recruiter company details not found");
  }

  const job = await Job.findById(jobId);
  if (!job) {
    throw new ErrorHandler(404, "Job drive not found");
  }

  // Find all placement cell users
  const User = require("../models/User");
  const placementCellUsers = await User.find({ role: "placementCell" });

  const formattedMsg = `Recruiter Schedule Proposal from ${company.name} for "${job.title}":
- Rounds: ${numRounds}
- Date/Time: ${new Date(scheduleDate).toLocaleString()}
- Students Target: ${studentsNeeded} students
- Message: ${message || 'No additional details.'}`;

  for (const cellUser of placementCellUsers) {
    const notif = new Notification({
      userId: cellUser._id,
      message: formattedMsg,
      type: "schedule_propose"
    });
    await notif.save();
  }

  return res.status(200).json({
    message: "Schedule proposal successfully sent to Placement Cell coordinators!"
  });
});

// Submit shortlisted students to Placement Cell for scheduling
module.exports.submitShortlist = ErrorWrapper(async (req, res, next) => {
  const { jobId, roundName, roundDetails, studentIds, scheduledAt } = req.body;

  if (!jobId || !roundName || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
    throw new ErrorHandler(400, "jobId, roundName, and non-empty studentIds array are required");
  }

  const company = req.company;
  if (!company) {
    throw new ErrorHandler(404, "Recruiter company details not found");
  }

  const job = await Job.findById(jobId);
  if (!job) {
    throw new ErrorHandler(404, "Job drive not found");
  }

  // Create shortlist record
  const shortlist = new Shortlist({
    jobId,
    roundName,
    studentIds,
    roundDetails: roundDetails || "",
    scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
    status: "Pending",
  });
  await shortlist.save();

  // Automatically update student applications to Shortlisted
  await Application.updateMany(
    { jobId, studentId: { $in: studentIds } },
    { $set: { status: "Shortlisted" } }
  );

  // Find all placement cell users
  const User = require("../models/User");
  const placementCellUsers = await User.find({ role: "placementCell" });

  // Notify placement cell
  for (const cellUser of placementCellUsers) {
    const notif = new Notification({
      userId: cellUser._id,
      message: `New Shortlist Submitted by ${company.name} for "${job.title}" - ${roundName} round is pending scheduling.`,
      type: "general"
    });
    await notif.save();
  }

  return res.status(201).json({
    message: "Shortlist successfully submitted to Placement Cell for scheduling!",
    shortlist
  });
});

// Get Company's Offer Letter template
module.exports.getOfferTemplate = ErrorWrapper(async (req, res, next) => {
  const company = req.company;
  if (!company) {
    throw new ErrorHandler(404, "Recruiter company details not found");
  }
  return res.status(200).json({
    offerLetterTemplate: company.offerLetterTemplate || ""
  });
});

// Update Company's Offer Letter template
module.exports.updateOfferTemplate = ErrorWrapper(async (req, res, next) => {
  const { offerLetterTemplate } = req.body;
  const company = req.company;
  if (!company) {
    throw new ErrorHandler(404, "Recruiter company details not found");
  }
  company.offerLetterTemplate = offerLetterTemplate;
  await company.save();
  return res.status(200).json({
    message: "Offer letter template updated successfully",
    offerLetterTemplate: company.offerLetterTemplate
  });
});

// Bulk shortlist candidates using ATS score
module.exports.atsShortlist = ErrorWrapper(async (req, res, next) => {
  const { jobId } = req.params;
  const { threshold, roundName } = req.body;

  if (threshold === undefined || !roundName) {
    throw new ErrorHandler(400, "threshold and roundName are required");
  }

  const company = req.company;
  if (!company) {
    throw new ErrorHandler(404, "Recruiter company details not found");
  }

  const job = await Job.findById(jobId);
  if (!job) {
    throw new ErrorHandler(404, "Job drive not found");
  }

  if (job.companyId.toString() !== company._id.toString()) {
    throw new ErrorHandler(403, "Access Denied: You do not own this job posting");
  }

  // Fetch all applications in "Applied" state for this job
  const applications = await Application.find({ jobId, status: "Applied" })
    .populate({
      path: "studentId",
      select: "name email rollNumber branch year cgpa skills resumeUrl phone isPlaced projects userId",
    });

  const analyses = await ResumeAnalysis.find({ jobId });

  let processedCount = 0;
  for (const app of applications) {
    if (!app.studentId) continue;
    
    // Fetch score from ResumeAnalysis if exists, else fallback to calculateATSScore
    const analysis = analyses.find(a => a.applicationId.toString() === app._id.toString());
    const score = analysis ? analysis.atsScore : calculateATSScore(app.studentId, job);

    if (score >= threshold) {
      app.status = "Shortlisted";
      
      const roundIdx = app.rounds.findIndex(r => r.name.toLowerCase() === roundName.toLowerCase());
      if (roundIdx > -1) {
        app.rounds[roundIdx].result = "Passed";
        app.rounds[roundIdx].notes = `Passed ATS Resume shortlisting (Score: ${score}%)`;
      } else {
        app.rounds.push({
          name: roundName,
          result: "Passed",
          scheduledAt: new Date(),
          notes: `Passed ATS Resume shortlisting (Score: ${score}%)`
        });
      }
      await app.save();

      // Create notification
      const notif = new Notification({
        userId: app.studentId.userId,
        message: `Congratulations! You have been shortlisted via ATS for the ${roundName} round of ${job.title} at ${company.name} (Score: ${score}%).`,
        type: "application_status",
      });
      await notif.save();

      processedCount++;
    }
  }

  return res.status(200).json({
    message: `ATS Shortlisting processed. Shortlisted ${processedCount} candidates with ATS score >= ${threshold}%.`,
    shortlistedCount: processedCount
  });
});

// Upload round-wise CSV results (now immediately processed!)
module.exports.uploadRoundResults = ErrorWrapper(async (req, res, next) => {
  const { jobId } = req.params;
  const { roundId } = req.body;

  if (!roundId) {
    throw new ErrorHandler(400, "Round ID is required");
  }

  if (!req.file) {
    throw new ErrorHandler(400, "Please upload a CSV file containing candidate results");
  }

  const company = req.company;
  if (!company) {
    throw new ErrorHandler(404, "Recruiter company details not found");
  }

  const job = await Job.findById(jobId);
  if (!job) {
    throw new ErrorHandler(404, "Job drive not found");
  }

  if (job.companyId.toString() !== company._id.toString()) {
    throw new ErrorHandler(403, "Access Denied: You do not own this job posting");
  }

  const round = await Round.findById(roundId);
  if (!round) {
    throw new ErrorHandler(404, "Round not found");
  }

  // Parse CSV
  const csvContent = req.file.buffer.toString("utf8");
  const lines = csvContent.split(/\r?\n/);
  
  const resultsList = [];
  const errors = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;
    
    const cols = line.split(",").map(col => col.trim().replace(/^["']|["']$/g, ""));
    if (cols.length === 0 || !cols[0]) continue;

    // Header row check
    if (i === 0 && (cols[0].toLowerCase() === "email" || cols[0].toLowerCase() === "rollnumber" || cols[0].toLowerCase() === "roll number" || cols[0].toLowerCase() === "student" || cols[0].toLowerCase() === "studentid")) {
      continue;
    }

    const identifier = cols[0]; // Roll number or email
    let resultVal = cols[1];  // Selected, Rejected, Absent, Waiting
    const scoreVal = parseFloat(cols[2]) || 0;
    const remarksVal = cols[3] || "Uploaded via CSV";

    const validResults = ["Selected", "Rejected", "Absent", "Waiting"];
    
    // Map common inputs (Passed -> Selected, Failed -> Rejected)
    if (resultVal) {
      if (resultVal.toLowerCase() === "passed") resultVal = "Selected";
      else if (resultVal.toLowerCase() === "failed") resultVal = "Rejected";
      else {
        // Capitalize first letter
        resultVal = resultVal.charAt(0).toUpperCase() + resultVal.slice(1).toLowerCase();
      }
    }

    if (!resultVal || !validResults.includes(resultVal)) {
      errors.push(`Line ${i + 1}: Invalid result value "${resultVal}". Must be Selected, Rejected, Absent, or Waiting.`);
      continue;
    }

    // Find student
    const student = await Student.findOne({
      $or: [{ rollNumber: identifier }, { email: identifier }]
    });

    if (!student) {
      errors.push(`Line ${i + 1}: Student with identifier "${identifier}" not found`);
      continue;
    }

    // Verify application exists
    const app = await Application.findOne({ studentId: student._id, jobId: job._id });
    if (!app) {
      errors.push(`Line ${i + 1}: Student "${student.name}" has not applied to this drive`);
      continue;
    }

    resultsList.push({
      studentId: student._id,
      result: resultVal,
      score: scoreVal,
      remarks: remarksVal
    });
  }

  if (resultsList.length === 0) {
    throw new ErrorHandler(400, "No valid candidate rows could be processed. Errors: " + errors.join("; "));
  }

  // Process all results immediately!
  for (const resItem of resultsList) {
    await processCandidateResult({
      jobId: job._id,
      roundId,
      studentId: resItem.studentId,
      result: resItem.result,
      score: resItem.score,
      remarks: resItem.remarks,
      recruiterUserId: req.user.id
    });
  }

  return res.status(200).json({
    message: `Results processed successfully! Evaluated ${resultsList.length} candidates.`,
    resultsCount: resultsList.length,
    errors: errors.length > 0 ? errors : undefined
  });
});

// Override AI Decision manual action
module.exports.overrideDecision = ErrorWrapper(async (req, res, next) => {
  const { appId } = req.params;
  const { status, reason } = req.body;

  if (!status || !["Shortlisted", "Rejected"].includes(status)) {
    throw new ErrorHandler(400, "Invalid status override. Must be Shortlisted or Rejected");
  }

  const app = await Application.findById(appId)
    .populate("studentId")
    .populate({
      path: "jobId",
      populate: { path: "companyId", select: "name" }
    });

  if (!app) {
    throw new ErrorHandler(404, "Application not found");
  }

  const student = app.studentId;
  const job = app.jobId;
  const company = job.companyId;

  // Find or create ResumeAnalysis
  let analysis = await ResumeAnalysis.findOne({ applicationId: appId });
  if (!analysis) {
    analysis = new ResumeAnalysis({
      applicationId: appId,
      studentId: student._id,
      jobId: job._id,
      atsScore: 70, // default override score
      matchPercentage: 70,
      status: status
    });
  }

  analysis.isOverridden = true;
  analysis.originalStatus = analysis.status;
  analysis.status = status;
  analysis.overrideReason = reason || "Recruiter manual override";
  analysis.overriddenBy = req.user.id;
  await analysis.save();

  // Update Application overall status
  app.status = status;

  // Find or create StudentProgress
  let progress = await StudentProgress.findOne({ applicationId: appId });
  if (!progress) {
    progress = new StudentProgress({
      applicationId: appId,
      studentId: student._id,
      jobId: job._id,
    });
  }

  let progressStatus = "";
  let roundsList = [...app.rounds];

  if (status === "Shortlisted") {
    // Passed Applied stage
    const appliedRoundIdx = app.rounds.findIndex(r => r.name.toLowerCase() === "applied");
    if (appliedRoundIdx > -1) {
      app.rounds[appliedRoundIdx].result = "Passed";
    }

    // Handle Resume Screening round
    const screeningRoundIdx = roundsList.findIndex(r => r.name.toLowerCase() === "resume screening" || r.name.toLowerCase() === "ai screening");
    if (screeningRoundIdx > -1) {
      roundsList[screeningRoundIdx].result = "Passed";
      roundsList[screeningRoundIdx].notes = reason || "Approved by recruiter manual override";
    } else {
      roundsList.push({
        name: "Resume Screening",
        result: "Passed",
        scheduledAt: new Date(),
        notes: reason || "Approved by recruiter manual override"
      });
    }

    // Set up first round
    const firstRound = await Round.findOne({ jobId: job._id }).sort({ sequence: 1 });
    let currentRoundId = null;
    if (firstRound) {
      currentRoundId = firstRound._id;
      progressStatus = `Round 1: ${firstRound.name}`;
      
      const rIdx = roundsList.findIndex(r => r.name.toLowerCase() === firstRound.name.toLowerCase());
      if (rIdx === -1) {
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
        roundsList[rIdx].result = "Pending";
      }
    } else {
      progressStatus = "Shortlisted";
    }

    progress.currentRoundIndex = 0;
    progress.currentRoundId = currentRoundId;
    progress.status = progressStatus;
    
    app.rounds = roundsList;
  } else {
    // Rejected
    progressStatus = "Rejected";
    progress.status = "Rejected";
    progress.history.push({
      roundName: "AI Screening Override",
      result: "Rejected",
      remarks: reason || "Manually overridden to Rejected"
    });

    // Reset rounds to only keep Applied and Resume Screening
    roundsList = roundsList.filter(r => r.name.toLowerCase() === "applied" || r.name.toLowerCase() === "resume screening" || r.name.toLowerCase() === "ai screening");
    
    const appliedRoundIdx = roundsList.findIndex(r => r.name.toLowerCase() === "applied");
    if (appliedRoundIdx > -1) {
      roundsList[appliedRoundIdx].result = "Passed";
    }

    const screeningRoundIdx = roundsList.findIndex(r => r.name.toLowerCase() === "resume screening" || r.name.toLowerCase() === "ai screening");
    if (screeningRoundIdx > -1) {
      roundsList[screeningRoundIdx].result = "Failed";
      roundsList[screeningRoundIdx].notes = reason || "Rejected by recruiter manual override";
    } else {
      roundsList.push({
        name: "Resume Screening",
        result: "Failed",
        scheduledAt: new Date(),
        notes: reason || "Rejected by recruiter manual override"
      });
    }

    app.rounds = roundsList;
  }

  await progress.save();
  app.markModified("rounds");
  await app.save();

  // Notify student
  const overrideNotif = new Notification({
    userId: student.userId,
    message: `Recruiter manual review: Your application status for ${job.title} at ${company.name} has been updated to ${status}.`,
    type: "application_status"
  });
  await overrideNotif.save();

  await sendEmail({
    to: student.email,
    subject: `Application Update: Manual Review for ${job.title} at ${company.name}`,
    html: `
      <h3>Hello ${student.name},</h3>
      <p>Your application status has been updated after a manual review by the recruiter.</p>
      <p><strong>New Status:</strong> ${status}</p>
      <p><strong>Review Remarks:</strong> ${reason || "No extra notes provided."}</p>
      <br/>
      <p>Log in to the placement portal to check details.</p>
    `
  }).catch(err => console.error("Override email delivery failed:", err));

  return res.status(200).json({
    message: `Manual decision override successfully processed to ${status}.`,
    application: app,
    analysis
  });
});

// Dynamic Round Management: Get rounds
module.exports.getRounds = ErrorWrapper(async (req, res, next) => {
  const { jobId } = req.params;
  const rounds = await Round.find({ jobId }).sort({ sequence: 1 });
  return res.status(200).json({ rounds });
});

// Dynamic Round Management: Create round
module.exports.createRound = ErrorWrapper(async (req, res, next) => {
  const { jobId } = req.params;
  const { name, description, date, time, mode, meetingLink, platform, instructions } = req.body;

  if (!name) {
    throw new ErrorHandler(400, "Round name is required");
  }

  const job = await Job.findById(jobId);
  if (!job) {
    throw new ErrorHandler(404, "Job drive not found");
  }

  const roundsCount = await Round.countDocuments({ jobId });

  const newRound = new Round({
    jobId,
    name,
    description: description || "",
    sequence: roundsCount + 1,
    date: date ? new Date(date) : undefined,
    time: time || "",
    mode: mode || "Online",
    meetingLink: meetingLink || "",
    platform: platform || "Google Meet",
    instructions: instructions || ""
  });

  await newRound.save();

  // Sync Job.rounds
  job.rounds.push({
    number: newRound.sequence,
    name: newRound.name,
    description: newRound.description,
    date: newRound.date,
    time: newRound.time,
    mode: newRound.mode,
    platform: newRound.platform,
    meetingLink: newRound.meetingLink,
    instructions: newRound.instructions
  });
  await job.save();

  return res.status(201).json({
    message: "Hiring round created successfully",
    round: newRound
  });
});

// Dynamic Round Management: Update round
module.exports.updateRound = ErrorWrapper(async (req, res, next) => {
  const { roundId } = req.params;
  const { name, description, date, time, mode, meetingLink, platform, instructions } = req.body;

  const round = await Round.findById(roundId);
  if (!round) {
    throw new ErrorHandler(404, "Round details not found");
  }

  if (name) round.name = name;
  if (description !== undefined) round.description = description;
  if (date !== undefined) round.date = date ? new Date(date) : null;
  if (time !== undefined) round.time = time;
  if (mode) round.mode = mode;
  if (meetingLink !== undefined) round.meetingLink = meetingLink;
  if (platform !== undefined) round.platform = platform;
  if (instructions !== undefined) round.instructions = instructions;

  await round.save();

  // Sync with Job.rounds
  const job = await Job.findById(round.jobId);
  if (job) {
    const allRounds = await Round.find({ jobId: job._id }).sort({ sequence: 1 });
    job.rounds = allRounds.map(r => ({
      number: r.sequence,
      name: r.name,
      description: r.description,
      date: r.date,
      time: r.time,
      mode: r.mode,
      platform: r.platform,
      meetingLink: r.meetingLink,
      instructions: r.instructions
    }));
    await job.save();
  }

  return res.status(200).json({
    message: "Hiring round updated successfully",
    round
  });
});

// Dynamic Round Management: Delete round
module.exports.deleteRound = ErrorWrapper(async (req, res, next) => {
  const { roundId } = req.params;

  const round = await Round.findById(roundId);
  if (!round) {
    throw new ErrorHandler(404, "Round details not found");
  }

  const jobId = round.jobId;
  await Round.findByIdAndDelete(roundId);

  // Re-sequence remaining rounds
  const remaining = await Round.find({ jobId }).sort({ sequence: 1 });
  for (let i = 0; i < remaining.length; i++) {
    remaining[i].sequence = i + 1;
    await remaining[i].save();
  }

  // Sync Job.rounds
  const job = await Job.findById(jobId);
  if (job) {
    job.rounds = remaining.map(r => ({
      number: r.sequence,
      name: r.name,
      description: r.description,
      date: r.date,
      time: r.time,
      mode: r.mode,
      platform: r.platform,
      meetingLink: r.meetingLink,
      instructions: r.instructions
    }));
    await job.save();
  }

  return res.status(200).json({
    message: "Hiring round deleted successfully"
  });
});

// Manual Candidate Result Marking
module.exports.manualRoundResults = ErrorWrapper(async (req, res, next) => {
  const { jobId, roundId } = req.params;
  const { results } = req.body; // array of { studentId, result, score, remarks }

  if (!results || !Array.isArray(results) || results.length === 0) {
    throw new ErrorHandler(400, "results array is required and cannot be empty");
  }

  for (const resItem of results) {
    await processCandidateResult({
      jobId,
      roundId,
      studentId: resItem.studentId,
      result: resItem.result,
      score: resItem.score || 0,
      remarks: resItem.remarks || "",
      recruiterUserId: req.user.id
    });
  }

  return res.status(200).json({
    message: `Successfully processed results for ${results.length} candidates.`
  });
});

