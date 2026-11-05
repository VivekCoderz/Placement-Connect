const Company = require("../models/company");
const User = require("../models/User");
const Student = require("../models/student");
const ErrorWrapper = require("../utils/ErrorWrapper");
const ErrorHandler = require("../utils/ErrorHandle");
const { sendEmail } = require("../utils/email");

// Create a staff account (admin or placementCell). Admin only.
module.exports.createStaffUser = ErrorWrapper(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ErrorHandler(400, "A user with this email already exists");
  }

  const user = await User.create({ name, email, password, role, isApproved: true, isActive: true });

  return res.status(201).json({
    success: true,
    message: `${role} account created successfully`,
    data: { userId: user._id, name: user.name, email: user.email, role: user.role },
  });
});

// Update a student's verified academic record (CGPA, branch, year, roll number).
// Students cannot change these themselves; only admin / placementCell (TPO) can.
module.exports.updateStudentAcademic = ErrorWrapper(async (req, res, next) => {
  const { studentId } = req.params;
  const { cgpa, branch, year, rollNumber } = req.body;

  const student = await Student.findById(studentId);
  if (!student) {
    throw new ErrorHandler(404, "Student not found");
  }

  if (rollNumber !== undefined && rollNumber !== student.rollNumber) {
    const taken = await Student.exists({ rollNumber, _id: { $ne: student._id } });
    if (taken) {
      throw new ErrorHandler(400, "Roll number already in use");
    }
    student.rollNumber = rollNumber;
  }
  if (cgpa !== undefined) student.cgpa = cgpa;
  if (branch !== undefined) student.branch = branch;
  if (year !== undefined) student.year = year;

  await student.save();

  return res.status(200).json({
    success: true,
    message: "Student academic record updated",
    student,
  });
});

// Approve company and its recruiter
module.exports.approveCompany = ErrorWrapper(async (req, res, next) => {
  const { companyId } = req.body;

  if (!companyId) {
    throw new ErrorHandler(400, "Company ID is required");
  }

  const company = await Company.findById(companyId);
  if (!company) {
    throw new ErrorHandler(404, "Company not found");
  }

  company.approved = true;
  await company.save();

  // Activate recruiter User account
  const recruiter = await User.findById(company.recruiterId);
  if (recruiter) {
    recruiter.isActive = true;
    recruiter.isApproved = true;
    await recruiter.save();

    // Send email alert to recruiter (failure must not fail the approval)
    sendEmail({
      to: recruiter.email,
      subject: "Recruiter Profile Approved - PlacementConnect",
      html: `
        <h3>Dear ${recruiter.name},</h3>
        <p>Your recruiter profile and company registration for <strong>${company.name}</strong> have been approved by the admin.</p>
        <p>You can now log in to the portal, post placement drives/jobs, and review student applications.</p>
        <br/>
        <p>Regards,</p>
        <p>Placement Cell, Geeta University</p>
      `,
    }).catch((err) => console.error("Approval email delivery failed:", err.message));
  }

  return res.status(200).json({
    message: `Company '${company.name}' and recruiter profile approved successfully`,
    company,
  });
});

// List all companies
module.exports.getCompanies = ErrorWrapper(async (req, res, next) => {
  const companies = await Company.find().populate("recruiterId", "name email isActive lastLogin");
  return res.status(200).json({ companies });
});

// List all students
module.exports.getStudents = ErrorWrapper(async (req, res, next) => {
  const students = await Student.find().populate("userId", "name email isActive lastLogin");
  return res.status(200).json({ students });
});

// Reject or deactivate company and its recruiter
module.exports.rejectCompany = ErrorWrapper(async (req, res, next) => {
  const { companyId } = req.body;

  if (!companyId) {
    throw new ErrorHandler(400, "Company ID is required");
  }

  const company = await Company.findById(companyId);
  if (!company) {
    throw new ErrorHandler(404, "Company not found");
  }

  company.approved = false;
  await company.save();

  // Deactivate recruiter User account
  const recruiter = await User.findById(company.recruiterId);
  if (recruiter) {
    recruiter.isActive = false;
    recruiter.isApproved = false;
    await recruiter.save();

    // Send email alert to recruiter
    try {
      await sendEmail({
        to: recruiter.email,
        subject: "Recruiter Account Status Update - PlacementConnect",
        html: `
          <h3>Dear ${recruiter.name},</h3>
          <p>Your recruiter profile and company registration for <strong>${company.name}</strong> have been suspended or rejected by the admin.</p>
          <p>Please contact the Geeta University Placement Cell if you believe this is in error.</p>
          <br/>
          <p>Regards,</p>
          <p>Placement Cell, Geeta University</p>
        `,
      });
    } catch (emailErr) {
      console.error("Failed to send rejection email:", emailErr);
    }
  }

  return res.status(200).json({
    message: `Company '${company.name}' and recruiter profile suspended/rejected successfully`,
    company,
  });
});

// Toggle user isActive status (Activate / Suspend)
module.exports.toggleUserStatus = ErrorWrapper(async (req, res, next) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    throw new ErrorHandler(404, "User not found");
  }

  user.isActive = !user.isActive;
  await user.save();

  // If user is a recruiter, keep the company's approved status synchronized
  if (user.role === "company") {
    const company = await Company.findOne({ recruiterId: user._id });
    if (company) {
      company.approved = user.isActive;
      await company.save();
    }
  }

  return res.status(200).json({
    message: `User '${user.name}' has been ${user.isActive ? 'activated' : 'suspended'} successfully`,
    user,
  });
});

const Job = require("../models/job");
// Toggle Job/Drive status (active / closed)
module.exports.toggleJobStatus = ErrorWrapper(async (req, res, next) => {
  const { jobId } = req.params;

  const job = await Job.findById(jobId);
  if (!job) {
    throw new ErrorHandler(404, "Job drive not found");
  }

  job.status = job.status === "active" ? "closed" : "active";
  await job.save();

  return res.status(200).json({
    message: `Job drive '${job.title}' status changed to '${job.status}'`,
    job,
  });
});

const Application = require("../models/application");
// Get overall admin stats
module.exports.getAdminStats = ErrorWrapper(async (req, res, next) => {
  const totalStudents = await Student.countDocuments();
  const placedStudents = await Student.countDocuments({ isPlaced: true });
  const totalCompanies = await Company.countDocuments();
  const pendingCompanies = await Company.countDocuments({ approved: false });
  const activeJobs = await Job.countDocuments({ status: "active" });
  const totalOffers = await Application.countDocuments({ status: "Selected" });

  const placementRate = totalStudents > 0 ? ((placedStudents / totalStudents) * 100).toFixed(1) : 0;

  return res.status(200).json({
    stats: {
      totalStudents,
      placedStudents,
      totalCompanies,
      pendingCompanies,
      activeJobs,
      totalOffers,
      placementRate
    }
  });
});

