const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    package: {
      type: Number, // CTC in LPA
      required: true,
    },
    eligibility: {
      cgpa: {
        type: Number,
        required: true,
        min: 0,
        max: 10,
      },
      branches: [
        {
          type: String, // e.g. "CSE", "IT"
        },
      ],
      years: [
        {
          type: Number, // e.g. 2026, 2027
        },
      ],
    },
    deadline: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);
