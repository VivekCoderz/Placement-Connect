const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    branch: {
      type: String,
      required: true,
      // e.g. "CSE", "IT", "ECE", "ME"
    },
    year: {
      type: Number,
      required: true,
      // current year e.g. 3 or 4
    },
    rollNumber: {
      type: String,
      required: true,
      unique: true,
    },
    cgpa: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },
    skills: [
      {
        type: String,
      },
    ],
    resumeUrl: {
      type: String, // Cloudinary link
    },
    projects: [
      {
        title: String,
        description: String,
        techStack: [String],
        link: String,
      },
    ],
    certifications: [
      {
        title: String,
        issuedBy: String,
        certificateUrl: String,
      },
    ],
    phone: {
      type: String,
    },
    isPlaced: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);