const mongoose = require("mongoose");

const recruiterActionSchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    actionType: {
      type: String,
      enum: ["Shortlist", "Reject", "Send Assessment", "Schedule Interview", "Send Email", "Select"],
      required: true,
    },
    studentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ["Pending", "Approved"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RecruiterAction", recruiterActionSchema);
