const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Student = require("../models/student");
const Company = require("../models/company");
const ErrorHandler = require("../utils/ErrorHandle");
const ErrorWrapper = require("../utils/ErrorWrapper");
const roleCheck = require("./roleCheck");

const jwtVerify = ErrorWrapper(async (req, res, next) => {
  let token = req.cookies?.token;

  if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new ErrorHandler(401, "Unauthorized: No token provided");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "GeetaUniversityPlacementConnect");
    
    // Fetch user and check status
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      throw new ErrorHandler(401, "Unauthorized: User no longer exists");
    }
    
    if (!user.isActive) {
      throw new ErrorHandler(403, "Access Denied: Account is deactivated");
    }

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof ErrorHandler) {
      throw err;
    }
    throw new ErrorHandler(401, "Unauthorized: Invalid or expired token");
  }
});

// Fetch associated student or company profile
const getAssociatedDetails = ErrorWrapper(async (req, res, next) => {
  if (req.user) {
    if (req.user.role === "student") {
      const student = await Student.findOne({ userId: req.user.id });
      if (student) {
        req.student = student;
      }
    } else if (req.user.role === "company" || req.user.role === "recruiter") {
      // Support both new schema (userId) and old schema (recruiterId) for fallback compatibility
      const company = await Company.findOne({
        $or: [{ recruiterId: req.user.id }, { userId: req.user.id }]
      });
      if (company) {
        req.company = company;
      }
    }
  }
  next();
});

module.exports = { 
  jwtVerify,
  authorizeRoles: roleCheck,
  getAssociatedDetails
};
