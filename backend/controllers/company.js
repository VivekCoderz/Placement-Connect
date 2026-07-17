const Job = require("../models/job");
const Company = require("../models/company");
const Student = require("../models/student");
const Application = require("../models/application");
const Shortlist = require("../models/shortlist");
const Notification = require("../models/notification");
const ErrorWrapper = require("../utils/ErrorWrapper");
const ErrorHandler = require("../utils/ErrorHandle");

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
      select: "name email rollNumber branch year cgpa skills resumeUrl phone isPlaced",
    });

  return res.status(200).json({
    jobTitle: job.title,
    applications,
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

