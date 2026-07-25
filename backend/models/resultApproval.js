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
    results: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Student",
          required: true,
        },
        result: {
          type: String,
          enum: ["Passed", "Failed"],
          required: true,
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
