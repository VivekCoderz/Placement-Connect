const Job = require("../models/job");
const Student = require("../models/student");
const Company = require("../models/company");
const Application = require("../models/application");
const Shortlist = require("../models/shortlist");
const Notification = require("../models/notification");
const ResultApproval = require("../models/resultApproval");
const ErrorWrapper = require("../utils/ErrorWrapper");
const ErrorHandler = require("../utils/ErrorHandle");
const { sendEmail, generateICS } = require("../utils/email");

// Upload round-wise CSV shortlist and notify students
module.exports.uploadShortlist = ErrorWrapper(async (req, res, next) => {
  const { jobId, roundName, rejectOthers } = req.body;
  const shouldRejectOthers = rejectOthers === "true" || rejectOthers === true;

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
  const studentIdsSet = new Set(studentIds.map(id => id.toString()));

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

      // Send email (non-blocking)
      sendEmail({
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
      }).catch(err => console.error("Email send error:", err));

      processedStudents.push(student.name);
    }
  }

  // Auto-reject non-shortlisted active applicants
  let rejectedCount = 0;
  if (shouldRejectOthers) {
    const activeApps = await Application.find({
      jobId: job._id,
      status: { $in: ["Applied", "Shortlisted"] }
    }).populate("studentId");

    for (const app of activeApps) {
      if (app.studentId && !studentIdsSet.has(app.studentId._id.toString())) {
        app.status = "Rejected";

        // Check if this round already exists
        const roundIdx = app.rounds.findIndex(r => r.name.toLowerCase() === roundName.toLowerCase());
        if (roundIdx > -1) {
          app.rounds[roundIdx].result = "Failed";
          app.rounds[roundIdx].notes = "Not in the shortlist CSV";
        } else {
          app.rounds.push({
            name: roundName,
            result: "Failed",
            scheduledAt: new Date(),
            notes: "Not in the shortlist CSV",
          });
        }
        await app.save();

        const notif = new Notification({
          userId: app.studentId.userId,
          message: `Application Update: You were not shortlisted for the ${roundName} round of ${job.title} at ${company.name}.`,
          type: "application_status",
        });
        await notif.save();

        // Send email (non-blocking)
        sendEmail({
          to: app.studentId.email,
          subject: `Status Update: ${roundName} Round for ${job.title} at ${company.name}`,
          html: `
            <h3>Dear ${app.studentId.name},</h3>
            <p>Thank you for your interest and participation in the selection process for <strong>${job.title}</strong> at <strong>${company.name}</strong>.</p>
            <p>We regret to inform you that you have not cleared the <strong>${roundName}</strong> round. Your application has been updated accordingly.</p>
            <p>We wish you the very best for other ongoing and future placement drives.</p>
            <br/>
            <p>Regards,</p>
            <p>Training & Placement Cell, Geeta University</p>
          `,
        }).catch(err => console.error("Email send error for rejection:", err));

        rejectedCount++;
      }
    }
  }

  // Create shortlist record
  const shortlistRecord = new Shortlist({
    jobId: job._id,
    roundName,
    studentIds,
  });
  await shortlistRecord.save();

  let message = `Shortlist uploaded and processed successfully. Updated ${processedStudents.length} student application(s) to shortlisted.`;
  if (shouldRejectOthers) {
    message += ` Auto-rejected ${rejectedCount} non-selected applicant(s).`;
  }

  return res.status(200).json({
    message,
    shortlistedCount: studentIds.length,
    processedStudents,
    rejectedCount,
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

      // Send Email (non-blocking)
      sendEmail({
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
      }).catch(emailErr => console.error("Failed to send email notification:", emailErr));
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

      // Send Email (non-blocking)
      sendEmail({
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
      }).catch(emailErr => console.error("Failed to send email notification:", emailErr));
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
  const { scheduledAt, message, roundType, testLink, venue } = req.body;

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
  const isOnline = roundType === "Online";

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
        roundType: roundType || "Online",
        testLink: testLink || "",
        venue: venue || "",
      };

      const roundIdx = app.rounds.findIndex(r => r.name.toLowerCase() === roundName.toLowerCase());
      if (roundIdx > -1) {
        app.rounds[roundIdx].scheduledAt = start;
        app.rounds[roundIdx].notes = notesText;
        if (roundType) app.rounds[roundIdx].roundType = roundType;
        if (testLink) app.rounds[roundIdx].testLink = testLink;
        if (venue) app.rounds[roundIdx].venue = venue;
      } else {
        app.rounds.push(roundData);
      }
      await app.save();

      // Create notification
      const notif = new Notification({
        userId: student.userId,
        message: `Evaluation Scheduled: Your ${roundName} (${roundType || "Online"}) round for ${job.title} at ${company.name} is on ${start.toLocaleString()}. ${isOnline ? `Link: ${testLink || "TBA"}` : `Venue: ${venue || "Placement Cell"}`}`,
        type: "interview_scheduled",
      });
      await notif.save();

      // Generate ICS Calendar File
      const icsContent = generateICS({
        start,
        end,
        summary: `${roundName}: ${job.title} at ${company.name}`,
        description: `You have an interview round scheduled for ${job.title} at ${company.name}. \nRound Type: ${roundType || "Online"}\n${isOnline ? `Test Link: ${testLink || "TBA"}` : `Venue: ${venue || "Placement Cell"}`}\nInstructions: ${notesText}`,
        location: isOnline ? (testLink || "Online Interview (Teams/Meet/Zoom)") : (venue || "Campus Placement Cell"),
        studentName: student.name,
        studentEmail: student.email,
      });

      // Send email (non-blocking)
      sendEmail({
        to: student.email,
        subject: `Schedule Update: ${roundName} Round for ${job.title} at ${company.name}`,
        html: `
          <h3>Dear ${student.name},</h3>
          <p>We are pleased to inform you that the placement selection round for <strong>${job.title}</strong> at <strong>${company.name}</strong> has been scheduled.</p>
          <div style="background:#f1f5f9; padding: 15px; border-left: 4px solid #10b981; margin: 15px 0;">
            <p><strong>Round Name:</strong> ${roundName}</p>
            <p><strong>Scheduled Time:</strong> ${start.toLocaleString()}</p>
            <p><strong>Round Type:</strong> ${roundType || "Online"}</p>
            ${isOnline ? `<p><strong>Test Link:</strong> <a href="${testLink}">${testLink || "TBA"}</a></p>` : `<p><strong>Venue:</strong> ${venue || "Placement Cell"}</p>`}
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
      }).catch(err => console.error("Email send error:", err));

      processedCount++;
    }
  }

  return res.status(200).json({
    message: `Successfully scheduled round and notified ${processedCount} shortlisted student(s).`,
    processedCount,
  });
});

// Fetch all result approvals
module.exports.getResultApprovals = ErrorWrapper(async (req, res, next) => {
  const approvals = await ResultApproval.find()
    .populate({
      path: "jobId",
      populate: { path: "companyId", select: "name" },
    })
    .populate({
      path: "results.studentId",
      select: "name email rollNumber branch year cgpa",
    })
    .populate("uploadedBy", "name email")
    .sort({ createdAt: -1 });

  return res.status(200).json({ approvals });
});

// Approve uploaded round results and apply updates to applications
module.exports.approveResult = ErrorWrapper(async (req, res, next) => {
  const { id } = req.params;

  const approval = await ResultApproval.findById(id)
    .populate({
      path: "jobId",
      populate: { path: "companyId", select: "name" },
    });

  if (!approval) {
    throw new ErrorHandler(404, "Result approval request not found");
  }

  if (approval.status !== "Pending Approval") {
    throw new ErrorHandler(400, `Result approval has already been ${approval.status}`);
  }

  const job = approval.jobId;
  const company = job.companyId;
  const roundName = approval.roundName;

  // Process each result item
  for (const item of approval.results) {
    const studentId = item.studentId;
    const result = item.result; // "Passed" or "Failed"
    const notes = item.notes || "";

    const app = await Application.findOne({ studentId, jobId: job._id }).populate("studentId");
    if (!app) continue;

    // Update round-by-round status
    const roundIdx = app.rounds.findIndex(r => r.name.toLowerCase() === roundName.toLowerCase());
    
    if (roundIdx > -1) {
      app.rounds[roundIdx].result = result;
      app.rounds[roundIdx].notes = notes;
    } else {
      app.rounds.push({
        name: roundName,
        result,
        scheduledAt: new Date(),
        notes,
      });
    }

    // If candidate failed, overall status is Rejected
    if (result === "Failed") {
      app.status = "Rejected";
    } else if (result === "Passed") {
      app.status = "Shortlisted";
    }

    app.markModified("rounds");
    await app.save();

    // Create Notification for Student
    const student = app.studentId;
    if (student) {
      const message = result === "Passed"
        ? `Congratulations! You have passed the ${roundName} round for ${job.title} at ${company.name}.`
        : `Update: You were not selected in the ${roundName} round for ${job.title} at ${company.name}.`;

      const notif = new Notification({
        userId: student.userId,
        message,
        type: "application_status",
      });
      await notif.save();

      // Send Email Notification
      sendEmail({
        to: student.email,
        subject: `Placement Round Update: ${roundName} for ${job.title} at ${company.name}`,
        html: `
          <h3>Dear ${student.name},</h3>
          <p>We have an update regarding your application for <strong>${job.title}</strong> at <strong>${company.name}</strong>.</p>
          <div style="background:#f1f5f9; padding: 15px; border-left: 4px solid ${result === 'Passed' ? '#10b981' : '#f43f5e'}; margin: 15px 0;">
            <p><strong>Round Name:</strong> ${roundName}</p>
            <p><strong>Result:</strong> <strong style="color: ${result === 'Passed' ? '#10b981' : '#f43f5e'};">${result}</strong></p>
            ${notes ? `<p><strong>Feedback:</strong> ${notes}</p>` : ""}
          </div>
          <p>Please log in to PlacementConnect to track your applications and check other drives.</p>
          <br/>
          <p>Regards,</p>
          <p>Training & Placement Cell, Geeta University</p>
        `,
      }).catch(err => console.error("Result update email error:", err));
    }
  }

  // Update ResultApproval state
  approval.status = "Approved";
  await approval.save();

  // Notify recruiter
  const companyUser = await Company.findOne({ _id: job.companyId });
  if (companyUser) {
    const notif = new Notification({
      userId: companyUser.recruiterId,
      message: `Placement Cell approved your round results for ${roundName} round of "${job.title}". Student statuses have been updated.`,
      type: "general"
    });
    await notif.save();
  }

  return res.status(200).json({
    message: "Round results approved and candidate applications updated successfully",
    approval,
  });
});

// Reject uploaded round results
module.exports.rejectResult = ErrorWrapper(async (req, res, next) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason) {
    throw new ErrorHandler(400, "Rejection reason is required");
  }

  const approval = await ResultApproval.findById(id)
    .populate({
      path: "jobId",
      populate: { path: "companyId", select: "name" },
    });

  if (!approval) {
    throw new ErrorHandler(404, "Result approval request not found");
  }

  if (approval.status !== "Pending Approval") {
    throw new ErrorHandler(400, `Result approval has already been ${approval.status}`);
  }

  approval.status = "Rejected";
  approval.rejectionReason = reason;
  await approval.save();

  // Notify recruiter
  const job = approval.jobId;
  const companyUser = await Company.findOne({ _id: job.companyId });
  if (companyUser) {
    const notif = new Notification({
      userId: companyUser.recruiterId,
      message: `Placement Cell rejected your uploaded round results for ${approval.roundName} round of "${job.title}". Reason: ${reason}`,
      type: "general"
    });
    await notif.save();
  }

  return res.status(200).json({
    message: "Round results rejected successfully",
    approval,
  });
});

