const ErrorHandler = require("../utils/ErrorHandle");

const roleCheck = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ErrorHandler(401, "Unauthorized: Authentication required"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          403,
          `Forbidden: Role '${req.user.role}' is not authorized to access this resource`
        )
      );
    }

    next();
  };
};

module.exports = roleCheck;
