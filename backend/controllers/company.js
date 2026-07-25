const Job = require("../models/job");
const Company = require("../models/company");
const Student = require("../models/student");
const Application = require("../models/application");
const Shortlist = require("../models/shortlist");
const Notification = require("../models/notification");
const ResultApproval = require("../models/resultApproval");
const ErrorWrapper = require("../utils/ErrorWrapper");
const ErrorHandler = require("../utils/ErrorHandle");

function calculateATSScore(student, job) {
  if (!student || !job) return 0;
  
  const jobText = `${job.title} ${job.description}`.toLowerCase();
  let matches = 0;
  let totalItemsChecked = 0;
  
  if (student.skills && student.skills.length > 0) {
    for (const skill of student.skills) {
      if (!skill) continue;
      totalItemsChecked++;
      if (jobText.includes(skill.toLowerCase())) {
        matches++;
      }
    }
  }
  
  if (student.projects && student.projects.length > 0) {
    for (const proj of student.projects) {
      if (proj.techStack && proj.techStack.length > 0) {
        for (const tech of proj.techStack) {
          if (!tech) continue;
          totalItemsChecked++;
          if (jobText.includes(tech.toLowerCase())) {
            matches++;
          }
        }
      }
    }
  }
  
  let skillScore = 0;
  if (totalItemsChecked > 0) {
    skillScore = (matches / totalItemsChecked) * 80;
  } else {
    skillScore = 30;
  }
  
  let cgpaScore = 0;
  const reqCgpa = job.eligibility?.cgpa || 0;
  const studentCgpa = student.cgpa || 0;
  if (studentCgpa >= reqCgpa) {
    cgpaScore = 20;
  }
  
  return Math.min(100, Math.max(10, Math.round(skillScore + cgpaScore)));
}

// Post a new job drive
module.exports.postJob = ErrorWrapper(async (req, res, next) => {
  const { title, description, package, eligibility, deadline, rounds } = req.body;

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
    eligibility: {
      cgpa,
      branches,
      years,
    },
    deadline: new Date(deadline),
    rounds: rounds || [],
  });

  const savedJob = await newJob.save();

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

  const applicationsWithAts = applications.map(app => {
    if (!app.studentId) return app.toObject();
    const atsScore = calculateATSScore(app.studentId, job);
    const appObj = app.toObject();
    appObj.atsScore = atsScore;
    return appObj;
  });

  return res.status(200).json({
    jobTitle: job.title,
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

  let processedCount = 0;
  for (const app of applications) {
    if (!app.studentId) continue;
    const score = calculateATSScore(app.studentId, job);
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

// Upload round-wise CSV results pending TPO approval
module.exports.uploadRoundResults = ErrorWrapper(async (req, res, next) => {
  const { jobId } = req.params;
  const { roundName } = req.body;

  if (!roundName) {
    throw new ErrorHandler(400, "Round name is required");
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
    if (i === 0 && (cols[0].toLowerCase() === "email" || cols[0].toLowerCase() === "rollnumber" || cols[0].toLowerCase() === "roll number" || cols[0].toLowerCase() === "student")) {
      continue;
    }

    const identifier = cols[0]; // Roll number or email
    const resultVal = cols[1];  // Passed or Failed
    const notesVal = cols[2] || "Uploaded via CSV";

    if (!resultVal || (resultVal.toLowerCase() !== "passed" && resultVal.toLowerCase() !== "failed")) {
      errors.push(`Line ${i + 1}: Invalid result value "${resultVal}". Must be "Passed" or "Failed"`);
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
      result: resultVal.toLowerCase() === "passed" ? "Passed" : "Failed",
      notes: notesVal
    });
  }

  if (resultsList.length === 0) {
    throw new ErrorHandler(400, "No valid candidate rows could be processed. Errors: " + errors.join("; "));
  }

  // Save ResultApproval pending Placement Cell approval
  const newApproval = new ResultApproval({
    jobId: job._id,
    roundName,
    results: resultsList,
    status: "Pending Approval",
    uploadedBy: req.user.id
  });
  await newApproval.save();

  // Notify Placement Cell (TPO)
  const User = require("../models/User");
  const tpoUsers = await User.find({ role: "placementCell" });
  for (const tpo of tpoUsers) {
    const notif = new Notification({
      userId: tpo._id,
      message: `Recruiter at ${company.name} uploaded results for ${roundName} round of "${job.title}". Pending your approval.`,
      type: "general"
    });
    await notif.save();
  }

  return res.status(200).json({
    message: `Uploaded successfully! ${resultsList.length} candidate results submitted for Placement Cell approval.`,
    resultsCount: resultsList.length,
    errors: errors.length > 0 ? errors : undefined
  });
});

