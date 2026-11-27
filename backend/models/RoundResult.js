const mongoose = require("mongoose");

const roundResultSchema = new mongoose.Schema(
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
    roundId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Round",
      required: true,
    },
    result: {
      type: String,
      enum: ["Selected", "Rejected", "Absent", "Waiting"],
      required: true,
    },
    score: {
      type: Number,
    },
    remarks: {
      type: String,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// One result per application per round (re-uploads update it).
roundResultSchema.index({ applicationId: 1, roundId: 1 });

module.exports = mongoose.model("RoundResult", roundResultSchema);
