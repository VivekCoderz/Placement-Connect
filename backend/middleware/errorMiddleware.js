const ErrorHandler = require("../utils/ErrorHandle");

const errorMiddleware = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Handle MongoDB duplicate key errors (error code 11000)
  if (err.code === 11000) {
    statusCode = 400;
    const duplicateField = Object.keys(err.keyValue || {})[0] || "field";
    message = `A record with this ${duplicateField} already exists.`;
  }

  // Handle Mongoose Validation Error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors).map((val) => val.message).join(", ");
  }

  // Handle CastError (invalid Mongoose ObjectId)
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Resource not found with invalid ID: ${err.value}`;
  }

  // Handle JsonWebTokenError
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Unauthorized: Invalid token";
  }

  // Handle TokenExpiredError
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Unauthorized: Token expired";
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = errorMiddleware;
