const Student = require("../models/student");
const User = require("../models/User");
const ErrorWrapper = require("../utils/ErrorWrapper");
const ErrorHandler = require("../utils/ErrorHandle");

const ACADEMIC_LOCKED_MESSAGE =
  "Academic details (CGPA, branch, year, roll number) can only be changed by the Placement Cell. Please contact the TPO office.";

// Certifications may arrive as plain strings (current frontend) or as objects;
// store them in the schema's object shape `{ title, issuedBy, certificateUrl }`.
const normalizeCertifications = (certifications) => {
  if (!Array.isArray(certifications)) {
    throw new ErrorHandler(400, "certifications must be an array");
  }
  return certifications
    .map((cert) => {
      if (typeof cert === "string") return { title: cert.trim() };
      if (cert && typeof cert === "object") {
        return {
          title: String(cert.title || cert.name || "").trim(),
          issuedBy: cert.issuedBy,
          certificateUrl: cert.certificateUrl,
        };
      }
      return null;
    })
    .filter((cert) => cert && cert.title);
};

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
  if (certifications !== undefined) student.certifications = normalizeCertifications(certifications);

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
  const student = await Student.findOne({ userId: req.user.id });
  if (!student) {
    throw new ErrorHandler(404, "Student profile not found");
  }

  student.profilePictureUrl = req.file.path; // Cloudinary URL
  await student.save();

  return res.status(200).json({
    message: "Profile picture uploaded successfully",
    imageUrl: student.profilePictureUrl,
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
  // CGPA is a verified academic field: students cannot change it themselves.
  // Re-submitting the current value is accepted as a no-op so the existing
  // profile form (which always sends it) keeps working.
  const cgpa = Number(req.body.cgpa);

  const student = await Student.findOne({ userId: req.user.id });
  if (!student) {
    throw new ErrorHandler(404, "Student profile not found");
  }

  if (req.body.cgpa !== undefined && cgpa !== student.cgpa) {
    throw new ErrorHandler(403, ACADEMIC_LOCKED_MESSAGE);
  }

  return res.status(200).json({
    message: "CGPA unchanged",
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

  // Branch, year and roll number are verified academic fields (see updateCgpa).
  const changed =
    (branch !== undefined && branch !== null && String(branch) !== String(student.branch)) ||
    (year !== undefined && year !== null && Number(year) !== Number(student.year)) ||
    (rollNumber !== undefined && rollNumber !== null && String(rollNumber) !== String(student.rollNumber));

  if (changed) {
    throw new ErrorHandler(403, ACADEMIC_LOCKED_MESSAGE);
  }

  return res.status(200).json({
    message: "Academic information unchanged",
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