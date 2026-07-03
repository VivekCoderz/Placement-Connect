const User = require("../models/user");
const Student = require("../models/student");
const Company = require("../models/company");
const ErrorWrapper = require("../utils/ErrorWrapper");
const ErrorHandler = require("../utils/ErrorHandle");

// Register handler
module.exports.postRegister = ErrorWrapper(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    throw new ErrorHandler(400, "Name, email, password, and role are required");
  }

  const validRoles = ["student", "recruiter", "placementCell", "admin"];
  if (!validRoles.includes(role)) {
    throw new ErrorHandler(400, "Invalid role selection");
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ErrorHandler(400, "A user with this email already exists");
  }

  // Handle student registration specifics
  if (role === "student") {
    const { branch, year, rollNumber, cgpa, phone } = req.body;
    if (!branch || !year || !rollNumber || cgpa === undefined) {
      throw new ErrorHandler(400, "Branch, year, roll number, and CGPA are required for students");
    }

    const existingRoll = await Student.findOne({ rollNumber });
    if (existingRoll) {
      throw new ErrorHandler(400, "A student with this roll number already exists");
    }

    // Create User
    const newUser = new User({ name, email, password, role });
    const savedUser = await newUser.save();

    // Create Student
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
    await newStudent.save();

    return res.status(201).json({
      message: "Student registered successfully",
      userId: savedUser._id,
    });
  }

  // Handle recruiter registration specifics
  if (role === "recruiter") {
    const { companyName, industry } = req.body;
    if (!companyName) {
      throw new ErrorHandler(400, "Company name is required for recruiters");
    }

    // Create User (Recruiter) - initial isActive is false, waiting for approval
    const newUser = new User({ name, email, password, role, isActive: false });
    const savedUser = await newUser.save();

    // Create Company
    const newCompany = new Company({
      name: companyName,
      recruiterId: savedUser._id,
      recruiterEmail: email,
      industry,
      approved: false,
    });
    await newCompany.save();

    return res.status(201).json({
      message: "Recruiter registered successfully. Account is pending admin approval.",
      userId: savedUser._id,
    });
  }

  // Admin or Placement Cell
  const newUser = new User({ name, email, password, role });
  const savedUser = await newUser.save();

  return res.status(201).json({
    message: `${role.charAt(0).toUpperCase() + role.slice(1)} registered successfully`,
    userId: savedUser._id,
  });
});

// Login handler
module.exports.postLogin = ErrorWrapper(async (req, res, next) => {
  const { email, rollNumber, password } = req.body;

  if ((!email && !rollNumber) || !password) {
    throw new ErrorHandler(400, "Please provide email or roll number, and password");
  }

  let user;

  // If rollNumber is provided, find user through Student
  if (rollNumber) {
    const student = await Student.findOne({ rollNumber });
    if (!student) {
      throw new ErrorHandler(404, "No student found with this roll number");
    }
    user = await User.findById(student.userId);
  } else {
    user = await User.findOne({ email });
  }

  if (!user) {
    throw new ErrorHandler(404, "User not found");
  }

  // Check if password matches
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ErrorHandler(401, "Invalid credentials");
  }

  // Check recruiter company approval
  if (user.role === "recruiter") {
    const company = await Company.findOne({ recruiterId: user._id });
    if (!company || !company.approved) {
      throw new ErrorHandler(403, "Access Denied: Recruiter account is pending admin approval");
    }
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate Token
  const token = user.generateToken();

  // Set Cookie
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });

  return res.status(200).json({
    message: "Logged in successfully",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

// Logout handler
module.exports.postLogout = ErrorWrapper(async (req, res, next) => {
  res.clearCookie("token");
  return res.status(200).json({ message: "Logged out successfully" });
});

// Get profile handler
module.exports.getProfile = ErrorWrapper(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) {
    throw new ErrorHandler(404, "User not found");
  }

  let details = null;

  if (user.role === "student") {
    details = await Student.findOne({ userId: user._id });
  } else if (user.role === "recruiter") {
    details = await Company.findOne({ recruiterId: user._id }).populate("jobPostings");
  }

  return res.status(200).json({
    user,
    details,
  });
});
