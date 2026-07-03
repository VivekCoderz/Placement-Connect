const jwt = require("jsonwebtoken");
const ErrorWrapper = require("../utils/ErrorWrapper");
const ErrorHandler = require("../utils/ErrorHandle");
const studentModel = require("../models/student");
const companyModel = require("../models/company");

// Verify JWT middleware
const jwtVerify = ErrorWrapper(async (req, res, next) => {
  let token = req.cookies?.token;

  if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new ErrorHandler(401, "Unauthorized: No token provided");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    throw new ErrorHandler(401, "Unauthorized: Invalid or expired token");
  }
});

// Authorize roles middleware
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Forbidden: Role '${req.user?.role || "unknown"}' is not allowed to access this resource`
      });
    }
    next();
  };
};

// Fetch student or recruiter company if applicable
const getAssociatedDetails = ErrorWrapper(async (req, res, next) => {
  if (req.user) {
    if (req.user.role === "student") {
      const student = await studentModel.findOne({ userId: req.user.id });
      if (student) {
        req.student = student;
      }
    } else if (req.user.role === "recruiter") {
      const company = await companyModel.findOne({ recruiterId: req.user.id });
      if (company) {
        req.company = company;
      }
    }
  }
  next();
});

module.exports = {
  jwtVerify,
  authorizeRoles,
  getAssociatedDetails
};
