const Application = require("../models/application");
const Student = require("../models/student");
const Job = require("../models/job");
const Notification = require("../models/notification");
const ErrorWrapper = require("../utils/ErrorWrapper");
const ErrorHandler = require("../utils/ErrorHandle");
const { sendEmail, generateICS } = require("../utils/email");

module.exports.getMyApplications = ErrorWrapper(async (req, res, next) => {
  const student = await Student.findOne({ userId: req.user.id });
  if (!student) {
    throw new ErrorHandler(404, "Student profile not found");
  }

  const applications = await Application.find({ studentId: student._id })
    .populate({
      path: "jobId",
      populate: { path: "companyId", select: "name industry" },
    });

  return res.status(200).json({ applications });
});

module.exports.updateStatus = ErrorWrapper(async (req, res, next) => {
  const { id } = req.params;
  const { status, roundName, roundResult, scheduledAt, notes, roundType, testLink, venue } = req.body;

  const app = await Application.findById(id)
    .populate("studentId")
    .populate({
      path: "jobId",
      populate: { path: "companyId", select: "name" },
    });

  if (!app) {
    throw new ErrorHandler(404, "Application not found");
  }

  const student = app.studentId;
  const job = app.jobId;
  const company = job.companyId;

  // 1. Update offer letter PDF if uploaded
  if (req.file) {
    app.offerLetterUrl = req.file.path; // Cloudinary URL
  }

  // 2. Update overall status if provided
  if (status) {
    const validStatuses = ["Applied", "Shortlisted", "Selected", "Rejected"];
    if (!validStatuses.includes(status)) {
      throw new ErrorHandler(400, "Invalid application status");
    }
    app.status = status;

    if (status === "Selected" && student) {
      student.isPlaced = true;
      await student.save();
    }
  }

  // 3. Handle round updates
  if (roundName) {
    const roundIdx = app.rounds.findIndex(r => r.name.toLowerCase() === roundName.toLowerCase());

    const roundData = {
      name: roundName,
      result: roundResult || "Pending",
      notes: notes || "",
      roundType: roundType || "Online",
      testLink: testLink || "",
      venue: venue || "",
    };

    if (scheduledAt) {
      roundData.scheduledAt = new Date(scheduledAt);
    }

    if (roundIdx > -1) {
      if (roundResult) {
        app.rounds[roundIdx].result = roundResult;
        if (roundResult === "Failed") {
          app.status = "Rejected";
        }
      }
      if (scheduledAt) app.rounds[roundIdx].scheduledAt = new Date(scheduledAt);
      if (notes) app.rounds[roundIdx].notes = notes;
      if (roundType) app.rounds[roundIdx].roundType = roundType;
      if (testLink) app.rounds[roundIdx].testLink = testLink;
      if (venue) app.rounds[roundIdx].venue = venue;
    } else {
      if (roundResult === "Failed") {
        app.status = "Rejected";
      }
      app.rounds.push(roundData);
    }
    app.markModified("rounds");
  }

  await app.save();

  // 4. Send Notifications and Emails
  // If interview scheduled
  if (roundName && scheduledAt) {
    const start = new Date(scheduledAt);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour duration default
    const isOnline = roundType === "Online";

    const icsContent = generateICS({
      start,
      end,
      summary: `${roundName} Interview: ${job.title} at ${company.name}`,
      description: `You have an interview scheduled for ${job.title} at ${company.name}. \nRound Type: ${roundType || "Online"}\n${isOnline ? `Test Link: ${testLink || "TBA"}` : `Venue: ${venue || "Placement Cell"}`}\nNotes: ${notes || "None"}`,
      location: isOnline ? (testLink || "Online Interview (Teams/Meet/Zoom)") : (venue || "Campus Placement Cell"),
      studentName: student.name,
      studentEmail: student.email,
    });

    // Create Notification
    const notif = new Notification({
      userId: student.userId,
      message: `Interview Scheduled: ${roundName} (${roundType || "Online"}) for ${job.title} at ${company.name} on ${start.toLocaleString()}. ${isOnline ? `Link: ${testLink || "TBA"}` : `Venue: ${venue || "Placement Cell"}`}`,
      type: "interview_scheduled",
    });
    await notif.save();

    // Send calendar invite email (non-blocking)
    sendEmail({
      to: student.email,
      subject: `Interview Scheduled: ${roundName} Round for ${job.title} at ${company.name}`,
      html: `
        <h3>Dear ${student.name},</h3>
        <p>Your interview for the <strong>${roundName}</strong> round of <strong>${job.title}</strong> at <strong>${company.name}</strong> has been scheduled.</p>
        <p><strong>Time:</strong> ${start.toLocaleString()}</p>
        <p><strong>Round Type:</strong> ${roundType || "Online"}</p>
        ${isOnline ? `<p><strong>Test/Meeting Link:</strong> <a href="${testLink}">${testLink || "TBA"}</a></p>` : `<p><strong>Venue:</strong> ${venue || "Campus Placement Cell"}</p>`}
        ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ""}
        <p>Please find the attached calendar invite for details.</p>
        <br/>
        <p>Regards,</p>
        <p>Placement Cell, Geeta University</p>
      `,
      attachments: [
        {
          filename: "invite.ics",
          content: icsContent,
          contentType: "text/calendar",
        },
      ],
    }).catch(err => console.error("Email delivery failed:", err));
  } else if (status) {
    // If status changed (Selected/Rejected/Shortlisted)
    let message = "";
    let emailSubject = "";
    let emailHtml = "";

    if (status === "Selected") {
      message = `Congratulations! You have been selected for ${job.title} at ${company.name}.`;
      emailSubject = `Congratulations! Selection Offer: ${job.title} at ${company.name}`;
      emailHtml = `
        <h3>Dear ${student.name},</h3>
        <p>We are delighted to congratulate you on your selection for the position of <strong>${job.title}</strong> at <strong>${company.name}</strong>!</p>
        <p><strong>Package:</strong> ${job.package} LPA</p>
        ${app.offerLetterUrl ? `<p>Your offer letter has been uploaded. You can view or download it here: <a href="${app.offerLetterUrl}">Download Offer Letter PDF</a></p>` : ""}
        <br/>
        <p>We wish you all the best in your professional journey!</p>
        <p>Regards,</p>
        <p>Placement Cell, Geeta University</p>
      `;
    } else if (status === "Rejected") {
      message = `Application status update: You were not selected for ${job.title} at ${company.name}.`;
      emailSubject = `Placement Drive Status Update: ${job.title} at ${company.name}`;
      emailHtml = `
        <p>Dear ${student.name},</p>
        <p>Thank you for participating in the selection process for <strong>${job.title}</strong> at <strong>${company.name}</strong>.</p>
        <p>Unfortunately, you were not selected for the role at this time. We appreciate your efforts and wish you the best of luck for the next drives.</p>
        <br/>
        <p>Regards,</p>
        <p>Placement Cell, Geeta University</p>
      `;
    } else if (status === "Shortlisted") {
      message = `Placement drive update: You have been shortlisted for ${job.title} at ${company.name}.`;
      emailSubject = `Shortlisted: ${job.title} at ${company.name}`;
      emailHtml = `
        <p>Dear ${student.name},</p>
        <p>You have been shortlisted for the next selection rounds of <strong>${job.title}</strong> at <strong>${company.name}</strong>.</p>
        <p>Check the portal for schedule updates.</p>
        <br/>
        <p>Regards,</p>
        <p>Placement Cell, Geeta University</p>
      `;
    }

    if (message && student) {
      const notif = new Notification({
        userId: student.userId,
        message,
        type: "application_status",
      });
      await notif.save();

      // Send status change email (non-blocking)
      sendEmail({
        to: student.email,
        subject: emailSubject,
        html: emailHtml,
      }).catch(err => console.error("Email delivery failed:", err));
    }
  }

  return res.status(200).json({
    message: "Application status updated successfully",
    application: app,
  });
});

