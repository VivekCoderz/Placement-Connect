const mongoose = require("mongoose");

const studentProgressSchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    currentRoundIndex: {
      type: Number,
      default: 0,
    },
    currentRoundId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Round",
    },
    status: {
      type: String,
      default: "Applied", // Applied, AI Screening, Shortlisted, Rejected, Round 1, Round 2, Selected, Offer Selected
    },
    history: [
      {
        roundId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Round",
        },
        roundName: {
          type: String,
        },
        result: {
          type: String, // Selected, Rejected, Absent, Waiting
        },
        remarks: {
          type: String,
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("StudentProgress", studentProgressSchema);
