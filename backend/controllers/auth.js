const crypto = require("crypto");
const User = require("../models/User");
const Student = require("../models/student");
const Company = require("../models/company");
const Application = require("../models/application");
const ErrorWrapper = require("../utils/ErrorWrapper");
const ErrorHandler = require("../utils/ErrorHandle");
const { sendEmail } = require("../utils/email");

// Register handler
module.exports.postRegister = ErrorWrapper(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    throw new ErrorHandler(400, "Name, email, password, and role are required");
  }

  const validRoles = ["student", "company", "placementCell", "admin"];
  if (!validRoles.includes(role)) {
    throw new ErrorHandler(400, "Invalid role selection");
  }

  // Check if user already exists
  const cleanEmail = email ? email.trim().toLowerCase() : "";
  const existingUser = await User.findOne({ email: cleanEmail });
  if (existingUser) {
    throw new ErrorHandler(400, "A user with this email already exists");
  }

  let savedUser;

  // Handle student registration specifics
  if (role === "student") {
    const { branch, year, rollNumber, cgpa, phone } = req.body;
    if (!branch || !year || !rollNumber || cgpa === undefined) {
      throw new ErrorHandler(
        400,
        "Branch, year, roll number, and CGPA are required for students",
      );
    }

    const existingRoll = await Student.findOne({ rollNumber });
    if (existingRoll) {
      throw new ErrorHandler(
        400,
        "A student with this roll number already exists",
      );
    }

    // Create User
    const newUser = new User({ name, email, password, role });
    savedUser = await newUser.save();

    // Create Student Profile
    const newStudent = new Student({
      userId: savedUser._id,
      name,
      email,
      branch,
      year,
      rollNumber,
      cgpa,
      phone,
    });
    const savedStudent = await newStudent.save();

    // Link Profile Ref to User
    savedUser.profileRef = savedStudent._id;
    savedUser.profileModel = "Student";
    await savedUser.save();

    return res.status(201).json({
      success: true,
      message: "Student registered successfully",
      data: {
        userId: savedUser._id,
        studentId: savedStudent._id,
      },
    });
  }

  // Handle company registration specifics
  if (role === "company") {
    const {
      companyName,
      industry,
      website,
      hrContactName,
      hrContactPhone,
      address,
    } = req.body;
    if (!companyName) {
      throw new ErrorHandler(
        400,
        "Company name is required for company recruiters",
      );
    }

    // Create User (Company) - initial isApproved is false, needs admin approval!
    const newUser = new User({
      name,
      email,
      password,
      role,
      isApproved: false,
    });
    savedUser = await newUser.save();

    // Create Company Profile
    const newCompany = new Company({
      name: companyName,
      recruiterId: savedUser._id,
      recruiterEmail: email,
      industry,
      website,
      hrContactName,
      hrContactPhone,
      address,
      approved: false,
    });
    const savedCompany = await newCompany.save();

    // Link Profile Ref to User
    savedUser.profileRef = savedCompany._id;
    savedUser.profileModel = "Company";
    await savedUser.save();

    return res.status(201).json({
      success: true,
      message:
        "Company recruiter registered successfully. Pending admin approval.",
      data: {
        userId: savedUser._id,
        companyId: savedCompany._id,
      },
    });
  }

  // Admin or Placement Cell
  const newUser = new User({ name, email, password, role });
  savedUser = await newUser.save();

  return res.status(201).json({
    success: true,
    message: `${role.charAt(0).toUpperCase() + role.slice(1)} registered successfully`,
    data: {
      userId: savedUser._id,
    },
  });
});

// Login handler
// module.exports.postLogin = ErrorWrapper(async (req, res, next) => {
//   const { email, rollNumber, password } = req.body;

//   if ((!email && !rollNumber) || !password) {
//     throw new ErrorHandler(400, "Please provide email or roll number, and password");
//   }

//   let user;

//   // Find user by roll number or email
//   if (rollNumber) {
//     const student = await Student.findOne({ rollNumber });
//     if (!student) {
//       throw new ErrorHandler(404, "No student found with this roll number");
//     }
//     user = await User.findById(student.userId);
//   } else {
//     const cleanEmail = email ? email.trim().toLowerCase() : "";
//     user = await User.findOne({ email: cleanEmail });
//   }

//   if (!user) {
//     throw new ErrorHandler(404, "User not found");
//   }

//   // Check active status
//   if (!user.isActive) {
//     throw new ErrorHandler(403, "Access Denied: Account is deactivated");
//   }

//   // Check password
//   const isMatch = await user.comparePassword(password);
//   if (!isMatch) {
//     throw new ErrorHandler(401, "Invalid credentials");
//   }

//   // Check company approval status
//   if (user.role === "company") {
//     if (!user.isApproved) {
//       throw new ErrorHandler(403, "Access Denied: Company account is pending admin approval");
//     }
//   }

//   // Update last login
//   user.lastLogin = new Date();
//   await user.save();

//   // Generate Token
//   const token = user.generateToken();

//   // Set Cookie
//   res.cookie("token", token, {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === "production",
//     sameSite: "lax",
//     maxAge: 24 * 60 * 60 * 1000, // 1 day
//   });

