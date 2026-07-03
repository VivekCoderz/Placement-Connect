const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
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
    status: {
      type: String,
      enum: ["Applied", "Shortlisted", "Selected", "Rejected"],
      default: "Applied",
    },
    rounds: [
      {
        name: {
          type: String, // e.g. "Applied", "Aptitude", "GD", "Technical", "HR"
          required: true,
        },
        result: {
          type: String,
          enum: ["Pending", "Passed", "Failed"],
          default: "Pending",
        },
        scheduledAt: {
          type: Date,
        },
        notes: {
          type: String,
        },
      },
    ],
    offerLetterUrl: {
      type: String, // Cloudinary link to offer letter PDF
    },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate applications by a student to the same job
applicationSchema.index({ studentId: 1, jobId: 1 }, { unique: true });

module.exports = mongoose.model("Application", applicationSchema);
