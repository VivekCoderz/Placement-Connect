const { COOKIE_NAME, verifyAuthToken, AuthTokenError } = require("../utils/authToken");
const Student = require("../models/student");
const Company = require("../models/company");
const ErrorHandler = require("../utils/ErrorHandle");
const ErrorWrapper = require("../utils/ErrorWrapper");
const roleCheck = require("./roleCheck");

const jwtVerify = ErrorWrapper(async (req, res, next) => {
  let token = req.cookies?.[COOKIE_NAME];

  if (!token && typeof req.headers.authorization === "string" && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.slice(7).trim();
  }

  if (!token) {
    throw new ErrorHandler(401, "Unauthorized: No token provided");
  }

  try {
    req.user = await verifyAuthToken(token);
  } catch (err) {
    if (err instanceof AuthTokenError) {
      throw new ErrorHandler(err.status, err.message);
    }
    throw err;
  }
  next();
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
