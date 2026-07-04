const Company = require("../models/company");
const User = require("../models/User");
const Student = require("../models/student");
const ErrorWrapper = require("../utils/ErrorWrapper");
const ErrorHandler = require("../utils/ErrorHandle");
const { sendEmail } = require("../utils/email");

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
    await recruiter.save();

    // Send email alert to recruiter
    await sendEmail({
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
    });
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
