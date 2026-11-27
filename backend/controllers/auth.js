const crypto = require("crypto");
const User = require("../models/User");
const Student = require("../models/student");
const Company = require("../models/company");
const Application = require("../models/application");
const ErrorWrapper = require("../utils/ErrorWrapper");
const ErrorHandler = require("../utils/ErrorHandle");
const { sendEmail } = require("../utils/email");
const { getClientBaseUrl } = require("../config/env");
const { setAuthCookie, clearAuthCookie } = require("../utils/authToken");
const { verifyGoogleCredential } = require("../utils/google");

const PUBLIC_ROLES = ["student", "company"];
const STAFF_ROLES = ["admin", "placementCell"];

const FORGOT_PASSWORD_RESPONSE = {
  success: true,
  message: "If an account exists for that email, a password reset link has been sent.",
  data: {},
};

// A real bcrypt hash compared against when the account does not exist, so a login
// attempt takes the same time whether or not the email is registered.
const DUMMY_PASSWORD_HASH = "$2b$12$OfHKzsijxINkXtTIz7EYhutQ9uA7i557FArKietLGu6pnBUKSB5fS";

const LOCKED_MESSAGE = "Too many failed sign-in attempts. Please try again in a few minutes.";

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  profileRef: user.profileRef,
});

// Checks shared by every sign-in method. On success sets the session cookie and returns
// the token in the body as well (the SPA also sends it as a Bearer header).
const issueSession = async (res, user, message = "Logged in successfully") => {
  if (!user.isActive) {
    throw new ErrorHandler(403, "Access Denied: Account is deactivated");
  }
  if (user.role === "company" && !user.isApproved) {
    throw new ErrorHandler(403, "Access Denied: Company account is pending admin approval");
  }

  user.resetFailedLogins();
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = user.generateToken();
  setAuthCookie(res, token);

  return res.status(200).json({
    success: true,
    message,
    data: { token, user: publicUser(user) },
  });
};

// Register handler. Either a password or a Google credential (ID token) is required.
// With Google, the email comes from the verified Google account, not from the form.
module.exports.postRegister = ErrorWrapper(async (req, res, next) => {
  const { name, role, googleCredential } = req.body;
  let { email, password } = req.body;
  let googleId;

  if (googleCredential) {
    const identity = await verifyGoogleCredential(googleCredential);
    email = identity.email;
    googleId = identity.googleId;
    password = undefined;
  }

  if (!name || !email || (!password && !googleId) || !role) {
    throw new ErrorHandler(400, "Name, email, password, and role are required");
  }

  // Only students and companies may self-register. Staff accounts (admin, placementCell)
  // are created by an admin via POST /api/admin/users or by `npm run seed:admin`.
  if (STAFF_ROLES.includes(role)) {
    throw new ErrorHandler(403, "Staff accounts cannot be self-registered");
  }
  if (!PUBLIC_ROLES.includes(role)) {
    throw new ErrorHandler(400, "Invalid role selection");
  }

  // Check if user already exists
  const cleanEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne(
    googleId ? { $or: [{ email: cleanEmail }, { googleId }] } : { email: cleanEmail },
  );
  if (existingUser) {
    throw new ErrorHandler(400, "A user with this email already exists");
  }

  const authFields = {
    name,
    email: cleanEmail,
    password,
    role,
    googleId,
    authProvider: googleId ? "google" : "local",
  };

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
    const newUser = new User(authFields);
    savedUser = await newUser.save();

    // Create Student Profile
    const newStudent = new Student({
      userId: savedUser._id,
      name,
      email: cleanEmail,
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

    // Create User (Company) - pending admin approval
    const newUser = new User({ ...authFields, isApproved: false });
    savedUser = await newUser.save();

    // Create Company Profile - pending admin approval
    const newCompany = new Company({
      name: companyName,
      recruiterId: savedUser._id,
      recruiterEmail: cleanEmail,
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
        "Company recruiter registered successfully. The account is pending admin approval.",
      data: {
        userId: savedUser._id,
        companyId: savedCompany._id,
        approvalStatus: "pending",
      },
    });
  }
});

// Login handler (email or roll number + password)
module.exports.postLogin = ErrorWrapper(async (req, res, next) => {
  const { email, rollNumber, password } = req.body;

  if (!email && !rollNumber) {
    throw new ErrorHandler(400, "Please provide either email or roll number");
  }

  if (!password) {
    throw new ErrorHandler(400, "Please provide a password");
  }

  let user;

  if (rollNumber) {
    const student = await Student.findOne({ rollNumber: String(rollNumber).trim() });
    user = student ? await User.findById(student.userId) : null;
  } else {
    const cleanEmail = email ? email.trim().toLowerCase() : "";
    user = await User.findOne({ email: cleanEmail });
  }

  // Same response (and similar timing) for unknown accounts and wrong passwords,
  // so the endpoint cannot be used to find out which emails are registered.
  if (!user) {
    await User.prototype.comparePassword.call({ password: DUMMY_PASSWORD_HASH }, password);
    throw new ErrorHandler(401, "Invalid credentials");
  }

  if (user.isLocked()) {
    throw new ErrorHandler(429, LOCKED_MESSAGE);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await user.registerFailedLogin();
    if (user.isLocked()) {
      throw new ErrorHandler(429, LOCKED_MESSAGE);
    }
    throw new ErrorHandler(401, "Invalid credentials");
  }

  return issueSession(res, user);
});

// "Continue with Google". Signs in an existing account, linking the Google identity on
// first use (Google has verified the email). For a new email nothing is created: the
// client is told to finish registration by sending the same credential to /register.
module.exports.postGoogleAuth = ErrorWrapper(async (req, res, next) => {
  const identity = await verifyGoogleCredential(req.body.credential);

  let user = await User.findOne({ googleId: identity.googleId });
  if (!user) {
    user = await User.findOne({ email: identity.email });
    if (user) {
      if (user.googleId && user.googleId !== identity.googleId) {
        throw new ErrorHandler(401, "This account is linked to a different Google account");
      }
      user.googleId = identity.googleId;
    }
  }

  if (!user) {
    return res.status(200).json({
      success: true,
      message: "No account exists for this Google email yet. Please complete registration.",
      data: {
        needsRegistration: true,
        email: identity.email,
        name: identity.name,
      },
    });
  }

  return issueSession(res, user);
});

// Logout handler (this browser only)
module.exports.postLogout = ErrorWrapper(async (req, res, next) => {
  clearAuthCookie(res);
  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
    data: {},
  });
});

