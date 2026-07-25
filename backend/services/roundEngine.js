const Application = require("../models/application");
const StudentProgress = require("../models/StudentProgress");
const Round = require("../models/Round");
const RoundResult = require("../models/RoundResult");
const Notification = require("../models/notification");
const Student = require("../models/student");
const { sendEmail } = require("../utils/email");

/**
 * Process a single candidate round result, advancing them in the pipeline or rejecting them.
 * 
 * @param {string} jobId - Job ID
 * @param {string} roundId - Round ID
 * @param {string} studentId - Student ID
 * @param {string} result - Selected, Rejected, Absent, Waiting
 * @param {number} [score] - Score in the round
 * @param {string} [remarks] - Evaluator notes / remarks
 * @param {string} [recruiterUserId] - ID of user saving the result
 */
async function processCandidateResult({ jobId, roundId, studentId, result, score, remarks, recruiterUserId }) {
  // 1. Fetch Job and Round details
  const round = await Round.findById(roundId);
  if (!round) throw new Error("Round not found");

  const jobRounds = await Round.find({ jobId }).sort({ sequence: 1 });
  const currentRoundIdx = jobRounds.findIndex(r => r._id.toString() === roundId.toString());

  // 2. Fetch Application
  const app = await Application.findOne({ jobId, studentId })
    .populate("studentId")
    .populate({
      path: "jobId",
      populate: { path: "companyId", select: "name" }
    });
  if (!app) {
    console.error(`Application not found for student ${studentId} and job ${jobId}`);
    return;
  }

  const student = app.studentId;
  const job = app.jobId;
  const company = job.companyId;

  // 3. Save to RoundResult
  const roundResult = new RoundResult({
    applicationId: app._id,
    studentId,
    roundId,
    result,
    score: score || 0,
    remarks: remarks || "",
    uploadedBy: recruiterUserId
  });
  await roundResult.save();

  // 4. Update/Create StudentProgress
  let progress = await StudentProgress.findOne({ applicationId: app._id });
  if (!progress) {
    progress = new StudentProgress({
      applicationId: app._id,
      studentId,
      jobId,
      currentRoundIndex: currentRoundIdx,
      currentRoundId: roundId,
      status: "Shortlisted"
    });
  }

  // Update history in progress
  const historyIdx = progress.history.findIndex(h => h.roundId?.toString() === roundId.toString());
  if (historyIdx > -1) {
    progress.history[historyIdx] = {
      roundId,
      roundName: round.name,
      result,
      remarks: remarks || "",
      updatedAt: new Date()
    };
  } else {
    progress.history.push({
      roundId,
      roundName: round.name,
      result,
      remarks: remarks || "",
      updatedAt: new Date()
    });
  }

  // 5. Update Application and Progression logic
  let nextStatus = "";
  let appStatus = "";

  const appRoundIdx = app.rounds.findIndex(r => r.name.toLowerCase() === round.name.toLowerCase());
  
  if (result === "Selected") {
    // If there is a next round
    if (currentRoundIdx < jobRounds.length - 1) {
      const nextRound = jobRounds[currentRoundIdx + 1];
      
      progress.currentRoundIndex = currentRoundIdx + 1;
      progress.currentRoundId = nextRound._id;
      
      nextStatus = `Round ${currentRoundIdx + 2}: ${nextRound.name}`;
      
      // Update application overall status
      appStatus = `Round${currentRoundIdx + 2}`; // e.g. "Round2", "Round3"
      
      // Mark current round as Passed
      if (appRoundIdx > -1) {
        app.rounds[appRoundIdx].result = "Passed";
        app.rounds[appRoundIdx].notes = remarks || "Passed and advanced.";
      }

      // Add next round to app rounds list if not present
      const nextRoundName = nextRound.name;
      const nextAppRoundIdx = app.rounds.findIndex(r => r.name.toLowerCase() === nextRoundName.toLowerCase());
      if (nextAppRoundIdx === -1) {
        app.rounds.push({
          name: nextRoundName,
          result: "Pending",
          scheduledAt: nextRound.date,
          roundType: nextRound.mode || "Online",
          testLink: nextRound.meetingLink || "",
          notes: nextRound.instructions || "",
          venue: nextRound.mode === "Physical" ? (nextRound.meetingLink || "TPO Office") : ""
        });
      } else {
        // Update details
        app.rounds[nextAppRoundIdx].result = "Pending";
        app.rounds[nextAppRoundIdx].scheduledAt = nextRound.date;
        app.rounds[nextAppRoundIdx].roundType = nextRound.mode || "Online";
        app.rounds[nextAppRoundIdx].testLink = nextRound.meetingLink || "";
        app.rounds[nextAppRoundIdx].notes = nextRound.instructions || "";
      }
    } else {
      // Final Round selection! Move to Offer Selected / Selected status
      progress.currentRoundIndex = currentRoundIdx;
      nextStatus = "Offer Selected";
      appStatus = "Selected"; // Final Selected

      if (appRoundIdx > -1) {
        app.rounds[appRoundIdx].result = "Passed";
        app.rounds[appRoundIdx].notes = remarks || "Cleared final round. Selected!";
      }

      // Update student table to placed
      if (student) {
        student.isPlaced = true;
        await student.save();
      }
    }
  } else if (result === "Rejected" || result === "Absent") {
    // Candidates fail and stop here
    nextStatus = result === "Absent" ? "Absent" : "Rejected";
    appStatus = "Rejected";

    if (appRoundIdx > -1) {
      app.rounds[appRoundIdx].result = "Failed";
      app.rounds[appRoundIdx].notes = remarks || `Failed in ${round.name} round.`;
    }
  } else if (result === "Waiting") {
    // Waitlisted candidate
    nextStatus = "Waiting List";
    appStatus = app.status; // Keep current application status unchanged

    if (appRoundIdx > -1) {
      app.rounds[appRoundIdx].result = "Pending"; // remains pending or waitlist marked in notes
      app.rounds[appRoundIdx].notes = remarks || "Waitlisted.";
    }
  }

  // Save progress and app statuses
  progress.status = nextStatus;
  await progress.save();

  app.status = appStatus;
  app.markModified("rounds");
  await app.save();

  // 6. Notifications and Emails
  let notifMsg = "";
  if (result === "Selected") {
    if (nextStatus === "Offer Selected") {
      notifMsg = `Congratulations! You have successfully cleared the final round (${round.name}) and have been selected for ${job.title} at ${company.name}!`;
    } else {
      const nextRound = jobRounds[currentRoundIdx + 1];
      notifMsg = `Congratulations! You cleared the ${round.name} round for ${job.title} at ${company.name} and have advanced to: ${nextRound.name}.`;
    }
  } else if (result === "Rejected") {
    notifMsg = `Update for ${job.title} at ${company.name}: You did not clear the ${round.name} round. Feedback: ${remarks || "Did not clear cutoff."}`;
  } else if (result === "Absent") {
    notifMsg = `Update for ${job.title} at ${company.name}: You were marked Absent for the ${round.name} round.`;
  } else if (result === "Waiting") {
    notifMsg = `Update for ${job.title} at ${company.name}: You have been waitlisted in the ${round.name} round.`;
  }

  if (notifMsg && student) {
    const notif = new Notification({
      userId: student.userId,
      message: notifMsg,
      type: "application_status"
    });
    await notif.save();

    // Send email non-blocking
    sendEmail({
      to: student.email,
      subject: `Evaluation Result: ${round.name} Round for ${job.title} at ${company.name}`,
      html: `
        <h3>Dear ${student.name},</h3>
        <p>${notifMsg}</p>
        <br/>
        <p>Regards,</p>
        <p>Placement Cell, Geeta University</p>
      `
    }).catch(err => console.error("Round progression email delivery failed:", err));
  }
}

module.exports = {
  processCandidateResult
};
