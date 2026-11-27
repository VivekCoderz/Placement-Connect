const mongoose = require("mongoose");

const resultApprovalSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    roundName: {
      type: String,
      required: true,
    },
    roundId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Round",
    },
    results: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Student",
          required: true,
        },
        // Round results submitted by recruiters use the round engine's values;
        // "Passed"/"Failed" are kept for older records.
        result: {
          type: String,
          enum: ["Selected", "Rejected", "Absent", "Waiting", "Passed", "Failed"],
          required: true,
        },
        score: {
          type: Number,
        },
        notes: {
          type: String,
          default: "",
        },
      },
    ],
    status: {
      type: String,
      enum: ["Pending Approval", "Approved", "Rejected"],
      default: "Pending Approval",
    },
    rejectionReason: {
      type: String,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.ResultApproval || mongoose.model("ResultApproval", resultApprovalSchema);