// Log out of every device: revokes all tokens issued so far.
module.exports.postLogoutAll = ErrorWrapper(async (req, res, next) => {
  await User.updateOne({ _id: req.user._id }, { $inc: { tokenVersion: 1 } });
  clearAuthCookie(res);
  return res.status(200).json({
    success: true,
    message: "Logged out from all devices",
    data: {},
  });
});

// Get current logged-in user profile info
module.exports.me = ErrorWrapper(async (req, res, next) => {
  const user = await User.findById(req.user.id).select(
    "-password -resetPasswordToken -resetPasswordExpire -tokenVersion -failedLoginAttempts -lockUntil",
  );
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

  // Always answer the same way, whether or not the account exists.
  if (!user || !user.isActive) {
    return res.status(200).json(FORGOT_PASSWORD_RESPONSE);
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${getClientBaseUrl()}/reset-password/${resetToken}`;
  const message = `You are receiving this email because you (or someone else) requested a password reset for your PlacementConnect account. Open the link below to choose a new password:\n\n${resetUrl}\n\nThis link will expire in 10 minutes. If you did not request this, you can ignore this email.`;

  let delivered = false;
  try {
    const result = await sendEmail({
      to: user.email,
      subject: "PlacementConnect - Password Reset Request",
      text: message,
      html: `<p>You requested a password reset for PlacementConnect. Click the link below to reset it:</p><a href="${resetUrl}">${resetUrl}</a><p>This link expires in 10 minutes. If you did not request this, you can ignore this email.</p>`,
    });
    delivered = Boolean(result && result.sent);
  } catch (err) {
    delivered = false;
  }

  if (!delivered) {
    // Don't leave a usable token around if the email never went out.
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    console.error("[forgot-password] Reset email was not delivered (SMTP not configured or failed).");
  }

  return res.status(200).json(FORGOT_PASSWORD_RESPONSE);
});

// Reset Password handler
module.exports.resetPassword = ErrorWrapper(async (req, res, next) => {
  const { password } = req.body;
  const { token } = req.params;

  if (!password) {
    throw new ErrorHandler(400, "Please provide a new password");
  }

  // Hash the parameter token to match stored hashed token
  if (typeof token !== "string" || !/^[a-f0-9]{40}$/i.test(token)) {
    throw new ErrorHandler(400, "Invalid or expired reset token");
  }

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

  // Set the new password and sign out every existing session.
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  user.resetFailedLogins();
  await user.save();
  clearAuthCookie(res);

  return res.status(200).json({
    success: true,
    message: "Password reset successfully",
    data: {},
  });
});

// Change Password handler. Accounts created with Google have no password yet and may
// set one without oldPassword. Other sessions are signed out; this one gets a new token.
module.exports.changePassword = ErrorWrapper(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;

  if (!newPassword) {
    throw new ErrorHandler(400, "Please provide a new password");
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ErrorHandler(404, "User not found");
  }

  if (user.password) {
    if (!oldPassword) {
      throw new ErrorHandler(400, "Please provide old and new passwords");
    }
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      throw new ErrorHandler(401, "Incorrect current password");
    }
    if (await user.comparePassword(newPassword)) {
      throw new ErrorHandler(400, "New password must be different from the current password");
    }
  }

  user.password = newPassword;
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();

  const token = user.generateToken();
  setAuthCookie(res, token);

  return res.status(200).json({
    success: true,
    message: "Password changed successfully",
    data: { token },
  });
});
