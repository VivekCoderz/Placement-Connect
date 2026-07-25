const mongoose = require("mongoose");

const roundSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    name: {
      type: String,
      required: true, // e.g. "Coding Test", "Technical Interview"
    },
    description: {
      type: String,
    },
    sequence: {
      type: Number,
      required: true, // 1, 2, 3...
    },
    date: {
      type: Date,
    },
    time: {
      type: String, // e.g., "10:00 AM"
    },
    mode: {
      type: String,
      enum: ["Online", "Physical"],
      default: "Online",
    },
    meetingLink: {
      type: String,
    },
    platform: {
      type: String, // Zoom, Google Meet, Microsoft Teams, HackerRank, LeetCode, CodeChef, CodeSignal, Custom URL
    },
    instructions: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Round", roundSchema);
