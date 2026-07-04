const Student = require("../models/student");
const User = require("../models/User");
const ErrorWrapper = require("../utils/ErrorWrapper");
const ErrorHandler = require("../utils/ErrorHandle");
const bcrypt = require("bcrypt");

// Get Student Profile
module.exports.getProfile = ErrorWrapper(async (req, res, next) => {
  const student = await Student.findOne({ userId: req.user.id });
  if (!student) {
    throw new ErrorHandler(404, "Student profile not found");
  }
  return res.status(200).json({ student });
});

// Update Profile (General updates: skills, projects, certifications, phone)
module.exports.updateProfile = ErrorWrapper(async (req, res, next) => {
  const { phone, skills, projects, certifications } = req.body;

  const student = await Student.findOne({ userId: req.user.id });
  if (!student) {
    throw new ErrorHandler(404, "Student profile not found");
  }

  if (phone !== undefined) student.phone = phone;
  if (skills !== undefined) student.skills = skills;
  if (projects !== undefined) student.projects = projects;
  if (certifications !== undefined) student.certifications = certifications;

  const updatedStudent = await student.save();

  return res.status(200).json({
    message: "Profile updated successfully",
    student: updatedStudent,
  });
});

// Upload Resume (to Cloudinary)
module.exports.uploadResume = ErrorWrapper(async (req, res, next) => {
  if (!req.file) {
    throw new ErrorHandler(400, "Please upload a file");
  }

  const student = await Student.findOne({ userId: req.user.id });
  if (!student) {
    throw new ErrorHandler(404, "Student profile not found");
  }

  student.resumeUrl = req.file.path; // Cloudinary URL path
  await student.save();

  return res.status(200).json({
    message: "Resume uploaded successfully",
    resumeUrl: student.resumeUrl,
  });
});

// Upload Profile Picture (mock or upload path)
module.exports.uploadProfilePicture = ErrorWrapper(async (req, res, next) => {
  if (!req.file) {
    throw new ErrorHandler(400, "Please upload a file");
  }
  // Standard profile picture is just returned or saved if path exists.
  // We can return the URL
  return res.status(200).json({
    message: "Profile picture uploaded successfully",
    imageUrl: req.file.path,
  });
});

// Upload Project
module.exports.uploadProject = ErrorWrapper(async (req, res, next) => {
  const { title, description, techStack, link } = req.body;

  if (!title) {
    throw new ErrorHandler(400, "Project title is required");
  }

  const student = await Student.findOne({ userId: req.user.id });
  if (!student) {
    throw new ErrorHandler(404, "Student profile not found");
  }

  student.projects.push({ title, description, techStack, link });
  await student.save();

  return res.status(200).json({
    message: "Project uploaded successfully",
    projects: student.projects,
  });
});

// Update Skills
module.exports.updateSkills = ErrorWrapper(async (req, res, next) => {
  const { skills } = req.body;

  if (!Array.isArray(skills)) {
    throw new ErrorHandler(400, "Skills must be an array");
  }

  const student = await Student.findOne({ userId: req.user.id });
  if (!student) {
    throw new ErrorHandler(404, "Student profile not found");
  }

  student.skills = skills;
  await student.save();

  return res.status(200).json({
    message: "Skills updated successfully",
    skills: student.skills,
  });
});

// Update CGPA
module.exports.updateCgpa = ErrorWrapper(async (req, res, next) => {
  const { cgpa } = req.body;

  if (cgpa === undefined || cgpa < 0 || cgpa > 10) {
    throw new ErrorHandler(400, "Please provide a valid CGPA between 0 and 10");
  }

  const student = await Student.findOne({ userId: req.user.id });
  if (!student) {
    throw new ErrorHandler(404, "Student profile not found");
  }

  student.cgpa = cgpa;
  await student.save();

  return res.status(200).json({
    message: "CGPA updated successfully",
    cgpa: student.cgpa,
  });
});

// Update Branch, Year, Roll Number
module.exports.updateBranchYearRollNumber = ErrorWrapper(async (req, res, next) => {
  const { branch, year, rollNumber } = req.body;

  const student = await Student.findOne({ userId: req.user.id });
  if (!student) {
    throw new ErrorHandler(404, "Student profile not found");
  }

  if (branch) student.branch = branch;
  if (year) student.year = year;
  if (rollNumber) {
    const existing = await Student.findOne({ rollNumber, _id: { $ne: student._id } });
    if (existing) {
      throw new ErrorHandler(400, "Roll number already in use");
    }
    student.rollNumber = rollNumber;
  }

  await student.save();

  return res.status(200).json({
    message: "Academic information updated successfully",
    student,
  });
});

// Update Email and Name
module.exports.updateEmailName = ErrorWrapper(async (req, res, next) => {
  const { name, email } = req.body;

  const user = await User.findById(req.user.id);
  const student = await Student.findOne({ userId: req.user.id });

  if (!user || !student) {
    throw new ErrorHandler(404, "User/Student profile not found");
  }

  if (name) {
    user.name = name;
    student.name = name;
  }

  if (email) {
    const cleanEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: cleanEmail, _id: { $ne: user._id } });
    if (existing) {
      throw new ErrorHandler(400, "Email already in use");
    }
    user.email = cleanEmail;
    student.email = cleanEmail;
  }

  await user.save();
  await student.save();

  return res.status(200).json({
    message: "Profile name/email updated successfully",
    name: user.name,
    email: user.email,
  });
});

// Update Phone Number
module.exports.updatePhoneNumber = ErrorWrapper(async (req, res, next) => {
  const { phone } = req.body;

  const student = await Student.findOne({ userId: req.user.id });
  if (!student) {
    throw new ErrorHandler(404, "Student profile not found");
  }

  student.phone = phone;
  await student.save();

  return res.status(200).json({
    message: "Phone number updated successfully",
    phone: student.phone,
  });
});

// Update Password
module.exports.updatePassword = ErrorWrapper(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ErrorHandler(400, "Old password and new password are required");
  }

  if (newPassword.length < 6) {
    throw new ErrorHandler(400, "New password must be at least 6 characters long");
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ErrorHandler(404, "User not found");
  }

  const isMatch = await user.comparePassword(oldPassword);
  if (!isMatch) {
    throw new ErrorHandler(401, "Incorrect old password");
  }

  user.password = newPassword; // Mongoose middleware will hash it
  await user.save();

  return res.status(200).json({ message: "Password updated successfully" });
});