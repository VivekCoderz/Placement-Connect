const multer = require("multer");

const GENERIC_5XX_MESSAGE = "Something went wrong on our side. Please try again later.";

const MULTER_MESSAGES = {
  LIMIT_FILE_SIZE: "Uploaded file is too large",
  LIMIT_FILE_COUNT: "Too many files uploaded",
  LIMIT_UNEXPECTED_FILE: "Unexpected file field",
  LIMIT_PART_COUNT: "Too many form parts",
  LIMIT_FIELD_KEY: "Form field name too long",
  LIMIT_FIELD_VALUE: "Form field value too long",
  LIMIT_FIELD_COUNT: "Too many form fields",
};

// Translate known error types into a status code and a message that is safe to show users.
const classifyError = (err) => {
  if (err instanceof multer.MulterError) {
    return {
      statusCode: err.code === "LIMIT_FILE_SIZE" ? 413 : 400,
      message: MULTER_MESSAGES[err.code] || "Invalid file upload",
    };
  }

  // MongoDB duplicate key
  if (err.code === 11000) {
    const duplicateField = Object.keys(err.keyValue || {})[0] || "field";
    return { statusCode: 400, message: `A record with this ${duplicateField} already exists.` };
  }

  if (err.name === "ValidationError" && err.errors) {
    return {
      statusCode: 400,
      message: Object.values(err.errors)
        .map((val) => val.message)
        .join(", "),
    };
  }

  if (err.name === "CastError") {
    return { statusCode: 400, message: `Invalid value for ${err.path || "identifier"}` };
  }

  if (err.name === "JsonWebTokenError") {
    return { statusCode: 401, message: "Unauthorized: Invalid token" };
  }

  if (err.name === "TokenExpiredError") {
    return { statusCode: 401, message: "Unauthorized: Token expired" };
  }

  // body-parser errors (malformed JSON, payload too large) carry `status` and `expose`.
  if (err.type && err.status && err.status < 500 && err.expose) {
    return {
      statusCode: err.status,
      message: err.type === "entity.parse.failed" ? "Malformed JSON body" : err.message,
    };
  }

  const statusCode = Number(err.statusCode) || 500;
  return { statusCode, message: err.message };
};

// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, req, res, next) => {
  let { statusCode, message } = classifyError(err);

  if (!Number.isInteger(statusCode) || statusCode < 400 || statusCode > 599) {
    statusCode = 500;
  }

  if (statusCode >= 500) {
    // Full details stay in the server logs only.
    console.error(`[${req.method} ${req.originalUrl}]`, err);
    message = GENERIC_5XX_MESSAGE;
  }

  if (res.headersSent) {
    return next(err);
  }

  return res.status(statusCode).json({
    success: false,
    message: message || "Request failed",
  });
};

module.exports = errorMiddleware;
module.exports.GENERIC_5XX_MESSAGE = GENERIC_5XX_MESSAGE;
