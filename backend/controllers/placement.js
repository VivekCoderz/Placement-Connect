const Job = require("../models/job");
const Student = require("../models/student");
const Company = require("../models/company");
const Application = require("../models/application");
const Shortlist = require("../models/shortlist");
const Notification = require("../models/notification");
const ErrorWrapper = require("../utils/ErrorWrapper");
const ErrorHandler = require("../utils/ErrorHandle");
const { sendEmail } = require("../utils/email");

// Upload round-wise CSV shortlist and notify students
module.exports.uploadShortlist = ErrorWrapper(async (req, res, next) => {
  const { jobId, roundName } = req.body;

  if (!jobId || !roundName) {
    throw new ErrorHandler(400, "Job ID and Round Name are required");
  }

  if (!req.file) {
    throw new ErrorHandler(400, "Please upload a CSV file containing shortlisted student details");
  }

  const job = await Job.findById(jobId).populate("companyId");
  if (!job) {
    throw new ErrorHandler(404, "Placement drive job posting not found");
  }
  const company = job.companyId;

  // Convert buffer to text and parse lines
  const csvContent = req.file.buffer.toString("utf8");
  const lines = csvContent.split(/\r?\n/);
  
  const identifiers = [];
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    // Split by comma and clean quotes
    const cols = line.split(",").map(col => col.trim().replace(/^["']|["']$/g, ""));
    if (cols.length > 0 && cols[0]) {
      identifiers.push(cols[0]); // Could be email or roll number
    }
  }

  if (identifiers.length === 0) {
    throw new ErrorHandler(400, "The CSV file appears to be empty or improperly formatted");
  }

  // Find matching students
  const students = await Student.find({
    $or: [
      { rollNumber: { $in: identifiers } },
      { email: { $in: identifiers } },
    ],
  });

  if (students.length === 0) {
    return res.status(200).json({
      message: "No matching students found in the database for the identifiers in the CSV.",
      shortlistedCount: 0,
      studentIds: [],
    });
  }

  const studentIds = students.map(s => s._id);

  // Update applications & notify
  const processedStudents = [];
  for (const student of students) {
    const app = await Application.findOne({ studentId: student._id, jobId: job._id });
    if (app) {
      app.status = "Shortlisted";

      // Check if this round already exists
      const roundIdx = app.rounds.findIndex(r => r.name.toLowerCase() === roundName.toLowerCase());
      if (roundIdx > -1) {
        app.rounds[roundIdx].result = "Passed";
      } else {
        app.rounds.push({
          name: roundName,
          result: "Passed",
          scheduledAt: new Date(),
          notes: "Shortlisted via CSV upload",
        });
      }
      await app.save();

      const notif = new Notification({
        userId: student.userId,
        message: `Congratulations! You have been shortlisted for the ${roundName} round of ${job.title} at ${company.name}.`,
        type: "application_status",
      });
      await notif.save();

      // Send email
      await sendEmail({
        to: student.email,
        subject: `Shortlisted: ${roundName} Round for ${job.title} at ${company.name}`,
        html: `
          <h3>Dear ${student.name},</h3>
          <p>We are pleased to inform you that you have been shortlisted for the <strong>${roundName}</strong> selection round for <strong>${job.title}</strong> at <strong>${company.name}</strong>.</p>
          <p>Please log in to PlacementConnect to check details and prepare for the round.</p>
          <br/>
          <p>Regards,</p>
          <p>Training & Placement Cell, Geeta University</p>
        `,
      });

      processedStudents.push(student.name);
    }
  }

  // Create shortlist record
  const shortlistRecord = new Shortlist({
    jobId: job._id,
    roundName,
    studentIds,
  });
  await shortlistRecord.save();

  return res.status(200).json({
    message: `Shortlist uploaded and processed successfully. Updated ${processedStudents.length} student application(s).`,
    shortlistedCount: studentIds.length,
    processedStudents,
  });
});

// Get all drives / jobs in the system
module.exports.getDrives = ErrorWrapper(async (req, res, next) => {
  const drives = await Job.find().populate("companyId");
  return res.status(200).json({ drives });
});

// Get all applications in the system
module.exports.getApplications = ErrorWrapper(async (req, res, next) => {
  const { status, branch, companyId } = req.query;
  const filter = {};

  if (status) filter.status = status;

  if (companyId) {
    const jobs = await Job.find({ companyId });
    filter.jobId = { $in: jobs.map(j => j._id) };
  }

  let applications = await Application.find(filter)
    .populate({
      path: "studentId",
      select: "name email rollNumber branch year cgpa",
    })
    .populate({
      path: "jobId",
      populate: { path: "companyId", select: "name" },
    });

  // Filter by branch if requested (since branch is on Student document)
  if (branch) {
    applications = applications.filter(
      app => app.studentId && app.studentId.branch.toLowerCase() === branch.toLowerCase()
    );
  }

  return res.status(200).json({ applications });
});
