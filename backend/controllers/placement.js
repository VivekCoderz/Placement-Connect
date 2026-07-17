const Job = require("../models/job");
const Student = require("../models/student");
const Company = require("../models/company");
const Application = require("../models/application");
const Shortlist = require("../models/shortlist");
const Notification = require("../models/notification");
const ErrorWrapper = require("../utils/ErrorWrapper");
const ErrorHandler = require("../utils/ErrorHandle");
const { sendEmail, generateICS } = require("../utils/email");

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

// Send dynamic updates/notifications to students (general or drive-specific)
module.exports.notifyStudents = ErrorWrapper(async (req, res, next) => {
  const { jobId, message, roundName, roundDate } = req.body;

  if (!message) {
    throw new ErrorHandler(400, "Message is required");
  }

  let recipientCount = 0;

  if (jobId) {
    // Drive-specific notification
    const job = await Job.findById(jobId).populate("companyId");
    if (!job) {
      throw new ErrorHandler(404, "Placement drive job posting not found");
    }

    const applications = await Application.find({ jobId }).populate("studentId");
    for (const app of applications) {
      if (!app.studentId) continue;

      // Update rounds array if roundName and roundDate provided
      if (roundName) {
        const roundIdx = app.rounds.findIndex(r => r.name.toLowerCase() === roundName.toLowerCase());
        if (roundIdx > -1) {
          app.rounds[roundIdx].scheduledAt = roundDate ? new Date(roundDate) : new Date();
          app.rounds[roundIdx].notes = message;
        } else {
          app.rounds.push({
            name: roundName,
            result: "Pending",
            scheduledAt: roundDate ? new Date(roundDate) : new Date(),
            notes: message
          });
        }
        await app.save();
      }

      // Create notification
      const notif = new Notification({
        userId: app.studentId.userId,
        message: `Placement Cell Update [${job.companyId?.name || "Drive"} - ${job.title}]: ${message}`,
        type: "announcement"
      });
      await notif.save();

      // Send Email
      try {
        await sendEmail({
          to: app.studentId.email,
          subject: `Placement Cell Update: ${job.companyId?.name || "Drive"} | ${job.title}`,
          html: `
            <h3>Placement Cell Update</h3>
            <p>Dear ${app.studentId.name},</p>
            <p>An update has been posted for the <strong>${job.title}</strong> drive at <strong>${job.companyId?.name || "Company"}</strong>:</p>
            <blockquote style="background:#f1f5f9; padding: 15px; border-left: 4px solid #10b981; margin: 15px 0;">
              ${message}
            </blockquote>
            ${roundName ? `<p><strong>Round Name:</strong> ${roundName}</p>` : ''}
            ${roundDate ? `<p><strong>Scheduled Time:</strong> ${new Date(roundDate).toLocaleString()}</p>` : ''}
            <br/>
            <p>Regards,</p>
            <p>Training & Placement Cell, Geeta University</p>
          `
        });
      } catch (emailErr) {
        console.error("Failed to send email notification:", emailErr);
      }
      recipientCount++;
    }
  } else {
    // General campus notification
    const students = await Student.find();
    for (const student of students) {
      const notif = new Notification({
        userId: student.userId,
        message: `T&P Cell Campus Notification: ${message}`,
        type: "announcement"
      });
      await notif.save();

      try {
        await sendEmail({
          to: student.email,
          subject: `Campus Placement Notification from T&P Cell`,
          html: `
            <h3>Training & Placement Cell Announcement</h3>
            <p>Dear ${student.name},</p>
            <blockquote style="background:#f1f5f9; padding: 15px; border-left: 4px solid #10b981; margin: 15px 0;">
              ${message}
            </blockquote>
            <p>Please log in to your dashboard to stay updated on latest recruitment schedules.</p>
            <br/>
            <p>Regards,</p>
            <p>Training & Placement Cell, Geeta University</p>
          `
        });
      } catch (emailErr) {
        console.error("Failed to send email notification:", emailErr);
      }
      recipientCount++;
    }
  }

  return res.status(200).json({
    message: `Notification dispatched successfully to ${recipientCount} students.`,
    recipientCount
  });
});

