const ErrorHandler = require("./ErrorHandle");

const ErrorWrapper = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (err) {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    // Handle MongoDB duplicate key errors (error code 11000)
    if (err.code === 11000) {
      statusCode = 400;
      const duplicateField = Object.keys(err.keyValue || {})[0] || "field";
      message = `A record with this ${duplicateField} already exists.`;
    }

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

module.exports = ErrorWrapper;