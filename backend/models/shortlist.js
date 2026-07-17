const mongoose = require("mongoose");

const shortlistSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    roundName: {
      type: String,
      required: true, // e.g. "Aptitude", "GD", "Technical"
    },
    studentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
    status: {
      type: String,
      enum: ["Pending", "Scheduled"],
      default: "Pending",
    },
    roundDetails: {
      type: String,
    },
    scheduledAt: {
      type: Date,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Shortlist", shortlistSchema);
