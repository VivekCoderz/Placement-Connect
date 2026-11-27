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
    resumeFileName: {
      type: String, // original file name shown in the UI
    },
    resumeUploadedAt: {
      type: Date,
    },
    resumePublicId: {
      type: String, // Cloudinary public id, used to delete the old file
    },
    profilePictureUrl: {
      type: String, // Cloudinary link
    },
    profilePicturePublicId: {
      type: String,
    },
    headline: {
      type: String, // e.g. "Full-stack developer | MERN"
      trim: true,
      maxlength: 120,
    },
    about: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    linkedinUrl: { type: String, trim: true },
    githubUrl: { type: String, trim: true },
    portfolioUrl: { type: String, trim: true },
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
    // Set when the student accepts an approved offer.
    placedApplicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
    },
    placedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);