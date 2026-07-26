const mongoose = require("mongoose");

const resumeAnalysisSchema = new mongoose.Schema(
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
    atsScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    matchPercentage: {
      type: Number,
      default: 0,
    },
    skillsMatch: [
      {
        type: String,
      },
    ],
    missingSkills: [
      {
        type: String,
      },
    ],
    experienceMatch: {
      type: String,
    },
    educationMatch: {
      type: String,
    },
    aiSummary: {
      type: String,
    },
    aiCandidateSummary: {
      type: String,
    },
    aiRecruiterSummary: {
      type: String,
    },
    strengths: [
      {
        type: String,
      },
    ],
    weaknesses: [
      {
        type: String,
      },
    ],
    recommendedLearning: [
      {
        type: String,
      },
    ],
    rejectionReason: {
      type: String,
    },
    selectionReason: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Shortlisted", "Rejected", "Borderline"],
      required: true,
    },
    isOverridden: {
      type: Boolean,
      default: false,
    },
    originalStatus: {
      type: String,
    },
    overriddenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    overrideReason: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ResumeAnalysis", resumeAnalysisSchema);
