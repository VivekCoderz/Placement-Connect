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
  const { status, roundName, roundResult, scheduledAt, notes } = req.body;

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
    };

    if (scheduledAt) {
      roundData.scheduledAt = new Date(scheduledAt);
    }

    if (roundIdx > -1) {
      if (roundResult) app.rounds[roundIdx].result = roundResult;
      if (scheduledAt) app.rounds[roundIdx].scheduledAt = new Date(scheduledAt);
      if (notes) app.rounds[roundIdx].notes = notes;
    } else {
      app.rounds.push(roundData);
    }
  }

  await app.save();

  // 4. Send Notifications and Emails
  // If interview scheduled
  if (roundName && scheduledAt) {
    const start = new Date(scheduledAt);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour duration default

    const icsContent = generateICS({
      start,
      end,
      summary: `${roundName} Interview: ${job.title} at ${company.name}`,
      description: `You have an interview scheduled for ${job.title} at ${company.name}. \nNotes: ${notes || "None"}`,
      location: "Online Interview (Teams/Meet/Zoom)",
      studentName: student.name,
      studentEmail: student.email,
    });

    // Create Notification
    const notif = new Notification({
      userId: student.userId,
      message: `Interview Scheduled: ${roundName} round for ${job.title} at ${company.name} on ${start.toLocaleString()}`,
      type: "interview_scheduled",
    });
    await notif.save();

    // Send calendar invite email
    await sendEmail({
      to: student.email,
      subject: `Interview Scheduled: ${roundName} Round for ${job.title} at ${company.name}`,
      html: `
        <h3>Dear ${student.name},</h3>
        <p>Your interview for the <strong>${roundName}</strong> round of <strong>${job.title}</strong> at <strong>${company.name}</strong> has been scheduled.</p>
        <p><strong>Time:</strong> ${start.toLocaleString()}</p>
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
    });
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

      await sendEmail({
        to: student.email,
        subject: emailSubject,
        html: emailHtml,
      });
    }
  }

  return res.status(200).json({
    message: "Application status updated successfully",
    application: app,
  });
});