module.exports.issueOffer = ErrorWrapper(async (req, res, next) => {
  const { id } = req.params;
  const { offerLetterContent } = req.body;

  const app = await Application.findById(id).populate("studentId").populate("jobId");
  if (!app) {
    throw new ErrorHandler(404, "Application not found");
  }

  if (req.file) {
    app.offerLetterUrl = req.file.path; // Cloudinary PDF URL
    app.offerLetterContent = ""; // Clear template text if custom PDF is uploaded
  } else {
    if (!offerLetterContent) {
      throw new ErrorHandler(400, "Offer letter content or PDF upload is required");
    }
    app.offerLetterContent = offerLetterContent;
    app.offerLetterUrl = ""; // Clear PDF link if template text is used
  }

  app.offerLetterStatus = "Pending Approval";
  await app.save();

  // Notify placement cell
  const User = require("../models/User");
  const placementCellUsers = await User.find({ role: "placementCell" });
  for (const cellUser of placementCellUsers) {
    const notif = new Notification({
      userId: cellUser._id,
      message: `Recruiter submitted an offer letter for ${app.studentId.name} (${app.jobId.title}) pending placement cell approval.`,
      type: "general"
    });
    await notif.save();
  }

  return res.status(200).json({
    message: "Offer letter submitted for Placement Cell approval successfully",
    application: app
  });
});

