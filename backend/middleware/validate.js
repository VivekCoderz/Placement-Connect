const ErrorHandler = require("../utils/ErrorHandle");

// Validate req.body (default) or another request part against a zod schema.
// On success the parsed (coerced/trimmed) value replaces the original.
const validate = (schema, source = "body") => (req, res, next) => {
  const result = schema.safeParse(req[source] ?? {});
  if (!result.success) {
    const message = result.error.issues
      .map((issue) => (issue.path.length ? `${issue.path.join(".")}: ${issue.message}` : issue.message))
      .join("; ");
    return next(new ErrorHandler(400, message || "Invalid request"));
  }
  if (source === "body") {
    req.body = result.data;
  }
  return next();
};

module.exports = validate;