//   return res.status(200).json({
//     success: true,
//     message: "Logged in successfully",
//     data: {
//       token,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//         profileRef: user.profileRef,
//       },
//     },
//   });
// });

module.exports.postLogin = ErrorWrapper(async (req, res, next) => {
  const { email, rollNumber, password } = req.body;

  if (!email && !rollNumber) {
    throw new ErrorHandler(400, "Please provide either email or roll number");
  }

  if (!password) {
    throw new ErrorHandler(400, "Please provide a password");
  }

  let userExists;

  if (rollNumber) {
    const student = await Student.findOne({ rollNumber: rollNumber.trim() });
    if (!student) {
      throw new ErrorHandler(404, "No student found with this roll number");
    }
    userExists = await User.findById(student.userId);
  } else {
    const cleanEmail = email ? email.trim().toLowerCase() : "";
    userExists = await User.findOne({ email: cleanEmail });
  }

  if (!userExists) {
    throw new ErrorHandler(404, "User not found");
  }

  // Check password
  const isMatch = await userExists.comparePassword(password);
  if (!isMatch) {
    throw new ErrorHandler(401, "Invalid credentials");
  }
  // Check active status
  if (!userExists.isActive) {
    throw new ErrorHandler(403, "Access Denied: Account is deactivated");
  }

  // Check company approval status
  if (userExists.role === "company") {
    if (!userExists.isApproved) {
      throw new ErrorHandler(
        403,
        "Access Denied: Company account is pending admin approval",
      );
    }
  }

  // Update last login
  userExists.lastLogin = new Date();
  await userExists.save();

  // Generate Token
  const token = userExists.generateToken();

  // Set Cookie
  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return res.status(200).json({
    success: true,
    message: "Logged in successfully",
    data: {
      token,
      user: {
        id: userExists._id,
        name: userExists.name,
        email: userExists.email,
        role: userExists.role,
        profileRef: userExists.profileRef,
      },
    },
  });
});

// Logout handler
module.exports.postLogout = ErrorWrapper(async (req, res, next) => {
  res.clearCookie("token");
  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
    data: {},
  });
});

// Get current logged-in user profile info
module.exports.me = ErrorWrapper(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) {
    throw new ErrorHandler(404, "User not found");
  }

  let details = null;

  if (user.role === "student") {
    details = await Student.findOne({ userId: user._id });
  } else if (user.role === "company") {
    const rawDetails = await Company.findOne({ recruiterId: user._id }).populate(
      "jobPostings"
    );
    if (rawDetails) {
      details = rawDetails.toObject();
      if (details.jobPostings && details.jobPostings.length > 0) {
        const jobPostingsWithCounts = [];
        for (const job of details.jobPostings) {
          const applicantCount = await Application.countDocuments({ jobId: job._id });
          job.applicantCount = applicantCount;
          jobPostingsWithCounts.push(job);
        }
        details.jobPostings = jobPostingsWithCounts;
      }
    }
  }

  return res.status(200).json({
    success: true,
    message: "User details retrieved",
    data: {
      user,
      details,
    },
  });
});

// Forgot Password handler
module.exports.forgotPassword = ErrorWrapper(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    throw new ErrorHandler(400, "Please provide an email address");
  }

  const cleanEmail = email ? email.trim().toLowerCase() : "";
  const user = await User.findOne({ email: cleanEmail });
  if (!user) {
    throw new ErrorHandler(404, "No user found with this email");
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  // Create reset url
  // Fallback to localhost if FRONTEND_URL is not set
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to:\n\n${resetUrl}\n\nThis link will expire in 10 minutes.`;

  try {
    await sendEmail({
      to: user.email,
      subject: "PlacementConnect - Password Reset Request",
      text: message,
      html: `<p>You requested a password reset for PlacementConnect. Click the link below to reset it:</p><a href="${resetUrl}">${resetUrl}</a><p>This link expires in 10 minutes.</p>`,
    });

    return res.status(200).json({
      success: true,
      message: "Email sent with password reset link",
      data: {},
    });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    throw new ErrorHandler(
      500,
      "Email could not be sent. Please try again later.",
    );
  }
});

// Reset Password handler
module.exports.resetPassword = ErrorWrapper(async (req, res, next) => {
  const { password } = req.body;
  const { token } = req.params;

  if (!password) {
    throw new ErrorHandler(400, "Please provide a new password");
  }

  // Hash the parameter token to match stored hashed token
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    throw new ErrorHandler(400, "Invalid or expired reset token");
  }

  // Set new password
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  return res.status(200).json({
    success: true,
    message: "Password reset successfully",
    data: {},
  });
});

// Change Password handler
module.exports.changePassword = ErrorWrapper(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ErrorHandler(400, "Please provide old and new passwords");
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ErrorHandler(404, "User not found");
  }

  // Check password
  const isMatch = await user.comparePassword(oldPassword);
  if (!isMatch) {
    throw new ErrorHandler(401, "Incorrect current password");
  }

  // Update password
  user.password = newPassword;
  await user.save();

  return res.status(200).json({
    success: true,
    message: "Password changed successfully",
    data: {},
  });
});
