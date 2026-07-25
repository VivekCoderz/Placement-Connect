const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema(
  {
    roundId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Round",
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },
    meetingLink: {
      type: String,
    },
    platform: {
      type: String,
    },
    scheduledAt: {
      type: Date,
    },
    duration: {
      type: Number,
      default: 60, // in minutes
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Meeting", meetingSchema);