module.exports.approveOffer = ErrorWrapper(async (req, res, next) => {
  const { id } = req.params;
  const app = await Application.findById(id)
    .populate("studentId")
    .populate({
      path: "jobId",
      populate: { path: "companyId", select: "name" },
    });

  if (!app) {
    throw new ErrorHandler(404, "Application not found");
  }

  app.offerLetterStatus = "Approved";
  app.status = "Selected"; // Overall application status becomes Selected
  await app.save();

  const student = app.studentId;
  if (student) {
    student.isPlaced = true;
    await student.save();
  }

  // Notify student
  const notif = new Notification({
    userId: student.userId,
    message: `Congratulations! Your offer letter for ${app.jobId.title} at ${app.jobId.companyId.name} has been approved and issued.`,
    type: "application_status",
  });
  await notif.save();

  // Send email
  sendEmail({
    to: student.email,
    subject: `Congratulations! Approved Offer Letter: ${app.jobId.title} at ${app.jobId.companyId.name}`,
    html: `
      <h3>Dear ${student.name},</h3>
      <p>We are pleased to inform you that your offer letter for <strong>${app.jobId.title}</strong> at <strong>${app.jobId.companyId.name}</strong> has been approved by the Placement Cell and issued!</p>
      <p>Log in to PlacementConnect to view and print your offer letter.</p>
      <br/>
      <p>Regards,</p>
      <p>Placement Cell, Geeta University</p>
    `,
  }).catch(err => console.error("Email send error:", err));

  return res.status(200).json({
    message: "Offer letter approved successfully",
    application: app
  });
});

module.exports.rejectOffer = ErrorWrapper(async (req, res, next) => {
  const { id } = req.params;
  const { reason } = req.body;
  const app = await Application.findById(id).populate("studentId").populate("jobId");

  if (!app) {
    throw new ErrorHandler(404, "Application not found");
  }

  app.offerLetterStatus = "Rejected";
  await app.save();

  // Notify recruiter / company user
  const Company = require("../models/company");
  const company = await Company.findById(app.jobId.companyId);
  if (company) {
    const notif = new Notification({
      userId: company.recruiterId,
      message: `Placement Cell rejected the offer letter for ${app.studentId.name} (${app.jobId.title}). Reason: ${reason || "Not specified"}.`,
      type: "general"
    });
    await notif.save();
  }

  return res.status(200).json({
    message: "Offer letter rejected successfully",
    application: app
  });
});
