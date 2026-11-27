const Application = require("../models/application");
const Student = require("../models/student");
const Company = require("../models/company");
const User = require("../models/User");
const Notification = require("../models/notification");
const ResumeAnalysis = require("../models/ResumeAnalysis");
const StudentProgress = require("../models/StudentProgress");
const ErrorWrapper = require("../utils/ErrorWrapper");
const ErrorHandler = require("../utils/ErrorHandle");
const { sendEmail, generateICS } = require("../utils/email");
const { assertApplicationOwner, assertValidId } = require("../utils/ownership");
const { sanitizeHtml } = require("../utils/sanitizeHtml");

// Days a student has to accept or decline an approved offer.
const OFFER_RESPONSE_DAYS = Number(process.env.OFFER_RESPONSE_DAYS || 7);

// Statuses after which a candidate is out of the process.
const CLOSED_STATUSES = ["Rejected", "Withdrawn"];

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Only http(s) links are put into emails.
const safeLink = (value) => (/^https?:\/\//i.test(String(value || "")) ? String(value) : "");

const notify = (userId, message, type = "general") =>
  userId ? Notification.create({ userId, message, type }) : Promise.resolve(null);

const notifyPlacementCell = async (message) => {
  const cellUsers = await User.find({ role: "placementCell", isActive: true }).select("_id");
  if (cellUsers.length) {
    await Notification.insertMany(cellUsers.map((u) => ({ userId: u._id, message, type: "general" })));
  }
};

const notifyRecruiter = async (companyId, message) => {
  const company = await Company.findById(companyId).select("recruiterId");
  if (company?.recruiterId) await notify(company.recruiterId, message, "general");
};

const loadStudentForUser = async (userId) => {
  const student = await Student.findOne({ userId });
  if (!student) throw new ErrorHandler(404, "Student profile not found");
  return student;
};

// ---------------------------------------------------------------------------
// Student: list my applications
// ---------------------------------------------------------------------------
module.exports.getMyApplications = ErrorWrapper(async (req, res, next) => {
  const student = await loadStudentForUser(req.user.id);

  const applications = await Application.find({ studentId: student._id })
    .populate({
      path: "jobId",
      populate: { path: "companyId", select: "name industry website" },
    })
    .sort({ createdAt: -1 });

  // One query for all analyses instead of one per application.
  const analyses = await ResumeAnalysis.find({ applicationId: { $in: applications.map((a) => a._id) } }).lean();
  const analysisByApp = new Map(analyses.map((a) => [String(a.applicationId), a]));

  const enrichedApplications = applications.map((app) => {
    const appObj = { ...app.toObject(), id: app._id };

    // The offer letter is visible to the student only after the placement cell approves it.
    if (app.offerLetterStatus !== "Approved") {
      delete appObj.offerLetterUrl;
      delete appObj.offerLetterContent;
    }
    delete appObj.offerRejectionReason; // internal note between placement cell and recruiter
    delete appObj.pendingStatus;
    delete appObj.pendingStatusDetails;

    const analysis = analysisByApp.get(String(app._id));
    if (analysis) {
      // Student-facing feedback only; recruiter summaries, rankings and recommendations stay internal.
      appObj.atsScore = analysis.atsScore;
      appObj.matchPercentage = analysis.matchPercentage;
      appObj.matchedSkills = analysis.skillsMatch || [];
      appObj.skillsMatch = analysis.skillsMatch || [];
      appObj.missingSkills = analysis.missingSkills || [];
      appObj.matchedKeywords = analysis.matchedKeywords || analysis.skillsMatch || [];
      appObj.missingKeywords = analysis.missingKeywords || analysis.missingSkills || [];
      appObj.resumeSummary = analysis.aiCandidateSummary || analysis.aiSummary || "";
      appObj.aiSummary = appObj.resumeSummary;
      appObj.strengths = analysis.strengths || [];
      appObj.weaknesses = analysis.weaknesses || [];
      appObj.recommendedLearning = analysis.recommendedLearning || [];
      if (app.status === "Rejected") appObj.rejectionReason = analysis.rejectionReason || "";
    }
    return appObj;
  });

  return res.status(200).json({
    applications: enrichedApplications,
    isPlaced: Boolean(student.isPlaced),
    placedApplicationId: student.placedApplicationId || null,
  });
});

// ---------------------------------------------------------------------------
// Student: withdraw an application
// ---------------------------------------------------------------------------
module.exports.withdrawApplication = ErrorWrapper(async (req, res, next) => {
  assertValidId(req.params.id, "application");
  const student = await loadStudentForUser(req.user.id);
  const app = await Application.findOne({ _id: req.params.id, studentId: student._id }).populate("jobId", "title companyId");
  if (!app) throw new ErrorHandler(404, "Application not found");

  if ([...CLOSED_STATUSES, "Selected"].includes(app.status)) {
    throw new ErrorHandler(400, `This application is already ${app.status} and cannot be withdrawn.`);
  }
  if (["Pending Approval", "Approved"].includes(app.offerLetterStatus)) {
    throw new ErrorHandler(400, "An offer has been issued for this application. Decline the offer instead.");
  }

  app.status = "Withdrawn";
  app.withdrawnAt = new Date();
  await app.save();
  await StudentProgress.updateOne({ applicationId: app._id }, { status: "Withdrawn" });

  await notifyRecruiter(app.jobId.companyId, `${student.name} (${student.rollNumber}) withdrew their application for ${app.jobId.title}.`);

  return res.status(200).json({ message: "Application withdrawn", application: app });
});

// ---------------------------------------------------------------------------
// Student: accept or decline an approved offer
// ---------------------------------------------------------------------------
module.exports.respondToOffer = ErrorWrapper(async (req, res, next) => {
  assertValidId(req.params.id, "application");
  const decision = String(req.body?.decision || "");
  if (!["Accept", "Decline"].includes(decision)) {
    throw new ErrorHandler(400, "decision must be Accept or Decline");
  }

  const student = await loadStudentForUser(req.user.id);
  const app = await Application.findOne({ _id: req.params.id, studentId: student._id }).populate({
    path: "jobId",
    select: "title companyId package",
    populate: { path: "companyId", select: "name recruiterId" },
  });
  if (!app) throw new ErrorHandler(404, "Application not found");

  if (app.offerLetterStatus !== "Approved") {
    throw new ErrorHandler(400, "There is no approved offer to respond to for this application.");
  }
  if (app.offerResponse && app.offerResponse !== "None") {
    throw new ErrorHandler(400, `You have already ${app.offerResponse.toLowerCase()} this offer.`);
  }
  if (app.offerDeadline && app.offerDeadline < new Date()) {
    throw new ErrorHandler(400, "The deadline to respond to this offer has passed. Please contact the Placement Cell.");
  }

  const job = app.jobId;
  const companyName = job.companyId?.name || "the company";

  if (decision === "Accept") {
    // Atomic: a student can only ever accept one offer, even with two tabs open.
    const placed = await Student.findOneAndUpdate(
      { _id: student._id, isPlaced: { $ne: true } },
      { $set: { isPlaced: true, placedApplicationId: app._id, placedAt: new Date() } },
      { new: true },
    );
    if (!placed) {
      throw new ErrorHandler(409, "You have already accepted another offer.");
    }
    app.offerResponse = "Accepted";
  } else {
    app.offerResponse = "Declined";
  }
  app.offerRespondedAt = new Date();
  await app.save();
  await StudentProgress.updateOne(
    { applicationId: app._id },
    { status: decision === "Accept" ? "Offer Accepted" : "Offer Declined" },
  );

  const verb = decision === "Accept" ? "accepted" : "declined";
  const message = `${student.name} (${student.rollNumber}) ${verb} the offer for ${job.title} at ${companyName}.`;
  await Promise.all([notify(job.companyId?.recruiterId, message), notifyPlacementCell(message)]);

  return res.status(200).json({
    message: decision === "Accept" ? "Offer accepted. Congratulations!" : "Offer declined.",
    application: app,
  });
});

// ---------------------------------------------------------------------------
// Recruiter / staff: update status or rounds of one application
// ---------------------------------------------------------------------------
module.exports.updateStatus = ErrorWrapper(async (req, res, next) => {
  const { id } = req.params;
  const { status, roundName, roundResult, scheduledAt, notes, roundType, testLink, venue } = req.body;

  // Company users may only update applications to their own jobs.
  const app = await assertApplicationOwner(req, id, (q) =>
    q.populate("studentId").populate({
      path: "jobId",
      populate: { path: "companyId", select: "name" },
    }),
  );

  const student = app.studentId;
  const job = app.jobId;
  const company = job.companyId;

  if (app.offerResponse === "Accepted") {
    throw new ErrorHandler(400, "The candidate has accepted the offer; this application can no longer be changed.");
  }
  if (app.status === "Withdrawn") {
    throw new ErrorHandler(400, "The candidate has withdrawn this application.");
  }

  // 1. Status change
  if (status) {
    const validStatuses = ["Shortlisted", "Selected", "Rejected"];
    if (!validStatuses.includes(status)) {
      throw new ErrorHandler(400, "Invalid application status");
    }
    if (status !== "Selected" && ["Pending Approval", "Approved"].includes(app.offerLetterStatus)) {
      throw new ErrorHandler(400, "This candidate has an offer in progress. Ask the Placement Cell to reject the offer first.");
    }
    app.status = status;
  }

  // 2. An offer letter PDF uploaded here goes through the same approval as issue-offer.
  if (req.file) {
    if (app.status !== "Selected") {
      throw new ErrorHandler(400, "Offer letters can only be issued to selected candidates.");
    }
    app.offerLetterUrl = req.file.path;
    app.offerLetterContent = "";
    app.offerLetterStatus = "Pending Approval";
    app.offerIssuedAt = new Date();
    app.offerRejectionReason = undefined;
    app.offerResponse = "None";
  }

  // 3. Round updates
  if (roundName) {
    const roundIdx = app.rounds.findIndex((r) => r.name.toLowerCase() === String(roundName).toLowerCase());
    const link = safeLink(testLink);

    if (roundIdx > -1) {
      if (roundResult) {
        app.rounds[roundIdx].result = roundResult;
        if (roundResult === "Failed") app.status = "Rejected";
      }
      if (scheduledAt) app.rounds[roundIdx].scheduledAt = new Date(scheduledAt);
      if (notes) app.rounds[roundIdx].notes = notes;
      if (roundType) app.rounds[roundIdx].roundType = roundType;
      if (link) app.rounds[roundIdx].testLink = link;
      if (venue) app.rounds[roundIdx].venue = venue;
    } else {
      if (roundResult === "Failed") app.status = "Rejected";
      app.rounds.push({
        name: roundName,
        result: roundResult || "Pending",
        notes: notes || "",
        roundType: roundType || "Online",
        testLink: link,
        venue: venue || "",
        ...(scheduledAt ? { scheduledAt: new Date(scheduledAt) } : {}),
      });
    }
    app.markModified("rounds");
  }

  await app.save();

  if (req.file) {
    await notifyPlacementCell(`${company.name} submitted an offer letter for ${student.name} (${job.title}) for approval.`);
  }

  // 4. Notifications and emails
  if (roundName && scheduledAt) {
    const start = new Date(scheduledAt);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const isOnline = (roundType || "Online") === "Online";
    const link = safeLink(testLink);

    const icsContent = generateICS({
      start,
      end,
      summary: `${roundName} Interview: ${job.title} at ${company.name}`,
      description: `You have an interview scheduled for ${job.title} at ${company.name}.\nRound Type: ${roundType || "Online"}\n${isOnline ? `Link: ${link || "TBA"}` : `Venue: ${venue || "Placement Cell"}`}\nNotes: ${notes || "None"}`,
      location: isOnline ? (link || "Online Interview") : (venue || "Campus Placement Cell"),
      studentName: student.name,
      studentEmail: student.email,
    });

    await notify(
      student.userId,
      `Interview Scheduled: ${roundName} (${roundType || "Online"}) for ${job.title} at ${company.name} on ${start.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}. ${isOnline ? `Link: ${link || "TBA"}` : `Venue: ${venue || "Placement Cell"}`}`,
      "interview_scheduled",
    );

    sendEmail({
      to: student.email,
      subject: `Interview Scheduled: ${roundName} Round for ${job.title} at ${company.name}`,
      html: `
        <h3>Dear ${escapeHtml(student.name)},</h3>
        <p>Your interview for the <strong>${escapeHtml(roundName)}</strong> round of <strong>${escapeHtml(job.title)}</strong> at <strong>${escapeHtml(company.name)}</strong> has been scheduled.</p>
        <p><strong>Time:</strong> ${escapeHtml(start.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }))} IST</p>
        <p><strong>Round Type:</strong> ${escapeHtml(roundType || "Online")}</p>
        ${isOnline ? `<p><strong>Meeting Link:</strong> ${link ? `<a href="${escapeHtml(link)}">${escapeHtml(link)}</a>` : "TBA"}</p>` : `<p><strong>Venue:</strong> ${escapeHtml(venue || "Campus Placement Cell")}</p>`}
        ${notes ? `<p><strong>Notes:</strong> ${escapeHtml(notes)}</p>` : ""}
        <p>Please find the attached calendar invite.</p>
        <p>Regards,<br/>Placement Cell, Geeta University</p>
      `,
      attachments: [{ filename: "invite.ics", content: icsContent, contentType: "text/calendar" }],
    }).catch((err) => console.error("Email delivery failed:", err));
  } else if (status) {
    const messages = {
      Selected: {
        message: `Congratulations! You have been selected for ${job.title} at ${company.name}. Your offer letter will appear here once the Placement Cell approves it.`,
        subject: `Selected: ${job.title} at ${company.name}`,
      },
      Rejected: {
        message: `Application update: you were not selected for ${job.title} at ${company.name}.`,
        subject: `Placement Drive Update: ${job.title} at ${company.name}`,
      },
      Shortlisted: {
        message: `You have been shortlisted for ${job.title} at ${company.name}. Check the portal for the schedule.`,
        subject: `Shortlisted: ${job.title} at ${company.name}`,
      },
    };
    const m = messages[status];
    if (m && student) {
      await notify(student.userId, m.message, "application_status");
      sendEmail({
        to: student.email,
        subject: m.subject,
        html: `<p>Dear ${escapeHtml(student.name)},</p><p>${escapeHtml(m.message)}</p><p>Regards,<br/>Placement Cell, Geeta University</p>`,
      }).catch((err) => console.error("Email delivery failed:", err));
    }
  }

  return res.status(200).json({
    message: "Application status updated successfully",
    application: app,
  });
});

// ---------------------------------------------------------------------------
// Recruiter: issue an offer (goes to the placement cell for approval)
// ---------------------------------------------------------------------------
module.exports.issueOffer = ErrorWrapper(async (req, res, next) => {
  const { id } = req.params;
  const { offerLetterContent } = req.body;

  const app = await assertApplicationOwner(req, id, (q) => q.populate("studentId").populate("jobId"));

  if (app.status !== "Selected") {
    throw new ErrorHandler(400, "Offers can only be issued to candidates who have been selected.");
  }
  if (app.offerResponse && app.offerResponse !== "None") {
    throw new ErrorHandler(400, `The candidate has already ${app.offerResponse.toLowerCase()} an offer for this drive.`);
  }

  if (req.file) {
    app.offerLetterUrl = req.file.path; // Cloudinary PDF URL
    app.offerLetterContent = "";
  } else {
    if (!offerLetterContent) {
      throw new ErrorHandler(400, "Offer letter content or PDF upload is required");
    }
    // Stored HTML is rendered by the frontend, so it is sanitized on save.
    app.offerLetterContent = sanitizeHtml(offerLetterContent);
    app.offerLetterUrl = "";
  }

  app.offerLetterStatus = "Pending Approval";
  app.offerIssuedAt = new Date();
  app.offerApprovedAt = undefined;
  app.offerDeadline = undefined;
  app.offerRejectionReason = undefined;
  app.offerResponse = "None";
  await app.save();

  await notifyPlacementCell(
    `Recruiter submitted an offer letter for ${app.studentId.name} (${app.jobId.title}) pending placement cell approval.`,
  );

  return res.status(200).json({
    message: "Offer letter submitted for Placement Cell approval successfully",
    application: app,
  });
});

// ---------------------------------------------------------------------------
// Placement cell: approve an offer (student can then see and respond to it)
// ---------------------------------------------------------------------------
module.exports.approveOffer = ErrorWrapper(async (req, res, next) => {
  assertValidId(req.params.id, "application");
  const app = await Application.findById(req.params.id)
    .populate("studentId")
    .populate({ path: "jobId", populate: { path: "companyId", select: "name recruiterId" } });

  if (!app) {
    throw new ErrorHandler(404, "Application not found");
  }
  if (app.offerLetterStatus !== "Pending Approval") {
    throw new ErrorHandler(400, "There is no offer waiting for approval on this application.");
  }
  if (!app.offerLetterUrl && !app.offerLetterContent) {
    throw new ErrorHandler(400, "This offer has no letter attached.");
  }

  const now = new Date();
  app.offerLetterStatus = "Approved";
  app.offerApprovedAt = now;
  app.offerDeadline = new Date(now.getTime() + OFFER_RESPONSE_DAYS * 24 * 60 * 60 * 1000);
  app.offerResponse = "None";
  app.status = "Selected";
  await app.save();

  const student = app.studentId;
  const job = app.jobId;
  const companyName = job.companyId?.name || "the company";
  const deadlineText = app.offerDeadline.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

  if (student) {
    await notify(
      student.userId,
      `Your offer letter for ${job.title} at ${companyName} is ready. Please accept or decline it by ${deadlineText}.`,
      "offer",
    );
    sendEmail({
      to: student.email,
      subject: `Offer Letter: ${job.title} at ${companyName}`,
      html: `
        <h3>Dear ${escapeHtml(student.name)},</h3>
        <p>Your offer letter for <strong>${escapeHtml(job.title)}</strong> at <strong>${escapeHtml(companyName)}</strong> has been approved by the Placement Cell.</p>
        <p>Please log in to PlacementConnect to view it and <strong>accept or decline by ${escapeHtml(deadlineText)}</strong>.</p>
        <p>Regards,<br/>Placement Cell, Geeta University</p>
      `,
    }).catch((err) => console.error("Email send error:", err));
  }
  await notify(job.companyId?.recruiterId, `Placement Cell approved the offer for ${student?.name || "a candidate"} (${job.title}). It is now visible to the student.`);

  return res.status(200).json({
    message: "Offer letter approved successfully",
    application: app,
  });
});

// ---------------------------------------------------------------------------
// Placement cell: reject an offer (recruiter can correct and resubmit)
// ---------------------------------------------------------------------------
module.exports.rejectOffer = ErrorWrapper(async (req, res, next) => {
  assertValidId(req.params.id, "application");
  const reason = String(req.body?.reason || "").trim().slice(0, 1000);

  const app = await Application.findById(req.params.id).populate("studentId").populate("jobId");
  if (!app) {
    throw new ErrorHandler(404, "Application not found");
  }
  if (app.offerLetterStatus !== "Pending Approval") {
    throw new ErrorHandler(400, "There is no offer waiting for approval on this application.");
  }

  app.offerLetterStatus = "Rejected";
  app.offerRejectionReason = reason || "Not specified";
  await app.save();

  await notifyRecruiter(
    app.jobId.companyId,
    `Placement Cell rejected the offer letter for ${app.studentId?.name || "a candidate"} (${app.jobId.title}). Reason: ${app.offerRejectionReason}. Please correct it and issue it again.`,
  );

  return res.status(200).json({
    message: "Offer letter rejected successfully",
    application: app,
  });
});