// Get all shortlist submissions
module.exports.getShortlists = ErrorWrapper(async (req, res, next) => {
  const shortlists = await Shortlist.find()
    .populate({
      path: "jobId",
      populate: { path: "companyId", select: "name" },
    })
    .populate({
      path: "studentIds",
      select: "name email rollNumber branch year cgpa resumeUrl phone",
    })
    .sort({ createdAt: -1 });

  return res.status(200).json({ shortlists });
});

// Schedule a shortlist and notify students
module.exports.scheduleShortlist = ErrorWrapper(async (req, res, next) => {
  const { id } = req.params;
  const { scheduledAt, message } = req.body;

  if (!scheduledAt) {
    throw new ErrorHandler(400, "Schedule Date and Time is required");
  }

  const shortlist = await Shortlist.findById(id)
    .populate({
      path: "jobId",
      populate: { path: "companyId", select: "name" },
    })
    .populate("studentIds");

  if (!shortlist) {
    throw new ErrorHandler(404, "Shortlist submission not found");
  }

  const job = shortlist.jobId;
  const company = job.companyId;
  const roundName = shortlist.roundName;
  const start = new Date(scheduledAt);
  const end = new Date(start.getTime() + 60 * 60 * 1000); // Default 1 hour duration

  // Update shortlist status
  shortlist.status = "Scheduled";
  shortlist.scheduledAt = start;
  if (message) shortlist.roundDetails = message;
  await shortlist.save();

  const notesText = message || shortlist.roundDetails || "No additional instructions provided.";

  // Update applications & notify students
  let processedCount = 0;
  for (const student of shortlist.studentIds) {
    const app = await Application.findOne({ studentId: student._id, jobId: job._id });
    if (app) {
      app.status = "Shortlisted";

      const roundData = {
        name: roundName,
        result: "Pending",
        scheduledAt: start,
        notes: notesText,
      };

      const roundIdx = app.rounds.findIndex(r => r.name.toLowerCase() === roundName.toLowerCase());
      if (roundIdx > -1) {
        app.rounds[roundIdx].scheduledAt = start;
        app.rounds[roundIdx].notes = notesText;
      } else {
        app.rounds.push(roundData);
      }
      await app.save();

      // Create notification
      const notif = new Notification({
        userId: student.userId,
        message: `Evaluation Scheduled: Your ${roundName} round for ${job.title} at ${company.name} is on ${start.toLocaleString()}. Check email/invite.`,
        type: "interview_scheduled",
      });
      await notif.save();

      // Generate ICS Calendar File
      const icsContent = generateICS({
        start,
        end,
        summary: `${roundName}: ${job.title} at ${company.name}`,
        description: `You have an interview round scheduled for ${job.title} at ${company.name}. \nDetails/Venue: ${notesText}`,
        location: "Online / Campus Placement Cell",
        studentName: student.name,
        studentEmail: student.email,
      });

      // Send email
      await sendEmail({
        to: student.email,
        subject: `Schedule Update: ${roundName} Round for ${job.title} at ${company.name}`,
        html: `
          <h3>Dear ${student.name},</h3>
          <p>We are pleased to inform you that the placement selection round for <strong>${job.title}</strong> at <strong>${company.name}</strong> has been scheduled.</p>
          <div style="background:#f1f5f9; padding: 15px; border-left: 4px solid #10b981; margin: 15px 0;">
            <p><strong>Round Name:</strong> ${roundName}</p>
            <p><strong>Scheduled Time:</strong> ${start.toLocaleString()}</p>
            <p><strong>Instructions/Venue:</strong> ${notesText}</p>
          </div>
          <p>Please check the attached calendar invite for direct details and log in to PlacementConnect to track status.</p>
          <br/>
          <p>Regards,</p>
          <p>Training & Placement Cell, Geeta University</p>
        `,
        attachments: [
          {
            filename: "invite.ics",
            content: icsContent,
            contentType: "text/calendar",
          },
        ],
      });

      processedCount++;
    }
  }

  return res.status(200).json({
    message: `Successfully scheduled round and notified ${processedCount} shortlisted student(s).`,
    processedCount,
  });
});

