const Job = require("../models/job");
const Student = require("../models/student");
const Company = require("../models/company");
const Application = require("../models/application");
const Notification = require("../models/notification");
const ErrorWrapper = require("../utils/ErrorWrapper");
const ErrorHandler = require("../utils/ErrorHandle");
const { sendEmail } = require("../utils/email");

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
    status: "Applied",
    rounds: [
      {
        name: "Applied",
        result: "Pending",
        scheduledAt: new Date(),
        notes: "Successfully applied to job drive",
      },
    ],
  });
  await newApplication.save();

  // 6. In-App notifications
  const studentNotification = new Notification({
    userId: req.user.id,
    message: `You successfully applied for ${job.title} at ${job.companyId.name}`,
    type: "application_status",
  });
  await studentNotification.save();

  // Notify recruiter
  const company = job.companyId;
  const recruiterNotification = new Notification({
    userId: company.recruiterId,
    message: `New applicant ${student.name} (${student.branch}) for your job posting: ${job.title}`,
    type: "general",
  });
  await recruiterNotification.save();

  // 7. Email notifications
  await sendEmail({
    to: student.email,
    subject: `Application Confirmed: ${job.title} at ${company.name}`,
    html: `
      <h2>Hello ${student.name},</h2>
      <p>Your application for <strong>${job.title}</strong> at <strong>${company.name}</strong> has been successfully received.</p>
      <p><strong>Package:</strong> ${job.package} LPA</p>
      <p>You can track your application status in the PlacementConnect dashboard.</p>
      <br/>
      <p>Regards,</p>
      <p>Geeta University Placement Cell</p>
    `,
  });

  return res.status(201).json({
    message: "Applied to placement drive successfully",
    application: newApplication,
  });
});
